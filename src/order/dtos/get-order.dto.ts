import { IsNotEmpty, IsUUID, IsArray, IsString } from 'class-validator';
import { ORDER_STATUS } from '../enums/order.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetOrdersResponseDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: ORDER_STATUS;

  @ApiProperty({ example: ['ticket-uuid-1', 'ticket-uuid-2'] })
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  tickets: string[];
}
