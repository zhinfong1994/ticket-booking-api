import { Injectable } from '@nestjs/common';
import { pool } from '../db/db';
import {
  CreateEventDto,
  CreateEventResponseDto,
} from './dtos/create-event.dto';
import { GetEventResponseDto } from './dtos/get-event.dto';
import { EVENT_STATUS } from './enums/event.enum';

interface Events {
  id: string;
  name: string;
  venueId: string;
  dateTime: Date;
  status: EVENT_STATUS;
}

@Injectable()
export class EventService {
  async create(body: CreateEventDto): Promise<CreateEventResponseDto> {
    const { name, venueId, dateTime } = body;
    const result = await pool.query(
      `INSERT INTO events (name, venueId, dateTime)
         VALUES ($1, $2, $3)
         ON CONFLICT (venueId, dateTime) DO NOTHING
        `,
      [name, venueId, dateTime],
    );

    if (result.rowCount === 0) {
      throw new Error('Duplicate event (same venue & time)');
    }

    return { isSuccess: true };
  }

  async find(): Promise<GetEventResponseDto[]> {
    const result = await pool.query<Events>(
      `SELECT * FROM events WHERE status = $1 ORDER BY id DESC`,
      [EVENT_STATUS.ACTIVE],
    );
    return result.rows;
  }
}
