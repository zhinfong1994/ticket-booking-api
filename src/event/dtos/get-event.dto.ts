import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { EVENT_STATUS } from '../enums/event.enum';
import { ApiProperty } from '@nestjs/swagger';
export class GetEventResponseDto {
  @ApiProperty({ example: 'event-uuid' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Test Event' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'venue-uuid' })
  @IsUUID()
  @IsNotEmpty()
  venue_id: string;

  @ApiProperty({ example: '2023-10-10T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date_time: Date;

  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: EVENT_STATUS;
}
