import { IsNotEmpty, IsUUID } from 'class-validator';

export class ConfirmTicketsDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}
