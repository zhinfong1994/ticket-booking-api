import { Test, TestingModule } from '@nestjs/testing';
import { VenueController } from './venue.controller';
import { VenueService } from './venue.service';
import {
  CreateVenueDto,
  CreateVenueResponseDto,
} from './dtos/create-venue.dto';
import { GetVenueResponseDto } from './dtos/get-venue.dto';

describe('VenueController', () => {
  let controller: VenueController;
  let service: jest.Mocked<VenueService>;

  const mockVenues = [
    { id: 'ab65bf44-9f31-4285-872f-65dd6c25011d', name: 'Venue A' },
    { id: 'ad43a0b9-1785-436f-9e29-088677b67ab0', name: 'Venue B' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenueController],
      providers: [
        {
          provide: VenueService,
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VenueController>(VenueController);
    service = module.get(VenueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a venue', async () => {
      const dto: CreateVenueDto = {
        name: 'Test Venue',
      };

      const response: CreateVenueResponseDto = {
        isSuccess: true,
      };

      service.create.mockResolvedValue(response);

      const result = await controller.create(dto);
      expect(result).toEqual(response);
    });
  });

  describe('find', () => {
    it('should return list of venues', async () => {
      const response: GetVenueResponseDto[] = mockVenues;

      service.find.mockResolvedValue(response);

      const result = await controller.find();
      expect(result).toEqual(response);
    });
  });
});
