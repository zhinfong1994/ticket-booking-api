import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { pool } from '../db/db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import { USER_STATUS } from './enums/auth.dto';

jest.mock('../db/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockQuery = pool.query as jest.Mock;
  const mockHash = bcrypt.hash as jest.Mock;
  const mockCompare = bcrypt.compare as jest.Mock;
  const mockJwtSign = jwt.sign as jest.Mock;

  const mockUser = {
    id: '7a2243c2-f8d0-4b9a-8f32-6d20e61865bf',
    email: 'test@example.com',
    password: 'hashed-password',
    status: USER_STATUS.ACTIVE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockHash.mockResolvedValue('hashed-password');

      // check existing user
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.register(email, password);

      expect(mockHash).toHaveBeenCalledWith(password, 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users'),
        [email],
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [email, 'hashed-password'],
      );

      expect(result).toBe(true);
    });

    it('should throw if email already exists', async () => {
      mockHash.mockResolvedValue('hashed-password');

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '1' }],
      });

      await expect(
        service.register('test@example.com', 'password'),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
      });

      mockCompare.mockResolvedValue(true);

      mockJwtSign.mockReturnValue('mock-token');

      const result = await service.login(email, password);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users'),
        [email, USER_STATUS.ACTIVE],
      );

      expect(mockCompare).toHaveBeenCalledWith(password, mockUser.password);

      expect(mockJwtSign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        expect.any(String),
        { expiresIn: '15m' },
      );

      expect(result).toEqual({
        accessToken: 'mock-token',
      });
    });

    it('should throw if user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password does not match', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
      });

      mockCompare.mockResolvedValue(false);

      await expect(service.login('test@example.com', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
