import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @Type(() => Date)
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
