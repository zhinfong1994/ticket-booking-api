import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { pool } from '../db/db';
import { EVENT_STATUS } from './enums/event.enum';

jest.mock('../db/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('EventService', () => {
  let service: EventService;

  const mockQuery = pool.query as jest.Mock;

  const venueId = 'ab65bf44-9f31-4285-872f-65dd6c25011d';

  const eventDto = {
    name: 'Movie A',
    venueId: venueId,
    dateTime: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventService],
    }).compile();

    service = module.get<EventService>(EventService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create event successfully', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.create(eventDto);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO events'),
        [eventDto.name, eventDto.venueId, eventDto.dateTime],
      );

      expect(result).toEqual({ isSuccess: true });
    });

    it('should throw error when duplicate event', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(service.create(eventDto)).rejects.toThrow(
        'Duplicate event (same venue & time)',
      );

      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('find', () => {
    it('should return active events', async () => {
      const mockEvents = [
        {
          id: '51c3143b-dafa-4227-82f0-6e4a68806c7b',
          name: eventDto.name,
          venueId: venueId,
          dateTime: eventDto.dateTime,
          status: EVENT_STATUS.ACTIVE,
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockEvents,
      });

      const result = await service.find();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM events'),
        [EVENT_STATUS.ACTIVE],
      );

      expect(result).toEqual(mockEvents);
    });
  });
});
