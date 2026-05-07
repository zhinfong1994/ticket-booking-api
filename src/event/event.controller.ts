import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import {
  CreateEventDto,
  CreateEventResponseDto,
} from './dtos/create-event.dto';
import { GetEventResponseDto } from './dtos/get-event.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { USER_ROLE } from '../auth/enums/auth.dto';

@Controller('events')
export class EventController {
  constructor(private readonly service: EventService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLE.ADMIN)
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
