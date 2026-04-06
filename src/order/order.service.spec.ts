import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { TicketService } from '../ticket/ticket.service';
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
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    ticketService = module.get(TicketService);

    jest.clearAllMocks();

    mockConnect.mockResolvedValue(mockClient);
    (randomUUID as jest.Mock).mockReturnValue(
      '85dfd960-1d85-456b-98f3-982b09f9283c',
    );
  });

  describe('findOrderByUser', () => {
    it('should return orders', async () => {
      const mockOrders = [
        { id: orderUUID, status: ORDER_STATUS.PENDING, tickets: ['t1'] },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockOrders });

      const result = await service.findOrderByUser('user1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, status, tickets FROM orders'),
        ['user1'],
      );

      expect(result).toEqual(mockOrders);
    });
  });

  describe('createOrder', () => {
    it('should create order and reserve tickets', async () => {
      const dto = { userId, ticketIds: tickets };

      mockClient.query.mockResolvedValue({});

      const result = await service.createOrder(dto);

      const orderId = orderUUID;

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        expect.arrayContaining([orderId, dto.userId, dto.ticketIds]),
      );

      expect(ticketService.reserveTickets).toHaveBeenCalledWith(
        {
          ticketIds: dto.ticketIds,
          orderId,
        },
        mockClient,
      );

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

      expect(result).toHaveProperty('id');
    });

    it('should rollback on error', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.createOrder({ userId: 'u1', ticketIds: [] }),
      ).rejects.toThrow();

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order and tickets', async () => {
      mockClient.query.mockResolvedValue({});
      mockQuery.mockResolvedValue({});

      const result = await service.confirmOrder({ orderId: orderUUID });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status'),
        [ORDER_STATUS.CONFIRMED, orderUUID, ORDER_STATUS.PENDING],
      );

      expect(ticketService.confirmTickets).toHaveBeenCalledWith({
        orderId: orderUUID,
      });

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({ isSuccess: true });
    });

    it('should throw if order is not in PENDING state', async () => {
      mockClient.query.mockResolvedValue({});
      mockQuery.mockResolvedValue({ rowCount: 0 });

      await expect(
        service.confirmOrder({ orderId: orderUUID }),
      ).rejects.toThrow('Order is not in PENDING state');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and release tickets', async () => {
      mockClient.query.mockResolvedValue({});
      mockQuery.mockResolvedValue({});

      const result = await service.cancelOrder({ orderId: orderUUID });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status'),
        [ORDER_STATUS.CANCELLED, orderUUID, ORDER_STATUS.PENDING],
      );

      expect(ticketService.releaseTickets).toHaveBeenCalledWith(
        { orderId: orderUUID },
        mockClient,
      );

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({ isSuccess: true });
    });

    it('should throw if order is not in PENDING state', async () => {
      mockClient.query.mockResolvedValue({});
      mockQuery.mockResolvedValue({ rowCount: 0 });

      await expect(service.cancelOrder({ orderId: orderUUID })).rejects.toThrow(
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
