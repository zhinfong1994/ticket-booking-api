# Ticket Booking API

A backend service built with **NestJS**, **PostgreSQL**, and **JWT authentication** for managing events, venues, tickets, and orders.

---

## Getting Started

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

3. Create a user (optional):

```sql
CREATE USER ticket_user WITH PASSWORD 'securepassword';
ALTER ROLE ticket_user SET client_encoding TO 'utf8';
ALTER ROLE ticket_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ticket_user SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE ticket_booking TO ticket_user;
```

---

## 🔐 Environment Variables Setup

Create a `.env` file in the root directory:

```env
# App
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ticket_booking

# JWT
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1h

# Order expiration (in minutes)
ORDER_EXPIRY_MINUTES=15
```

---

## 🧱 Database Migration (if using ORM)

If you're using **TypeORM**:

```bash
npm run migration:run
```

If using **Prisma**:

```bash
npx prisma migrate dev
```

If using **plain SQL**:

```bash
psql -U postgres -d ticket_booking -f migrations/init.sql
```

---

## ▶️ Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

---

## 🧪 Running Unit Tests

### Run all tests

```bash
npm run test
```

### Watch mode

```bash
npm run test:watch
```

### Coverage report

```bash
npm run test:cov
```

---

## 🧪 Example Unit Test (Jest)

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should validate user login', async () => {
    const result = await service.validateUser('test@test.com', 'password');
    expect(result).toBeDefined();
  });
});
```

---

## 📬 Example API Request

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password"
  }'
```

---

## 📁 Project Structure

```
src/
  auth/
  users/
  events/
  venues/
  tickets/
  orders/
  common/
  config/
test/
```

---

## ⚠️ Notes

* Ensure PostgreSQL is running before starting the app
* JWT secret should be strong in production
* Use `.env.production` for production environment
* Orders expire after **15 minutes** and release reserved tickets

---

## 🧑‍💻 Tech Stack

* NestJS
* PostgreSQL
* TypeScript
* JWT Authentication
* Jest (Unit Testing)

---

## 📌 Future Improvements

* Add Redis for caching & locking
* Add queue (BullMQ) for order expiration
* Add Swagger / OpenAPI integration
* Add rate limiting & monitoring

---

## 📄 License

MIT License
