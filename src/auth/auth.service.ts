import { Injectable, UnauthorizedException } from '@nestjs/common';
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

const JWT_SECRET =
  '9f7c2a6d8b3e4f1a5c7d9e2b6a8f4c1d7e9b2a6c3f8d1e4b5a7c9d2e6f1b3a8';

@Injectable()
export class AuthService {
  public async register(email: string, password: string): Promise<boolean> {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (result.rows.length > 0) {
      throw new Error('Email already exists');
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
