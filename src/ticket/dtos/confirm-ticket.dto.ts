import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmTicketsDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}
