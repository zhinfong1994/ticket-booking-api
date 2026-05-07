import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { TicketService } from '../ticket/ticket.service';
import { AuditService } from '../audit/audit.service';
import { pool } from '../db/db';
import { ORDER_STATUS } from './enums/order.enum';
import { randomUUID } from 'crypto';

jest.mock('../db/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('OrderService', () => {
  let service: OrderService;
  let ticketService: jest.Mocked<TicketService>;

  const mockQuery = pool.query as jest.Mock;
  const mockConnect = pool.connect as jest.Mock;

  const orderUUID = '85dfd960-1d85-456b-98f3-982b09f9283c';
  const tickets = [
    'aa7fee03-55ec-480c-bf1d-445f8674c786',
    'a39dae43-cff3-4cab-acf4-ea1bc1011ed9',
  ];
  const userId = '85dfd960-1d85-456b-98f3-982b09f9283c';
  const createIdempotencyKey = 'create-order-001';
  const confirmIdempotencyKey = 'confirm-order-001';

  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: TicketService,
          useValue: {
            reserveTickets: jest.fn(),
            confirmTickets: jest.fn(),
            releaseTickets: jest.fn(),
          },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    ticketService = module.get(TicketService);

    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();

    mockConnect.mockResolvedValue(mockClient);
    (randomUUID as jest.Mock).mockReturnValue(
      '85dfd960-1d85-456b-98f3-982b09f9283c',
    );
  });

  describe('findOrderByUser', () => {
    it('should return orders', async () => {
      const expiresAt = new Date('2026-05-07T18:30:00.000Z');
      const mockOrders = [
        {
          id: orderUUID,
          status: ORDER_STATUS.PENDING,
          tickets: ['t1'],
          expiresAt,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockOrders });

      const result = await service.findOrderByUser('user1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, status, tickets, expiresAt FROM orders'),
        ['user1'],
      );

      expect(result).toEqual([
        {
          id: orderUUID,
          status: ORDER_STATUS.PENDING,
          tickets: ['t1'],
          expiresAt: expiresAt.toISOString(),
        },
      ]);
    });
  });

  describe('createOrder', () => {
    it('should create order and reserve tickets', async () => {
      const dto = { userId, ticketIds: tickets, idempotencyKey: createIdempotencyKey };

      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: tickets.map((id) => ({ id, eventId: 'event-1' })) })
        .mockResolvedValue({});

      const result = await service.createOrder(dto);

      const orderId = orderUUID;

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE userId = $1 AND idempotencyKey = $2'),
        [dto.userId, dto.idempotencyKey],
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.id, t.eventId'),
        [dto.ticketIds, 'ACTIVE'],
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        expect.arrayContaining([orderId, dto.userId, dto.ticketIds, dto.idempotencyKey]),
      );

      expect(ticketService.reserveTickets).toHaveBeenCalledWith(
        {
          ticketIds: dto.ticketIds,
          orderId,
        },
        mockClient,
      );

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

      expect(result).toMatchObject({
        id: orderId,
        expiresAt: expect.any(String),
      });
    });

    it('should rollback on error', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.createOrder({ userId: 'u1', ticketIds: [], idempotencyKey: createIdempotencyKey }),
      ).rejects.toThrow();

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should reject tickets from different events', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            { id: tickets[0], eventId: 'event-1' },
            { id: tickets[1], eventId: 'event-2' },
          ],
        })
        .mockResolvedValueOnce({});

      await expect(service.createOrder({ userId, ticketIds: tickets, idempotencyKey: createIdempotencyKey })).rejects.toThrow(
        'Tickets in an order must belong to the same event',
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should return the existing order for the same create idempotency key', async () => {
      const existingExpiry = new Date('2026-05-07T18:30:00.000Z');

      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [{ id: orderUUID, expiresAt: existingExpiry }],
        })
        .mockResolvedValueOnce({});

      const result = await service.createOrder({
        userId,
        ticketIds: tickets,
        idempotencyKey: createIdempotencyKey,
      });

      expect(result).toEqual({
        id: orderUUID,
        expiresAt: existingExpiry.toISOString(),
      });
      expect(ticketService.reserveTickets).not.toHaveBeenCalled();
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order and tickets', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [
            {
              status: ORDER_STATUS.PENDING,
              expiresAt: new Date(Date.now() + 60_000),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({});

      const result = await service.confirmOrder({
        orderId: orderUUID,
        userId,
        idempotencyKey: confirmIdempotencyKey,
        paymentToken: 'tok_visa_4242',
        amount: 19.99,
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT status, expiresAt'),
        [orderUUID, userId],
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT orderId FROM payments WHERE userId = $1 AND idempotencyKey = $2 LIMIT 1',
        [userId, confirmIdempotencyKey],
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT orderId FROM payments WHERE orderId = $1 LIMIT 1',
        [orderUUID],
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payments'),
        expect.arrayContaining([orderUUID, userId, confirmIdempotencyKey, 'PAID']),
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status'),
        [ORDER_STATUS.CONFIRMED, orderUUID, userId],
      );

      expect(ticketService.confirmTickets).toHaveBeenCalledWith({
        orderId: orderUUID,
      }, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({ isSuccess: true });
    });

    it('should throw if order is not in PENDING state', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [
            {
              status: ORDER_STATUS.CANCELLED,
              expiresAt: new Date(Date.now() + 60_000),
            },
          ],
        })
        .mockResolvedValueOnce({});

      await expect(
        service.confirmOrder({
          orderId: orderUUID,
          userId,
          idempotencyKey: confirmIdempotencyKey,
          paymentToken: 'tok_visa_4242',
          amount: 19.99,
        }),
      ).rejects.toThrow('Order is not in PENDING state');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should cancel and reject expired orders during confirmation', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [
            {
              status: ORDER_STATUS.PENDING,
              expiresAt: new Date(Date.now() - 60_000),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      await expect(
        service.confirmOrder({
          orderId: orderUUID,
          userId,
          idempotencyKey: confirmIdempotencyKey,
          paymentToken: 'tok_visa_4242',
          amount: 19.99,
        }),
      ).rejects.toThrow('Order has expired');

      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE orders SET status = $1 WHERE id = $2',
        [ORDER_STATUS.CANCELLED, orderUUID],
      );
      expect(ticketService.releaseTickets).toHaveBeenCalledWith(
        { orderId: orderUUID },
        mockClient,
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should treat already confirmed orders as idempotent', async () => {
      mockClient.query.mockResolvedValue({});
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [
            {
              status: ORDER_STATUS.CONFIRMED,
              expiresAt: new Date(Date.now() + 60_000),
            },
          ],
        })
        .mockResolvedValueOnce({});

      const result = await service.confirmOrder({
        orderId: orderUUID,
        userId,
        idempotencyKey: confirmIdempotencyKey,
        paymentToken: 'tok_visa_4242',
        amount: 19.99,
      });

      expect(result).toEqual({ isSuccess: true });
      expect(ticketService.confirmTickets).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and release tickets', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await service.cancelOrder({ orderId: orderUUID, userId });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status'),
        [ORDER_STATUS.CANCELLED, orderUUID, userId, ORDER_STATUS.PENDING],
      );

      expect(ticketService.releaseTickets).toHaveBeenCalledWith(
        { orderId: orderUUID },
        mockClient,
      );

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({ isSuccess: true });
    });

    it('should throw if order is not in PENDING state', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({});

      await expect(service.cancelOrder({ orderId: orderUUID, userId })).rejects.toThrow(
        'Order is not in PENDING state',
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('releaseExpiredOrders', () => {
    it('should cancel expired orders and release tickets', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [{ id: orderUUID }],
        }) // update returning cancelled orders
        .mockResolvedValueOnce({});

      await service.releaseExpiredOrders();

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status'),
        [ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING],
      );
      expect(ticketService.releaseTickets).toHaveBeenCalledWith(
        { orderId: orderUUID },
        mockClient,
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });
});
