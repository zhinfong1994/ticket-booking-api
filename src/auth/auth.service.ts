import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { pool } from '../db/db';

const JWT_SECRET =
  '9f7c2a6d8b3e4f1a5c7d9e2b6a8f4c1d7e9b2a6c3f8d1e4b5a7c9d2e6f1b3a8';

@Injectable()
export class AuthService {
  public async register(email: string, password: string): Promise<boolean> {
    const hashed = await bcrypt.hash(password, 10);

    try {
      await pool.query(
        `INSERT INTO users (email, password)
         VALUES ($1, $2)
         RETURNING id, email`,
        [email, hashed],
      );

      return true;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new Error('Email already exists');
      }
      throw err;
    }
  }

  public async login(email: string, password: string) {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    const user = result.rows[0];

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    return {
      accessToken: token,
    };
  }
}
