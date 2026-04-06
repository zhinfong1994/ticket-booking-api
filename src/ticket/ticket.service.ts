import { Injectable, ConflictException } from '@nestjs/common';
import { pool } from '../db/db';
import { GetTicketByEventResponseDto } from './dtos/get-ticket.dto';
import {
  CreateTicketsDto,
  CreateTicketsResponseDto,
} from './dtos/create-ticket.dto';
import {
  ReserveTicketDto,
  ReserveTicketResponseDto,
} from './dtos/reserve-ticket.dto';
import {
  ReleaseTicketDto,
  ReleaseTicketResponseDto,
} from './dtos/release-ticket.dto';
import { ConfirmTicketsDto } from './dtos/confirm-ticket.dto';
import { QueryResult, PoolClient } from 'pg';
import { TICKET_STATUS } from './enums/ticket.enum';

@Injectable()
export class TicketService {
  async findByEvent(eventId: string): Promise<GetTicketByEventResponseDto[]> {
    const result: QueryResult<GetTicketByEventResponseDto> = await pool.query(
      `SELECT id, eventId, status, seatNo FROM tickets WHERE eventId = $1 ORDER BY createdAt ASC`,
      [eventId],
    );
    return result.rows;
  }

  async create(body: CreateTicketsDto): Promise<CreateTicketsResponseDto> {
    const { eventId, totalSeats, seatsPerRow } = body;

    const getEventTicketsCount = await pool.query(
      `SELECT COUNT(*) FROM tickets WHERE eventId = $1`,
      [eventId],
    );

    const numberOfTicketGenerated = Number(
      getEventTicketsCount.rows[0]?.count ?? 0,
    );

    if (numberOfTicketGenerated === totalSeats) {
      throw new ConflictException('All tickets already generated');
    }

    const totalRows: number = totalSeats / seatsPerRow;

    const result = await pool.query(
      `
        INSERT INTO tickets (eventId, seatNo)
        SELECT
          $1,
          chr(65 + r) || s
        FROM generate_series(0, $2 - 1) AS r
        CROSS JOIN generate_series(1, $3) AS s
        ON CONFLICT (eventId, seatNo) DO NOTHING
      `,
      [eventId, totalRows, seatsPerRow],
    );

    const insertedCount = result.rowCount;

    return {
      isSuccess: true,
      totalTicketGenerated: insertedCount,
    };
  }

  async reserveTickets(
    body: ReserveTicketDto,
    client: PoolClient,
  ): Promise<ReserveTicketResponseDto> {
    const { ticketIds, orderId } = body;

    const { rows: tickets } = await client.query(
      `
        SELECT id, status
        FROM tickets
        WHERE id = ANY($1)
        AND status = $2
        FOR UPDATE
      `,
      [ticketIds, TICKET_STATUS.AVAILABLE],
    );

    if (tickets.length !== ticketIds.length) {
      throw new ConflictException('Some tickets already reserved or sold');
    }

    await client.query(
      `
          UPDATE tickets
          SET status = 'RESERVED',
              orderId = $1
          WHERE id = ANY($2)
          AND status = $3
        `,
      [orderId, ticketIds, TICKET_STATUS.AVAILABLE],
    );

    return { isSuccess: true };
  }

  async releaseTickets(
    body: ReleaseTicketDto,
    client: PoolClient,
  ): Promise<ReleaseTicketResponseDto> {
    const { orderId } = body;

    await client.query(
      `
        UPDATE tickets
        SET status = $1,
            orderId = NULL
        WHERE orderId = $2
          AND status = $3
      `,
      [TICKET_STATUS.AVAILABLE, orderId, TICKET_STATUS.RESERVED],
    );

    await client.query('COMMIT');

    return {
      isSuccess: true,
    };
  }

  async confirmTickets(body: ConfirmTicketsDto): Promise<boolean> {
    const { orderId } = body;
    await pool.query(
      `
        UPDATE tickets
        SET status = $1
        WHERE orderId = $2
        AND status = $3
      `,
      [TICKET_STATUS.SOLD, orderId, TICKET_STATUS.RESERVED],
    );

    return true;
  }
}
