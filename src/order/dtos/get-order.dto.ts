import { IsNotEmpty, IsUUID, IsArray } from 'class-validator';
import { ORDER_STATUS } from '../enums/order.enum';

export class GetOrdersResponseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  status: ORDER_STATUS;

  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  tickets: string[];
}
