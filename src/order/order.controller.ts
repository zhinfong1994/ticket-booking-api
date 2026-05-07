import {
  Body,
  Controller,
  Get,
  Headers,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import {
  CreateOrderBodyDto,
  CreateOrderResponseDto,
} from './dtos/create-order.dto';
import { ConfirmOrderBodyDto } from './dtos/confirm-order.dto';

@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() body: CreateOrderBodyDto,
    @Req() req: { user?: { userId?: string } },
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CreateOrderResponseDto> {
    return this.service.createOrder({
      userId: req?.user?.userId,
      idempotencyKey,
      ticketIds: body.ticketIds,
    });
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/confirm')
  confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ConfirmOrderBodyDto,
    @Req() req: { user?: { userId?: string } },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.confirmOrder({
      orderId: id,
      userId: req.user?.userId,
      idempotencyKey,
      paymentToken: body.paymentToken,
      amount: body.amount,
      currency: body.currency,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: { user?: { userId?: string } },
  ) {
    return this.service.cancelOrder({ orderId: id, userId: req.user?.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findOrderByUser(@Req() req: { user?: { userId?: string } }) {
    return this.service.findOrderByUser(req.user?.userId);
  }
}
