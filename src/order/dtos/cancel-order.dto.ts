import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

export class CancelOrderResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
