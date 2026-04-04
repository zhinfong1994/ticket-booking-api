import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class CancelOrderDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

export class CancelOrderResponseDto {
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
