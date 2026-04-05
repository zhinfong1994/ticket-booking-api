import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import {
  CreateOrderBodyDto,
  CreateOrderResponseDto,
} from './dtos/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() body: CreateOrderBodyDto,
    @Req() req: { user?: { userId?: string } },
  ): Promise<CreateOrderResponseDto> {
    return this.service.createOrder({
      userId: req?.user?.userId,
      ticketIds: body.ticketIds,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.service.confirmOrder({ orderId: id });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancelOrder({ orderId: id });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findOrderByUser(@Req() req: { user?: { userId?: string } }) {
    return this.service.findOrderByUser(req.user?.userId);
  }
}
