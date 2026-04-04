import { Body, Controller, Get, Post } from '@nestjs/common';
import { VenueService } from './venue.service';

@Controller('venues')
export class VenueController {
  constructor(private readonly service: VenueService) {}

  @Post()
  create(@Body() body: { name: string }) {
    return this.service.create(body.name);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
