import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { VenueService } from './venue.service';
import {
  CreateVenueDto,
  CreateVenueResponseDto,
} from './dtos/create-venue.dto';
import { GetVenueResponseDto } from './dtos/get-venue.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { USER_ROLE } from '../auth/enums/auth.dto';

@Controller('venues')
export class VenueController {
  constructor(private readonly service: VenueService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @Post()
  create(@Body() body: CreateVenueDto): Promise<CreateVenueResponseDto> {
    return this.service.create(body);
  }

  @Get()
  find(): Promise<GetVenueResponseDto[]> {
    return this.service.find();
  }
}
