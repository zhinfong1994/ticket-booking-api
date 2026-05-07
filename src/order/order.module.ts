import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TicketModule } from '../ticket/ticket.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TicketModule, AuditModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
