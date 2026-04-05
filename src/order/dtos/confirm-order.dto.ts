import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmOrderDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

export class ConfirmOrderResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
