import { IsUUID, IsNotEmpty, IsBoolean } from 'class-validator';

export class ReleaseTicketDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

export class ReleaseTicketResponseDto {
  @IsNotEmpty()
  @IsBoolean()
  isSuccess: boolean;
}
