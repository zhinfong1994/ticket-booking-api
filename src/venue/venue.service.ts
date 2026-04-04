import { Injectable } from '@nestjs/common';
import { pool } from '../db/db';
import {
  CreateVenueDto,
  CreateVenueResponseDto,
} from './dtos/create-venue.dto';
import { GetVenueResponseDto } from './dtos/get-venue.dto';

interface Venues {
  id: string;
  name: string;
}

@Injectable()
export class VenueService {
  async create(body: CreateVenueDto): Promise<CreateVenueResponseDto> {
    const { name } = body;
    await pool.query(`INSERT INTO venues (name) VALUES ($1)`, [name]);
    return { isSuccess: true };
  }

  async find(): Promise<GetVenueResponseDto[]> {
    const result = await pool.query<Venues>(`SELECT * FROM venues`);
    return result.rows;
  }
}
