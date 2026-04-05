import { IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketsDto {
  @ApiProperty({ example: 'event-uuid' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  totalSeats: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  seatsPerRow: number;
}

export class CreateTicketsResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isSuccess: boolean;

  @ApiProperty({ example: 100 })
  @IsInt()
  totalTicketGenerated: number;
}
