import {
  IsArray,
  IsUUID,
  ArrayNotEmpty,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class ReserveTicketDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ticketIds: string[];

  @IsUUID()
  orderId: string;
}

export class ReserveTicketResponseDto {
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
