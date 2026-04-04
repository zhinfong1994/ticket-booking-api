// create table in postgresSQL //

** NEED CREATE DB IN LOCAL 1ST CALLED ticket_db_main

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  venue_id UUID,
  date_time TIMESTAMP,
  status TEXT DEFAULT 'ACTIVE',
  UNIQUE (venue_id, date_time)
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  status TEXT DEFAULT 'AVAILABLE'
  seat_no TEXT NOT NULL
  UNIQUE(event_id, seat_no)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  status TEXT DEFAULT 'PENDING',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);