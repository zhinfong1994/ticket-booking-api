import { TICKET_STATUS } from '../enums/ticket.enum';

export class GetTicketByEventResponseDto {
  id: string;
  event_id: string;
  status: TICKET_STATUS;
  seat_no: string;
}
