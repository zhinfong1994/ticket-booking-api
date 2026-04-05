CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  venueId UUID,
  dateTime TIMESTAMP,
  status TEXT DEFAULT 'ACTIVE',
  UNIQUE (venueId, dateTime)
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eventId UUID NOT NULL,
  status TEXT DEFAULT 'AVAILABLE',
  seatNo TEXT NOT NULL,
  orderId UUID,
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(eventId, seatNo)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL,
  status TEXT DEFAULT 'PENDING',
  tickets UUID[] NOT NULL,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);