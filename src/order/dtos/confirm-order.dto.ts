import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class ConfirmOrderDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

export class ConfirmOrderResponseDto {
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
