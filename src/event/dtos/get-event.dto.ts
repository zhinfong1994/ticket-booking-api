import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { EVENT_STATUS } from '../enums/event.enum';

export class GetEventResponseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  venue_id: string;

  @IsDateString()
  @IsNotEmpty()
  date_time: Date;

  status: EVENT_STATUS;
}
