import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { pool } from '../db/db';
import {
  CreateOrderResponseDto,
  CreateOrderDto,
} from './dtos/create-order.dto';
import {
  ConfirmOrderDto,
  ConfirmOrderResponseDto,
} from './dtos/confirm-order.dto';
import {
  CancelOrderDto,
  CancelOrderResponseDto,
} from './dtos/cancel-order.dto';
import { GetOrdersResponseDto } from './dtos/get-order.dto';
import { ORDER_STATUS } from './enums/order.enum';
import { TicketService } from '../ticket/ticket.service';
import { Cron } from '@nestjs/schedule';

interface Orders {
  id: string;
  status: ORDER_STATUS;
  tickets: string[];
}

@Injectable()
export class OrderService {
  constructor(private readonly ticketService: TicketService) {}

  async findOrderByUser(userId: string): Promise<GetOrdersResponseDto[]> {
    const result = await pool.query<Orders>(
      `SELECT id, status, tickets FROM orders WHERE userId = $1 ORDER BY createdAt DESC`,
      [userId],
    );

    return result.rows;
  }

  async createOrder(body: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const client: PoolClient = await pool.connect();
    const { userId, ticketIds } = body;

    const orderId = randomUUID();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders (id, userId, tickets, expiresAt) VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')`,
        [orderId, userId, ticketIds],
      );

      await this.ticketService.reserveTickets({ ticketIds, orderId }, client);

      await client.query('COMMIT');

      return {
        id: orderId,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async confirmOrder(body: ConfirmOrderDto): Promise<ConfirmOrderResponseDto> {
    const { orderId } = body;
    const client: PoolClient = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await pool.query(
        `UPDATE orders SET status = $1 WHERE id = $2 AND status = $3`,
        [ORDER_STATUS.CONFIRMED, orderId, ORDER_STATUS.PENDING],
      );

      if (result.rowCount === 0) {
        throw new BadRequestException('Order is not in PENDING state');
      }

      await this.ticketService.confirmTickets({ orderId });

      await client.query('COMMIT');
      return { isSuccess: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async cancelOrder(body: CancelOrderDto): Promise<CancelOrderResponseDto> {
    const { orderId } = body;
    const client: PoolClient = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await pool.query(
        `UPDATE orders SET status = $1 WHERE id = $2 AND status = $3`,
        [ORDER_STATUS.CANCELLED, orderId, ORDER_STATUS.PENDING],
      );

      if (result.rowCount === 0) {
        throw new BadRequestException('Order is not in PENDING state');
      }

      await this.ticketService.releaseTickets({ orderId }, client);
      await client.query('COMMIT');
      return { isSuccess: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  @Cron('* * * * *') // every minute
  async releaseExpiredOrders() {
    console.log('Running cron job to release expired orders...');
    const client: PoolClient = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query(
        `
          UPDATE orders SET status = $1
          WHERE status = $2
            AND expiresAt < NOW()
          RETURNING id
        `,
        [ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING],
      );

      const expiredOrderIds = (result.rows || []).map(
        (row) => row.id as string,
      );

      for (const orderId of expiredOrderIds) {
        await this.ticketService.releaseTickets({ orderId }, client);
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error releasing expired orders:', err);
      throw err;
    } finally {
      client.release();
    }
  }
}
