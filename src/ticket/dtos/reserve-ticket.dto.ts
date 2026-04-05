import {
  IsArray,
  IsUUID,
  ArrayNotEmpty,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveTicketDto {
  @ApiProperty({
    example: ['ticket-uuid-1', 'ticket-uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ticketIds: string[];

  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  orderId: string;
}

export class ReserveTicketResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
