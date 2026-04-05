import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EVENT_STATUS } from './enums/event.enum';

describe('EventController', () => {
  let controller: EventController;
  let service: jest.Mocked<EventService>;

  const venueId = 'ab65bf44-9f31-4285-872f-65dd6c25011d';
  const eventId = '51c3143b-dafa-4227-82f0-6e4a68806c7b';

  const eventDto = {
    name: 'Concert A',
    venueId: venueId,
    dateTime: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    service = module.get(EventService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create and return result', async () => {
      const mockResponse = { isSuccess: true };

      service.create.mockResolvedValue(mockResponse);

      const result = await controller.create(eventDto);

      expect(service.create).toHaveBeenCalledWith(eventDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('find', () => {
    it('should return events from service', async () => {
      const mockEvents = [
        {
          id: eventId,
          name: eventDto.name,
          venue_id: venueId,
          date_time: eventDto.dateTime,
          status: EVENT_STATUS.ACTIVE,
        },
      ];

      service.find.mockResolvedValue(mockEvents);

      const result = await controller.find();

      expect(service.find).toHaveBeenCalled();
      expect(result).toEqual(mockEvents);
    });
  });
});
