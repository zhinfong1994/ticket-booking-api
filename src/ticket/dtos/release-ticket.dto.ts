import { IsUUID, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReleaseTicketDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

export class ReleaseTicketResponseDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  isSuccess: boolean;
}
