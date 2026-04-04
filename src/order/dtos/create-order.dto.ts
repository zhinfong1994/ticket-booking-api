import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateOrderBodyDto {
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  ticketIds: string[];
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  ticketIds: string[];
}

export class CreateOrderResponseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
