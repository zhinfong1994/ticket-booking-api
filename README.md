# Ticket Booking API

A backend service built with NestJS, PostgreSQL, and JWT authentication for managing events, venues, tickets, users, and orders.

---

## Getting Started

* Node version install 22+ (version 24.7.0)
* Install PostgreSQL server and pgAdmin 4 (GUI)
- https://www.enterprisedb.com/downloads/postgres-postgresql-downloads (PostgreSQL server)
- https://www.pgadmin.org/download/ (pgadmin4)
* Ensure PostgreSQL is running before starting the app
* Ensuse have `.env` file

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

---

## 2. PostgreSQL Database Setup

### Option A: Local PostgreSQL

1. Install PostgreSQL (if not installed)
2. Create a database:

```sql
CREATE DATABASE ticket_db_main;
```

3. Use SQL_BUILD.sql script to create tables (users, tickets, events, venues, orders)

## Environment Variables Setup

Create a `.env` file in the root directory:

```env
# ========================
# DATABASE (for postgres container)
# ========================
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ticket_db_main

# ========================
# APP CONNECTION
# ========================
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ticket_db_main

# ========================
# JWT
# ========================
JWT_SECRET=9f7c2a6d8b3e4f1a5c7d9e2b6a8f4c1d7e9b2a6c3f8d1e4b5a7c9d2e6f1b3a8
```

---

## Running the Application

### Development

```bash
npm run start:dev
```

---

### Swagger UI

- http://localhost:3000/api (local)

## Running Unit Tests

### Run all tests

```bash
npm run test
```

---

### Production Deployment
 1. Build Docker image - gcloud builds submit --tag gcr.io/artful-chiller-200303/ticket-booking-api:0.0.1
 2. Deploy to GCP - gcloud run deploy ticket-booking-api --image gcr.io/artful-chiller-200303/ticket-booking-api:0.0.1

### Production Swagger UI
- https://ticket-booking-api-927958102104.asia-southeast1.run.app/api


## System Future Improvements

* Add Redis for caching & locking
* Add queue or scheduler for order expiration
* Add Swagger / OpenAPI integration
* Add rate limiting & monitoring

---
