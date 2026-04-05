import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { ORDER_STATUS } from './enums/order.enum';

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('OrderController', () => {
  let controller: OrderController;
  let service: jest.Mocked<OrderService>;

  const orderUUID = '85dfd960-1d85-456b-98f3-982b09f9283c';
  const tickets = [
    'aa7fee03-55ec-480c-bf1d-445f8674c786',
    'a39dae43-cff3-4cab-acf4-ea1bc1011ed9',
  ];
  const userId = '85dfd960-1d85-456b-98f3-982b09f9283c';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            createOrder: jest.fn(),
            confirmOrder: jest.fn(),
            cancelOrder: jest.fn(),
            findOrderByUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get(OrderService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.createOrder with userId and ticketIds', async () => {
      const body = {
        ticketIds: tickets,
      };

      const req = {
        user: { userId },
      };

      service.createOrder.mockResolvedValue({ id: orderUUID });

      const result = await controller.create(body, req);

      expect(service.createOrder).toHaveBeenCalledWith({
        userId,
        ticketIds: body.ticketIds,
      });

      expect(result).toEqual({ id: orderUUID });
    });
  });

  describe('confirm', () => {
    it('should call service.confirmOrder', async () => {
      service.confirmOrder.mockResolvedValue({ isSuccess: true });

      const result = await controller.confirm(orderUUID);

      expect(service.confirmOrder).toHaveBeenCalledWith({
        orderId: orderUUID,
      });

      expect(result).toEqual({ isSuccess: true });
    });
  });

  describe('cancel', () => {
    it('should call service.cancelOrder', async () => {
      service.cancelOrder.mockResolvedValue({ isSuccess: true });

      const result = await controller.cancel(orderUUID);

      expect(service.cancelOrder).toHaveBeenCalledWith({
        orderId: orderUUID,
      });

      expect(result).toEqual({ isSuccess: true });
    });
  });

  describe('findOrderByUser', () => {
    it('should call service.findOrderByUser with userId', async () => {
      const req = {
        user: { userId },
      };

      const mockOrders = [
        { id: orderUUID, status: ORDER_STATUS.PENDING, tickets: tickets },
      ];

      service.findOrderByUser.mockResolvedValue(mockOrders);

      const result = await controller.findOrderByUser(req);

      expect(service.findOrderByUser).toHaveBeenCalledWith(userId);

      expect(result).toEqual(mockOrders);
    });
  });
});
