import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockBody = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockResponse = {
    accessToken: 'mock-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call service.register with email and password', async () => {
      service.register.mockResolvedValue(true);

      const result = await controller.register(mockBody);

      expect(service.register).toHaveBeenCalledWith(
        mockBody.email,
        mockBody.password,
      );

      expect(result).toBe(true);
    });
  });

  describe('login', () => {
    it('should call service.login and return token', async () => {
      service.login.mockResolvedValue(mockResponse);

      const result = await controller.login(mockBody);

      expect(service.login).toHaveBeenCalledWith(
        mockBody.email,
        mockBody.password,
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
