import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { TICKET_STATUS } from './enums/ticket.enum';

describe('TicketController', () => {
  let controller: TicketController;
  let service: jest.Mocked<TicketService>;

  const eventId = '51c3143b-dafa-4227-82f0-6e4a68806c7b';
  const tickets = [
    'aa7fee03-55ec-480c-bf1d-445f8674c786',
    'a39dae43-cff3-4cab-acf4-ea1bc1011ed9',
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: {
            findByEvent: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
    service = module.get(TicketService);

    jest.clearAllMocks();
  });

  // =========================
  // FIND BY EVENT
  // =========================
  describe('findByEvent', () => {
    it('should call service.findByEvent with eventId', async () => {
      const mockTickets = [
        {
          id: tickets[0],
          eventId: eventId,
          status: TICKET_STATUS.AVAILABLE,
          seatNo: 'A1',
        },
      ];

      service.findByEvent.mockResolvedValue(mockTickets);

      const result = await controller.findByEvent(eventId);

      expect(service.findByEvent).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(mockTickets);
    });
  });

  // =========================
  // CREATE
  // =========================
  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = {
        eventId,
        totalSeats: 10,
        seatsPerRow: 5,
      };

      const mockResponse = {
        isSuccess: true,
        totalTicketGenerated: 10,
      };

      service.create.mockResolvedValue(mockResponse);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });
});
