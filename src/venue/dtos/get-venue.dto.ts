import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetVenueResponseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
