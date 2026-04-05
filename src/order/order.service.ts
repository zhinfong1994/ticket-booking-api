import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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
      `SELECT id, status, tickets FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows;
  }

  async createOrder(body: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const client: PoolClient = await pool.connect();
    const { userId, ticketIds } = body;
    const orderId = uuidv4();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders (id, user_id, tickets, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')`,
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

      await pool.query(`UPDATE orders SET status = $1 WHERE id = $2`, [
        ORDER_STATUS.CONFIRMED,
        orderId,
      ]);

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

      await pool.query(`UPDATE orders SET status = $1 WHERE id = $2`, [
        ORDER_STATUS.CANCELLED,
        orderId,
      ]);
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
}
