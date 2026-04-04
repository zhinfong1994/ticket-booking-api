import { Body, Controller, Get, Post } from '@nestjs/common';
import { VenueService } from './venue.service';
import {
  CreateVenueDto,
  CreateVenueResponseDto,
} from './dtos/create-venue.dto';
import { GetVenueResponseDto } from './dtos/get-venue.dto';

@Controller('venues')
export class VenueController {
  constructor(private readonly service: VenueService) {}

  @Post()
  create(@Body() body: CreateVenueDto): Promise<CreateVenueResponseDto> {
    return this.service.create(body);
  }

  @Get()
  find(): Promise<GetVenueResponseDto[]> {
    return this.service.find();
  }
}
