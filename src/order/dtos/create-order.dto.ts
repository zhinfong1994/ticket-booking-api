import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderBodyDto {
  @ApiProperty({ example: ['ticket-uuid-1', 'ticket-uuid-2'] })
  @IsArray()
  @IsNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ticketIds: string[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'checkout-attempt-001' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({ example: ['ticket-uuid-1', 'ticket-uuid-2'] })
  @IsArray()
  @IsNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ticketIds: string[];
}

export class CreateOrderResponseDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: '2026-05-07T18:30:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}
