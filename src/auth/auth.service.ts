import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { pool } from '../db/db';
import { USER_ROLE, USER_STATUS } from './enums/auth.dto';
import { AuditService } from '../audit/audit.service';

interface Users {
  id: string;
  email: string;
  password: string;
  status: USER_STATUS;
  role: USER_ROLE;
}

@Injectable()
export class AuthService {
  constructor(private readonly auditService: AuditService) {}

  public async register(
    email: string,
    password: string,
    adminSecret?: string,
  ): Promise<boolean> {
    const hashed = await bcrypt.hash(password, 10);
    const adminRegistrationSecret = process.env.ADMIN_REGISTRATION_SECRET;
    let role = USER_ROLE.CUSTOMER;

    if (adminSecret) {
      if (!adminRegistrationSecret || adminSecret !== adminRegistrationSecret) {
        throw new ForbiddenException('Invalid admin registration secret');
      }

      role = USER_ROLE.ADMIN;
    }

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (result.rows.length > 0) {
      throw new ConflictException('Email already exists');
    }

    const inserted = await pool.query(
      `INSERT INTO users (email, password, role)
        VALUES ($1, $2, $3)
         RETURNING id, email`,
      [email, hashed, role],
    );

    void this.auditService.log({
      userId: inserted.rows[0]?.id,
      action: 'USER_REGISTERED',
      resource: 'user',
      resourceId: inserted.rows[0]?.id,
      metadata: { email, role },
    });

    return true;
  }

  public async login(email: string, password: string) {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND status = $2`,
      [email, USER_STATUS.ACTIVE],
    );

    const user: Users = result.rows[0];

    if (!user) {
      void this.auditService.log({
        action: 'LOGIN_FAILURE',
        resource: 'user',
        metadata: { email, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      void this.auditService.log({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        resource: 'user',
        resourceId: user.id,
        metadata: { email, reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      {
        expiresIn: '15m',
      },
    );

    void this.auditService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'user',
      resourceId: user.id,
      metadata: { email },
    });

    return {
      accessToken: token,
    };
  }
}
