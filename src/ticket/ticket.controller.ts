import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { GetTicketByEventResponseDto } from './dtos/get-ticket.dto';
import {
  CreateTicketsDto,
  CreateTicketsResponseDto,
} from './dtos/create-ticket.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly service: TicketService) {}

  @Get()
  findByEvent(
    @Query('eventId') eventId: string,
  ): Promise<GetTicketByEventResponseDto[]> {
    return this.service.findByEvent(eventId);
  }

  @Post()
  create(@Body() body: CreateTicketsDto): Promise<CreateTicketsResponseDto> {
    return this.service.create(body);
  }
}
