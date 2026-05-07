import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { GetTicketByEventResponseDto } from './dtos/get-ticket.dto';
import {
  CreateTicketsDto,
  CreateTicketsResponseDto,
} from './dtos/create-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { USER_ROLE } from '../auth/enums/auth.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly service: TicketService) {}

  @Get()
  findByEvent(
    @Query('eventId') eventId: string,
  ): Promise<GetTicketByEventResponseDto[]> {
    return this.service.findByEvent(eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
  @Post()
  create(@Body() body: CreateTicketsDto): Promise<CreateTicketsResponseDto> {
    return this.service.create(body);
  }
}
