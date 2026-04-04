import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  venueId: string;

  @IsDate()
  @IsNotEmpty()
  dateTime: Date;
}

export class CreateEventResponseDto {
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
