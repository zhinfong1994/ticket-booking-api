import { JwtAuthGuard } from './jwt.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { USER_ROLE } from '../enums/auth.dto';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  const mockContext = (authHeader?: string): ExecutionContext =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authHeader,
          },
        }),
      }),
    }) as any;

  it('should allow valid token', () => {
    const token = jwt.sign(
      { userId: '123', role: USER_ROLE.CUSTOMER },
      process.env.JWT_SECRET,
    );

    const context = mockContext(`Bearer ${token}`);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw if no token', () => {
    const context = mockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw if invalid token', () => {
    const context = mockContext('Bearer invalid');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw if authorization header is malformed', () => {
    const context = mockContext('Token abc123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
