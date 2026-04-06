import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { pool } from '../db/db';
import { USER_STATUS } from './enums/auth.dto';

interface Users {
  id: string;
  email: string;
  password: string;
  status: USER_STATUS;
}

@Injectable()
export class AuthService {
  public async register(email: string, password: string): Promise<boolean> {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (result.rows.length > 0) {
      throw new ConflictException('Email already exists');
    }

    await pool.query(
      `INSERT INTO users (email, password)
         VALUES ($1, $2)
         RETURNING id, email`,
      [email, hashed],
    );

    return true;
  }

  public async login(email: string, password: string) {
    const JWT_SECRET = process.env.JWT_SECRET;

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND status = $2`,
      [email, USER_STATUS.ACTIVE],
    );

    const user: Users = result.rows[0];

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '15m',
    });

    return {
      accessToken: token,
    };
  }
}
