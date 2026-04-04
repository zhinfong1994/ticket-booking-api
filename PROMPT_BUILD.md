
// Generate openapi yaml file //

You are a senior backend architect.

Generate a complete OpenAPI 3.0 YAML specification for a Ticket Booking System.

Requirements:

* JWT authentication
* Entities: User, Event, Venue, Ticket, Order
* Ticket status: AVAILABLE, RESERVED, SOLD
* Event status: ACTIVE, INACTIVE
* Order status: PENDING, CONFIRMED, CANCELLED
* Order expires in 15 minutes and will auto release ticket as well as order CANCELLED if order still PENDING
* Prevent double or race condition ticket booking
* Prevent duplicate event (same venue + datetime)
* Simple registration (emaiil + password) as well as store email and hasded password in user db
* Simple login (emaiil + password) match email and hashed password validation and return jwt token
* JWT auth token required for orders APIs

Endpoints:

* POST /auth/register
* POST /auth/login
* POST /events
* GET /events
* POST /venues
* GET /venues
* GET /tickets
* POST /orders
* PATCH /orders/{id}/confirm
* PATCH /orders/{id}/cancel
* GET /orders

Include:

* components.schemas
* request/response
* bearerAuth security

Output ONLY YAML.



// Generate jwt guard and test spec //

Generate jwt guard logic and jwt guard text spec in typescript nestjs
