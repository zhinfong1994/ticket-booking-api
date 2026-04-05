import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { pool } from '../db/db';
import { TICKET_STATUS } from './enums/ticket.enum';
import { PoolClient } from 'pg';

jest.mock('../db/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('TicketService', () => {
  let service: TicketService;

  const mockQuery = pool.query as jest.Mock;

  const mockClient: Partial<PoolClient> = {
    query: jest.fn(),
    release: jest.fn(),
  };

  const mockClientQuery = mockClient.query as jest.Mock;

  const eventId = '51c3143b-dafa-4227-82f0-6e4a68806c7b';
  const orderUUID = '85dfd960-1d85-456b-98f3-982b09f9283c';
  const tickets = [
    'aa7fee03-55ec-480c-bf1d-445f8674c786',
    'a39dae43-cff3-4cab-acf4-ea1bc1011ed9',
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketService],
    }).compile();

    service = module.get<TicketService>(TicketService);

    jest.clearAllMocks();
  });

  describe('findByEvent', () => {
    it('should return tickets for event', async () => {
      const mockTickets = [
        {
          id: 'c162c23f-2486-4ec1-a00b-65e376ce1371',
          eventId: eventId,
          status: TICKET_STATUS.AVAILABLE,
          seatNo: 'A1',
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockTickets });

      const result = await service.findByEvent(eventId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, eventId, status, seatNo'),
        [eventId],
      );

      expect(result).toEqual(mockTickets);
    });
  });

  describe('create', () => {
    it('should create tickets successfully', async () => {
      const dto = {
        eventId,
        totalSeats: 4,
        seatsPerRow: 2,
      };

      // count generated tickets for the event
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: 0 }],
      });

      // insert tickets response
      mockQuery.mockResolvedValueOnce({
        rowCount: 4,
      });

      const result = await service.create(dto);

      expect(result).toEqual({
        isSuccess: true,
        totalTicketGenerated: 4,
      });
    });

    it('should throw if all tickets already generated', async () => {
      const dto = {
        eventId,
        totalSeats: 2,
        seatsPerRow: 2,
      };

      // count generated tickets for the event
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '2' }],
      });

      await expect(service.create(dto)).rejects.toThrow(
        'All tickets already generated',
      );
    });
  });

  describe('reserveTickets', () => {
    it('should reserve tickets successfully', async () => {
      const payload = {
        ticketIds: tickets,
        orderId: orderUUID,
      };

      mockClientQuery
        .mockResolvedValueOnce({
          rows: [
            { id: tickets[0], status: TICKET_STATUS.AVAILABLE },
            { id: tickets[1], status: TICKET_STATUS.AVAILABLE },
          ],
        })
        // UPDATE
        .mockResolvedValueOnce({});

      const result = await service.reserveTickets(
        payload,
        mockClient as PoolClient,
      );

      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, status'),
        [payload.ticketIds, TICKET_STATUS.AVAILABLE],
      );

      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tickets'),
        [payload.orderId, payload.ticketIds, TICKET_STATUS.AVAILABLE],
      );

      expect(result).toEqual({ isSuccess: true });
    });

    it('should throw if some tickets not available', async () => {
      const payload = {
        ticketIds: tickets,
        orderId: orderUUID,
      };

      // only 1 ticket available
      mockClientQuery.mockResolvedValueOnce({
        rows: [{ id: tickets[0], status: TICKET_STATUS.AVAILABLE }],
      });

      await expect(
        service.reserveTickets(payload, mockClient as PoolClient),
      ).rejects.toThrow('Some tickets already reserved or sold');
    });
  });

  describe('releaseTickets', () => {
    it('should release tickets', async () => {
      const payload = { orderId: orderUUID };

      mockClientQuery.mockResolvedValue({});

      const result = await service.releaseTickets(
        payload,
        mockClient as PoolClient,
      );

      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tickets'),
        [TICKET_STATUS.AVAILABLE, payload.orderId, TICKET_STATUS.RESERVED],
      );

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

      expect(result).toEqual({ isSuccess: true });
    });
  });

  describe('confirmTickets', () => {
    it('should confirm tickets', async () => {
      const payload = { orderId: orderUUID };

      mockQuery.mockResolvedValue({});

      const result = await service.confirmTickets(payload);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tickets'),
        [TICKET_STATUS.SOLD, payload.orderId, TICKET_STATUS.RESERVED],
      );

      expect(result).toBe(true);
    });
  });
});
