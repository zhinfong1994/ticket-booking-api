# Ticket Booking API

## Setup

npm install
npm run start:dev

## Swagger
http://localhost:3000/api

## Features

- JWT Authentication
- Ticket booking with race condition prevention
- Order expiry (15 mins auto cancel)
- PostgreSQL with transaction support

## Key Design Decisions

- Used SELECT FOR UPDATE to prevent double booking
- Used cron job to release expired tickets
- Enforced unique constraint on (venue_id, date_time)

## API Endpoints

- POST /auth/register
- POST /auth/login
- POST /orders