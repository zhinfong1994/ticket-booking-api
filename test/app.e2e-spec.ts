import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AppModule } from './../src/app.module';
import { ORDER_STATUS } from '../src/order/enums/order.enum';
import { TICKET_STATUS } from '../src/ticket/enums/ticket.enum';
import { EVENT_STATUS } from '../src/event/enums/event.enum';
import { USER_ROLE, USER_STATUS } from '../src/auth/enums/auth.dto';

type UserRecord = {
  id: string;
  email: string;
  password: string;
  role: USER_ROLE;
  status: USER_STATUS;
  createdAt: Date;
};

type VenueRecord = {
  id: string;
  name: string;
};

type EventRecord = {
  id: string;
  name: string;
  venueId: string;
  dateTime: Date;
  status: EVENT_STATUS;
};

type TicketRecord = {
  id: string;
  eventId: string;
  status: TICKET_STATUS;
  seatNo: string;
  orderId: string | null;
  createdAt: Date;
};

type OrderRecord = {
  id: string;
  userId: string;
  status: ORDER_STATUS;
  tickets: string[];
  idempotencyKey: string;
  expiresAt: Date | null;
  createdAt: Date;
};

type PaymentRecord = {
  id: string;
  orderId: string;
  userId: string;
  idempotencyKey: string;
  status: string;
  providerReference: string;
  paidAt: Date;
};

const fakeDb = {
  users: [] as UserRecord[],
  venues: [] as VenueRecord[],
  events: [] as EventRecord[],
  tickets: [] as TicketRecord[],
  orders: [] as OrderRecord[],
  payments: [] as PaymentRecord[],
};

const resetFakeDb = () => {
  fakeDb.users.length = 0;
  fakeDb.venues.length = 0;
  fakeDb.events.length = 0;
  fakeDb.tickets.length = 0;
  fakeDb.orders.length = 0;
  fakeDb.payments.length = 0;
};

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

