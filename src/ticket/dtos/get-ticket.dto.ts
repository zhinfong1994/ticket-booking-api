import { IsString, IsUUID } from 'class-validator';
import { TICKET_STATUS } from '../enums/ticket.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetTicketByEventResponseDto {
  @ApiProperty({ example: 'ticket-uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'event-uuid' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ example: 'AVAILABLE' })
  @IsString()
  status: TICKET_STATUS;

  @ApiProperty({ example: '1' })
  @IsString()
  seatNo: string;
}
