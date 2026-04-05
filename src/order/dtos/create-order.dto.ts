import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderBodyDto {
  @ApiProperty({ example: ['ticket-uuid-1', 'ticket-uuid-2'] })
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  ticketIds: string[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: ['ticket-uuid-1', 'ticket-uuid-2'] })
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  ticketIds: string[];
}

export class CreateOrderResponseDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
