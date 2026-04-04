import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { ScheduleModule } from '@nestjs/schedule';
import { VenueModule } from './venue/venue.module';
import { EventModule } from './event/event.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    AuthModule,
    OrderModule,
    ScheduleModule.forRoot(),
    VenueModule,
    EventModule,
    TicketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
