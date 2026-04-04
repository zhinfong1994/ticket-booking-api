import { Body, Controller, Get, Post } from '@nestjs/common';
import { EventService } from './event.service';
import {
  CreateEventDto,
  CreateEventResponseDto,
} from './dtos/create-event.dto';
import { GetEventResponseDto } from './dtos/get-event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  create(
    @Body()
    body: CreateEventDto,
  ): Promise<CreateEventResponseDto> {
    return this.service.create(body);
  }

  @Get()
  find(): Promise<GetEventResponseDto[]> {
    return this.service.find();
  }
}
