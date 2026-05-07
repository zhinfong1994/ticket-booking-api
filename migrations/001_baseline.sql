CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'CUSTOMER',
  status TEXT DEFAULT 'ACTIVE',
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  venueId UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  dateTime TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  UNIQUE (venueId, dateTime)
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eventId UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'AVAILABLE',
  seatNo TEXT NOT NULL,
  orderId UUID,
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(eventId, seatNo)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING',
  tickets UUID[] NOT NULL,
  idempotencyKey TEXT NOT NULL,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orderId UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotencyKey TEXT NOT NULL,
  status TEXT DEFAULT 'PAID',
  providerReference TEXT NOT NULL,
  paidAt TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_tickets_order' AND table_name = 'tickets'
  ) THEN
    ALTER TABLE tickets
    ADD CONSTRAINT fk_tickets_order
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_status_datetime ON events(status, dateTime);
CREATE INDEX IF NOT EXISTS idx_events_venue_datetime ON events(venueId, dateTime);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON tickets(eventId, status);
CREATE INDEX IF NOT EXISTS idx_tickets_order_status ON tickets(orderId, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_createdat ON orders(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_expiresat ON orders(status, expiresAt);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_idempotency ON orders(userId, idempotencyKey);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order ON payments(orderId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_user_idempotency ON payments(userId, idempotencyKey);
