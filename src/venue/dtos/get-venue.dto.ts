import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetVenueResponseDto {
  @ApiProperty({ example: 'venue-uuid' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'My Venue' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
