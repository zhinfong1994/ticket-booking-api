import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
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
import { AuditService } from '../audit/audit.service';
import { Cron } from '@nestjs/schedule';
import { EVENT_STATUS } from '../event/enums/event.enum';

interface Orders {
  id: string;
  status: ORDER_STATUS;
  tickets: string[];
  expiresAt: Date | null;
}

interface TicketSelectionRow {
  id: string;
  eventId: string;
}

interface OrderLockRow {
  status: ORDER_STATUS;
  expiresAt: Date | null;
}

interface IdempotentOrderRow {
  id: string;
  expiresAt: Date | null;
}

interface PaymentRow {
  orderId: string;
}

class OrderExpiredException extends BadRequestException {
  constructor() {
    super('Order has expired');
  }
}

@Injectable()
export class OrderService {
  constructor(
    private readonly ticketService: TicketService,
    private readonly auditService: AuditService,
  ) {}

  private requireIdempotencyKey(idempotencyKey: string | undefined): string {
    if (
      typeof idempotencyKey !== 'string' ||
      idempotencyKey.trim().length === 0
    ) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    return idempotencyKey;
  }

  private async processPayment(
    orderId: string,
    userId: string,
    idempotencyKey: string,
    paymentToken: string,
    amount: number,
    currency: string,
    client: PoolClient,
  ): Promise<void> {
    const existingIdempotentPayment = await client.query<PaymentRow>(
      `SELECT orderId FROM payments WHERE userId = $1 AND idempotencyKey = $2 LIMIT 1`,
      [userId, idempotencyKey],
    );

    const paymentForIdempotencyKey = existingIdempotentPayment.rows[0];

    if (paymentForIdempotencyKey) {
      if (paymentForIdempotencyKey.orderId !== orderId) {
        throw new ConflictException(
          'Idempotency key already used for a different payment',
        );
      }

      return;
    }

    const existingOrderPayment = await client.query<PaymentRow>(
      `SELECT orderId FROM payments WHERE orderId = $1 LIMIT 1`,
      [orderId],
    );

    if (existingOrderPayment.rows[0]) {
      return;
    }

    if (!paymentToken.startsWith('tok_')) {
      throw new BadRequestException('Payment authorization failed');
    }

    await client.query(
      `
        INSERT INTO payments (id, orderId, userId, idempotencyKey, status, providerReference, amount, currency, paidAt)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `,
      [
        randomUUID(),
        orderId,
        userId,
        idempotencyKey,
        'PAID',
        `pay_${randomUUID()}`,
        amount,
        currency,
      ],
    );
  }

  private async validateTicketSelection(
    ticketIds: string[],
    client: PoolClient,
  ): Promise<void> {
    const result = await client.query<TicketSelectionRow>(
      `
        SELECT t.id, t.eventId
        FROM tickets t
        INNER JOIN events e ON e.id = t.eventId
        WHERE t.id = ANY($1)
          AND e.status = $2
          AND e.dateTime > NOW()
      `,
      [ticketIds, EVENT_STATUS.ACTIVE],
    );

    if (result.rows.length !== ticketIds.length) {
      throw new BadRequestException(
        'Tickets must belong to an active upcoming event',
      );
    }

    const eventIds = new Set(result.rows.map((ticket) => ticket.eventId));

    if (eventIds.size !== 1) {
      throw new BadRequestException(
        'Tickets in an order must belong to the same event',
      );
    }
  }

  async findOrderByUser(userId: string): Promise<GetOrdersResponseDto[]> {
    const result = await pool.query<Orders>(
      `SELECT id, status, tickets, expiresAt FROM orders WHERE userId = $1 ORDER BY createdAt DESC`,
      [userId],
    );

    return result.rows.map((order) => ({
      ...order,
      expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
    }));
  }

