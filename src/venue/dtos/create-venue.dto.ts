import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateVenueDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateVenueResponseDto {
  @IsBoolean()
  @IsNotEmpty()
  isSuccess: boolean;
}
