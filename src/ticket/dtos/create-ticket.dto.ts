import { IsUUID, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateTicketsDto {
  @IsUUID()
  eventId: string;

  @IsInt()
  @Min(1)
  totalSeats: number;

  @IsInt()
  @Min(1)
  seatsPerRow: number;
}

export class CreateTicketsResponseDto {
  @IsBoolean()
  isSuccess: boolean;

  @IsInt()
  totalTicketGenerated: number;
}
