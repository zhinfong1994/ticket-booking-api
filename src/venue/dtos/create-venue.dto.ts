import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVenueDto {
  @ApiProperty({ example: 'My Venue' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateVenueResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
