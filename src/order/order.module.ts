import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [TicketModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