  async createOrder(body: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const client: PoolClient = await pool.connect();
    const idempotencyKey = this.requireIdempotencyKey(
      body.idempotencyKey as string | undefined,
    );
    const { userId, ticketIds } = body;

    const orderId = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    try {
      await client.query('BEGIN');

      const existingOrder = await client.query<IdempotentOrderRow>(
        `
          SELECT id, expiresAt
          FROM orders
          WHERE userId = $1 AND idempotencyKey = $2
          ORDER BY createdAt DESC
          LIMIT 1
        `,
        [userId, idempotencyKey],
      );

      const idempotentOrder = existingOrder.rows[0];

      if (idempotentOrder) {
        await client.query('COMMIT');
        return {
          id: idempotentOrder.id,
          expiresAt: idempotentOrder.expiresAt
            ? idempotentOrder.expiresAt.toISOString()
            : expiresAt.toISOString(),
        };
      }

      await this.validateTicketSelection(ticketIds, client);

      await client.query(
        `INSERT INTO orders (id, userId, tickets, expiresAt, idempotencyKey) VALUES ($1, $2, $3, $4, $5)`,
        [orderId, userId, ticketIds, expiresAt, idempotencyKey],
      );

      await this.ticketService.reserveTickets({ ticketIds, orderId }, client);

      await client.query('COMMIT');

      void this.auditService.log({
        userId,
        action: 'ORDER_CREATED',
        resource: 'order',
        resourceId: orderId,
        metadata: { ticketIds, idempotencyKey },
      });

      return {
        id: orderId,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async confirmOrder(body: ConfirmOrderDto): Promise<ConfirmOrderResponseDto> {
    const idempotencyKey = this.requireIdempotencyKey(
      body.idempotencyKey as string | undefined,
    );
    const orderId = body.orderId;
    const userId = body.userId as string;
    const paymentToken = body.paymentToken as string;
    const amount = body.amount;
    const currency = body.currency ?? 'USD';

    const client: PoolClient = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderResult = await client.query<OrderLockRow>(
        `
          SELECT status, expiresAt
          FROM orders
          WHERE id = $1 AND userId = $2
          FOR UPDATE
        `,
        [orderId, userId],
      );

      const order = orderResult.rows[0];

      if (!order) {
        throw new BadRequestException('Order is not in PENDING state');
      }

      if (order.status === ORDER_STATUS.CONFIRMED) {
        await client.query('COMMIT');
        return { isSuccess: true };
      }

      if (order.status !== ORDER_STATUS.PENDING) {
        throw new BadRequestException('Order is not in PENDING state');
      }

      if (order.expiresAt && order.expiresAt.getTime() <= Date.now()) {
        await client.query(`UPDATE orders SET status = $1 WHERE id = $2`, [
          ORDER_STATUS.CANCELLED,
          orderId,
        ]);
        await this.ticketService.releaseTickets({ orderId }, client);
        await client.query('COMMIT');
        throw new OrderExpiredException();
      }

      await this.processPayment(
        orderId,
        userId,
        idempotencyKey,
        paymentToken,
        amount,
        currency,
        client,
      );

      const result = await client.query(
        `UPDATE orders SET status = $1 WHERE id = $2 AND userId = $3`,
        [ORDER_STATUS.CONFIRMED, orderId, userId],
      );

      if (result.rowCount === 0) {
        throw new BadRequestException('Order is not in PENDING state');
      }

      await this.ticketService.confirmTickets({ orderId }, client);

      await client.query('COMMIT');

      void this.auditService.log({
        userId,
        action: 'ORDER_CONFIRMED',
        resource: 'order',
        resourceId: orderId,
        metadata: { idempotencyKey, amount, currency },
      });

      return { isSuccess: true };
    } catch (err) {
      if (!(err instanceof OrderExpiredException)) {
        await client.query('ROLLBACK');
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async cancelOrder(body: CancelOrderDto): Promise<CancelOrderResponseDto> {
    const { orderId, userId } = body;
    const client: PoolClient = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE orders SET status = $1 WHERE id = $2 AND userId = $3 AND status = $4`,
        [ORDER_STATUS.CANCELLED, orderId, userId, ORDER_STATUS.PENDING],
      );

      if (result.rowCount === 0) {
        throw new BadRequestException('Order is not in PENDING state');
      }

      await this.ticketService.releaseTickets({ orderId }, client);
      await client.query('COMMIT');

      void this.auditService.log({
        userId,
        action: 'ORDER_CANCELLED',
        resource: 'order',
        resourceId: orderId,
      });

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
