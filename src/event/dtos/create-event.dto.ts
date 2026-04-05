import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Test Event' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'venue-uuid' })
  @IsUUID()
  @IsNotEmpty()
  venueId: string;

  @ApiProperty({ example: '2023-10-10T10:00:00.000Z' })
  @IsDate()
  @IsNotEmpty()
  dateTime: Date;
}

export class CreateEventResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