const fakeQuery = jest.fn(async (sql: string, params: unknown[] = []) => {
  const normalizedSql = normalizeSql(sql);

  if (
    normalizedSql === 'BEGIN' ||
    normalizedSql === 'COMMIT' ||
    normalizedSql === 'ROLLBACK'
  ) {
    return { rows: [], rowCount: 0 };
  }

  if (normalizedSql.includes('SELECT * FROM users WHERE email = $1 AND status = $2')) {
    const [email, status] = params as [string, USER_STATUS];
    const rows = fakeDb.users.filter(
      (user) => user.email === email && user.status === status,
    );
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes('SELECT * FROM users WHERE email = $1')) {
    const [email] = params as [string];
    const rows = fakeDb.users.filter((user) => user.email === email);
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes('INSERT INTO users (email, password, role)')) {
    const [email, password, role] = params as [string, string, USER_ROLE];
    const user: UserRecord = {
      id: randomUUID(),
      email,
      password,
      role,
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
    };
    fakeDb.users.push(user);
    return { rows: [{ id: user.id, email: user.email }], rowCount: 1 };
  }

  if (normalizedSql.includes('INSERT INTO venues (name) VALUES ($1)')) {
    const [name] = params as [string];
    fakeDb.venues.push({ id: randomUUID(), name });
    return { rows: [], rowCount: 1 };
  }

  if (normalizedSql === 'SELECT * FROM venues') {
    return { rows: fakeDb.venues, rowCount: fakeDb.venues.length };
  }

  if (normalizedSql.includes('INSERT INTO events (name, venueId, dateTime)')) {
    const [name, venueId, dateTime] = params as [string, string, Date];
    const duplicate = fakeDb.events.find(
      (event) =>
        event.venueId === venueId &&
        event.dateTime.toISOString() === new Date(dateTime).toISOString(),
    );

    if (duplicate) {
      return { rows: [], rowCount: 0 };
    }

    fakeDb.events.push({
      id: randomUUID(),
      name,
      venueId,
      dateTime: new Date(dateTime),
      status: EVENT_STATUS.ACTIVE,
    });

    return { rows: [], rowCount: 1 };
  }

  if (normalizedSql.includes('SELECT * FROM events WHERE status = $1 ORDER BY id DESC')) {
    const [status] = params as [EVENT_STATUS];
    const rows = fakeDb.events
      .filter((event) => event.status === status)
      .slice()
      .reverse();
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes('SELECT COUNT(*) FROM tickets WHERE eventId = $1')) {
    const [eventId] = params as [string];
    const count = fakeDb.tickets.filter((ticket) => ticket.eventId === eventId).length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  if (normalizedSql.includes('INSERT INTO tickets (eventId, seatNo) SELECT $1, seat_no FROM unnest($2::text[]) AS seat_no')) {
    const [eventId, seatNumbers] = params as [string, string[]];
    let insertedCount = 0;

    for (const seatNo of seatNumbers) {
      const exists = fakeDb.tickets.find(
        (ticket) => ticket.eventId === eventId && ticket.seatNo === seatNo,
      );

      if (!exists) {
        fakeDb.tickets.push({
          id: randomUUID(),
          eventId,
          status: TICKET_STATUS.AVAILABLE,
          seatNo,
          orderId: null,
          createdAt: new Date(),
        });
        insertedCount += 1;
      }
    }

    return { rows: [], rowCount: insertedCount };
  }

  if (normalizedSql.includes('SELECT id, eventId, status, seatNo FROM tickets WHERE eventId = $1 ORDER BY createdAt ASC')) {
    const [eventId] = params as [string];
    const rows = fakeDb.tickets.filter((ticket) => ticket.eventId === eventId);
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes('SELECT id, expiresAt FROM orders WHERE userId = $1 AND idempotencyKey = $2')) {
    const [userId, idempotencyKey] = params as [string, string];
    const rows = fakeDb.orders
      .filter(
        (order) =>
          order.userId === userId && order.idempotencyKey === idempotencyKey,
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 1)
      .map((order) => ({ id: order.id, expiresAt: order.expiresAt }));
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes('SELECT t.id, t.eventId FROM tickets t INNER JOIN events e ON e.id = t.eventId')) {
    const [ticketIds, status] = params as [string[], EVENT_STATUS];
    const rows = fakeDb.tickets
      .filter((ticket) => ticketIds.includes(ticket.id))
      .filter((ticket) => {
        const event = fakeDb.events.find((item) => item.id === ticket.eventId);
        return (
          !!event &&
          event.status === status &&
          event.dateTime.getTime() > Date.now()
        );
      })
      .map((ticket) => ({ id: ticket.id, eventId: ticket.eventId }));
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes('INSERT INTO orders (id, userId, tickets, expiresAt, idempotencyKey) VALUES ($1, $2, $3, $4, $5)')) {
    const [id, userId, ticketIds, expiresAt, idempotencyKey] = params as [
      string,
      string,
      string[],
      Date,
      string,
    ];
    fakeDb.orders.push({
      id,
      userId,
      status: ORDER_STATUS.PENDING,
      tickets: ticketIds,
      expiresAt: new Date(expiresAt),
      idempotencyKey,
      createdAt: new Date(),
    });
    return { rows: [], rowCount: 1 };
  }

  if (normalizedSql.includes('SELECT id, status, tickets, expiresAt FROM orders WHERE userId = $1 ORDER BY createdAt DESC')) {
    const [userId] = params as [string];
    const rows = fakeDb.orders
      .filter((order) => order.userId === userId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((order) => ({
        id: order.id,
        status: order.status,
        tickets: order.tickets,
        expiresAt: order.expiresAt,
      }));
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes('SELECT id, status FROM tickets WHERE id = ANY($1) AND status = $2 FOR UPDATE')) {
    const [ticketIds, status] = params as [string[], TICKET_STATUS];
    const rows = fakeDb.tickets
      .filter((ticket) => ticketIds.includes(ticket.id) && ticket.status === status)
      .map((ticket) => ({ id: ticket.id, status: ticket.status }));
    return { rows, rowCount: rows.length };
  }

  if (normalizedSql.includes("UPDATE tickets SET status = 'RESERVED', orderId = $1 WHERE id = ANY($2) AND status = $3")) {
    const [orderId, ticketIds, status] = params as [string, string[], TICKET_STATUS];
    let rowCount = 0;
    for (const ticket of fakeDb.tickets) {
      if (ticketIds.includes(ticket.id) && ticket.status === status) {
        ticket.status = TICKET_STATUS.RESERVED;
        ticket.orderId = orderId;
        rowCount += 1;
      }
    }
    return { rows: [], rowCount };
  }

  if (normalizedSql.includes('SELECT status, expiresAt FROM orders WHERE id = $1 AND userId = $2 FOR UPDATE')) {
    const [orderId, userId] = params as [string, string];
    const order = fakeDb.orders.find(
      (item) => item.id === orderId && item.userId === userId,
    );
    return { rows: order ? [{ status: order.status, expiresAt: order.expiresAt }] : [], rowCount: order ? 1 : 0 };
  }

  if (normalizedSql.includes('SELECT orderId FROM payments WHERE userId = $1 AND idempotencyKey = $2 LIMIT 1')) {
    const [userId, idempotencyKey] = params as [string, string];
    const payment = fakeDb.payments.find(
      (item) => item.userId === userId && item.idempotencyKey === idempotencyKey,
    );
    return { rows: payment ? [{ orderId: payment.orderId }] : [], rowCount: payment ? 1 : 0 };
  }

  if (normalizedSql.includes('SELECT orderId FROM payments WHERE orderId = $1 LIMIT 1')) {
    const [orderId] = params as [string];
    const payment = fakeDb.payments.find((item) => item.orderId === orderId);
    return { rows: payment ? [{ orderId: payment.orderId }] : [], rowCount: payment ? 1 : 0 };
  }

  if (normalizedSql.includes('INSERT INTO payments (id, orderId, userId, idempotencyKey, status, providerReference, amount, currency, paidAt)')) {
    const [id, orderId, userId, idempotencyKey, status, providerReference] = params as [
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    fakeDb.payments.push({
      id,
      orderId,
      userId,
      idempotencyKey,
      status,
      providerReference,
      paidAt: new Date(),
    });
    return { rows: [], rowCount: 1 };
  }

  if (normalizedSql.includes('UPDATE orders SET status = $1 WHERE id = $2 AND userId = $3')) {
    const [status, orderId, userId] = params as [ORDER_STATUS, string, string];
    const order = fakeDb.orders.find(
      (item) => item.id === orderId && item.userId === userId,
    );
    if (!order) {
      return { rows: [], rowCount: 0 };
    }
    order.status = status;
    return { rows: [], rowCount: 1 };
  }

  if (normalizedSql.includes('UPDATE orders SET status = $1 WHERE id = $2 AND userId = $3 AND status = $4')) {
    const [status, orderId, userId, currentStatus] = params as [
      ORDER_STATUS,
      string,
      string,
      ORDER_STATUS,
    ];
    const order = fakeDb.orders.find(
      (item) =>
        item.id === orderId && item.userId === userId && item.status === currentStatus,
    );
    if (!order) {
      return { rows: [], rowCount: 0 };
    }
    order.status = status;
    return { rows: [], rowCount: 1 };
  }

  if (normalizedSql.includes('UPDATE orders SET status = $1 WHERE id = $2')) {
    const [status, orderId] = params as [ORDER_STATUS, string];
    const order = fakeDb.orders.find((item) => item.id === orderId);
    if (!order) {
      return { rows: [], rowCount: 0 };
    }
    order.status = status;
    return { rows: [], rowCount: 1 };
  }

  if (normalizedSql.includes('UPDATE tickets SET status = $1, orderId = NULL WHERE orderId = $2 AND status = $3')) {
    const [status, orderId, currentStatus] = params as [
      TICKET_STATUS,
      string,
      TICKET_STATUS,
    ];
    let rowCount = 0;
    for (const ticket of fakeDb.tickets) {
      if (ticket.orderId === orderId && ticket.status === currentStatus) {
        ticket.status = status;
        ticket.orderId = null;
        rowCount += 1;
      }
    }
    return { rows: [], rowCount };
  }

  if (normalizedSql.includes('UPDATE tickets SET status = $1 WHERE orderId = $2 AND status = $3')) {
    const [status, orderId, currentStatus] = params as [
      TICKET_STATUS,
      string,
      TICKET_STATUS,
    ];
    let rowCount = 0;
    for (const ticket of fakeDb.tickets) {
      if (ticket.orderId === orderId && ticket.status === currentStatus) {
        ticket.status = status;
        rowCount += 1;
      }
    }
    return { rows: [], rowCount };
  }

  if (normalizedSql.includes('UPDATE orders SET status = $1 WHERE status = $2 AND expiresAt < NOW() RETURNING id')) {
    const [nextStatus, currentStatus] = params as [ORDER_STATUS, ORDER_STATUS];
    const expiredOrders = fakeDb.orders.filter(
      (order) =>
        order.status === currentStatus &&
        !!order.expiresAt &&
        order.expiresAt.getTime() < Date.now(),
    );
    for (const order of expiredOrders) {
      order.status = nextStatus;
    }
    return {
      rows: expiredOrders.map((order) => ({ id: order.id })),
      rowCount: expiredOrders.length,
    };
  }

  if (normalizedSql.includes('INSERT INTO audit_logs')) {
    return { rows: [], rowCount: 1 };
  }

  throw new Error(`Unhandled SQL in e2e fake: ${normalizedSql}`);
});

jest.mock('./../src/db/db', () => {
  const client = {
    query: (...args: [string, unknown[]?]) => fakeQuery(...args),
    release: jest.fn(),
  };

  return {
    pool: {
      query: (...args: [string, unknown[]?]) => fakeQuery(...args),
      connect: jest.fn(async () => client),
    },
  };
});

describe('Booking lifecycle (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.JWT_SECRET = 'e2e-jwt-secret';
    process.env.ADMIN_REGISTRATION_SECRET = 'bootstrap-admin-secret';
  });

  beforeEach(async () => {
    resetFakeDb();
    fakeQuery.mockClear();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const registerAndLogin = async (payload: {
    email: string;
    password: string;
    adminSecret?: string;
  }) => {
    await request(app.getHttpServer()).post('/auth/register').send(payload).expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(201);

    return loginResponse.body.accessToken as string;
  };

  const createAdminFixture = async () => {
    const adminToken = await registerAndLogin({
      email: 'admin@example.com',
      password: 'password123',
      adminSecret: 'bootstrap-admin-secret',
    });

    await request(app.getHttpServer())
      .post('/venues')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cinema One' })
      .expect(201);

    const venueId = fakeDb.venues[0].id;

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Evening Show',
        venueId,
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const eventId = fakeDb.events[0].id;

    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ eventId, totalSeats: 3, seatsPerRow: 3 })
      .expect(201);

    return { adminToken, venueId, eventId };
  };

  it('should lock down admin creation endpoints for customers', async () => {
    const customerToken = await registerAndLogin({
      email: 'customer@example.com',
      password: 'password123',
    });

    await request(app.getHttpServer())
      .post('/venues')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Blocked Venue' })
      .expect(403);
  });

  it('should create a hold idempotently and confirm before expiry', async () => {
    await createAdminFixture();
    const customerToken = await registerAndLogin({
      email: 'buyer@example.com',
      password: 'password123',
    });

    const ticketIds = fakeDb.tickets.slice(0, 2).map((ticket) => ticket.id);

    const createResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', 'create-order-001')
      .send({ ticketIds })
      .expect(201);

    expect(createResponse.body.id).toBeDefined();
    expect(createResponse.body.expiresAt).toBeDefined();

    const retryResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', 'create-order-001')
      .send({ ticketIds })
      .expect(201);

    expect(retryResponse.body).toEqual(createResponse.body);

    const orderId = createResponse.body.id as string;

    await request(app.getHttpServer())
      .patch(`/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', 'confirm-order-001')
      .send({ paymentToken: 'tok_visa_4242', amount: 19.99 })
      .expect(200, { isSuccess: true });

    await request(app.getHttpServer())
      .patch(`/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', 'confirm-order-001')
      .send({ paymentToken: 'tok_visa_4242', amount: 19.99 })
      .expect(200, { isSuccess: true });

    const order = fakeDb.orders.find((item) => item.id === orderId);
    expect(order?.status).toBe(ORDER_STATUS.CONFIRMED);
    expect(fakeDb.payments).toHaveLength(1);
    expect(
      fakeDb.tickets
        .filter((ticket) => ticket.orderId === orderId)
        .every((ticket) => ticket.status === TICKET_STATUS.SOLD),
    ).toBe(true);
  });

  it('should reject confirmation after the hold expires and release the seats', async () => {
    await createAdminFixture();
    const customerToken = await registerAndLogin({
      email: 'latebuyer@example.com',
      password: 'password123',
    });

    const targetTicket = fakeDb.tickets[2];

    const createResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', 'create-order-002')
      .send({ ticketIds: [targetTicket.id] })
      .expect(201);

    const order = fakeDb.orders.find((item) => item.id === createResponse.body.id);
    if (!order) {
      throw new Error('Expected order to exist in fake e2e store');
    }
    order.expiresAt = new Date(Date.now() - 60_000);

    await request(app.getHttpServer())
      .patch(`/orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', 'confirm-order-002')
      .send({ paymentToken: 'tok_visa_4242', amount: 19.99 })
      .expect(400);

    expect(order.status).toBe(ORDER_STATUS.CANCELLED);
    expect(targetTicket.status).toBe(TICKET_STATUS.AVAILABLE);
    expect(targetTicket.orderId).toBeNull();
  });

  it('should reject cancel attempts from another customer', async () => {
    await createAdminFixture();
    const ownerToken = await registerAndLogin({
      email: 'owner@example.com',
      password: 'password123',
    });
    const attackerToken = await registerAndLogin({
      email: 'attacker@example.com',
      password: 'password123',
    });

    const createResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('Idempotency-Key', 'create-order-003')
      .send({ ticketIds: [fakeDb.tickets[0].id] })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/orders/${createResponse.body.id}/cancel`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .expect(400);

    const order = fakeDb.orders.find((item) => item.id === createResponse.body.id);
    expect(order?.status).toBe(ORDER_STATUS.PENDING);
  });
});
