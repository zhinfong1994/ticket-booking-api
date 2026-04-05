import { Test, TestingModule } from '@nestjs/testing';
import { VenueService } from './venue.service';
import { pool } from '../db/db';

jest.mock('../db/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('VenueService', () => {
  let service: VenueService;

  const mockQuery = pool.query as jest.Mock;

  const mockVenues = [
    { id: 'ab65bf44-9f31-4285-872f-65dd6c25011d', name: 'Venue A' },
    { id: 'ad43a0b9-1785-436f-9e29-088677b67ab0', name: 'Venue B' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VenueService],
    }).compile();

    service = module.get<VenueService>(VenueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should insert venue and return success', async () => {
      // Arrange
      const dto = { name: 'Venue A' };

      mockQuery.mockResolvedValueOnce({});

      // Act
      const result = await service.create(dto);

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        `INSERT INTO venues (name) VALUES ($1)`,
        [dto.name],
      );
      expect(result).toEqual({ isSuccess: true });
    });
  });

  describe('find', () => {
    it('should return all venues', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({
        rows: mockVenues,
      });

      // Act
      const result = await service.find();

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(`SELECT * FROM venues`);
      expect(result).toEqual(mockVenues);
    });
  });
});
