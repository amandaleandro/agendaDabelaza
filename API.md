# API Documentation - Agendei

## Appointments

### Create Appointment
**POST** `/appointments`

Creates a new appointment. The price and duration are automatically determined from the selected service.

**Request Body:**
```json
{
  "clientId": "uuid",
  "professionalId": "uuid",
  "serviceId": "uuid",
  "scheduledAt": "2025-12-31T10:00:00.000Z"
}
```

**Validation:**
- Service must belong to the specified professional
- Professional must have availability for the requested day of week
- Appointment time must be within the professional's schedule window
- No overlapping appointments are allowed (based on service duration)
- Scheduled time must be in the future

**Response:**
```json
{
  "id": "uuid",
  "clientId": "uuid",
  "professionalId": "uuid",
  "serviceId": "uuid",
  "scheduledAt": "2025-12-31T10:00:00.000Z",
  "status": "SCHEDULED",
  "price": 120.00,
  "createdAt": "2025-12-30T20:00:00.000Z"
}
```

### Cancel Appointment
**POST** `/appointments/:id/cancel`

Cancels an appointment. May apply cancellation fees based on the professional's subscription plan and timing.

**Response:**
```json
{
  "status": "CANCELLED",
  "fee": 0
}
```

---

## Products

### Create Product
**POST** `/products?professionalId=uuid`

Register a new product for sale by a professional.

**Request Body:**
```json
{
  "name": "Shampoo Premium",
  "description": "Professional grade shampoo",
  "price": 45.00,
  "stock": 100
}
```

**Response:**
```json
{
  "id": "uuid",
  "professionalId": "uuid",
  "name": "Shampoo Premium",
  "description": "Professional grade shampoo",
  "price": 45.00,
  "stock": 100,
  "createdAt": "2025-12-30T20:00:00.000Z"
}
```

### List Products
**GET** `/products?professionalId=uuid`

Returns all products available from a professional.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Shampoo Premium",
    "description": "Professional grade shampoo",
    "price": 45.00,
    "stock": 100
  }
]
```

### Add Product to Appointment
**POST** `/products/appointments/:appointmentId/items`

Adds a product to an existing appointment. Stock is automatically decreased.

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "id": "uuid",
  "appointmentId": "uuid",
  "productId": "uuid",
  "quantity": 2,
  "price": 45.00,
  "totalPrice": 90.00,
  "createdAt": "2025-12-30T20:00:00.000Z"
}
```

---

## Services

### List Services
**GET** `/services?professionalId=uuid`

Returns all services offered by a professional.

**Response:**
```json
[
  {
    "id": "uuid",
    "professionalId": "uuid",
    "name": "Haircut",
    "description": "Standard haircut",
    "price": 120.00,
    "durationMinutes": 60
  }
]
```

---

## Schedules

### List Schedules
**GET** `/schedules?professionalId=uuid`

Returns the weekly availability schedule for a professional.

**Response:**
```json
[
  {
    "id": "uuid",
    "professionalId": "uuid",
    "dayOfWeek": "MONDAY",
    "startTime": "09:00",
    "endTime": "18:00",
    "isAvailable": true
  }
]
```

---

## Clients

### Create Client
**POST** `/clients`

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+5511999999999"
}
```

---

## Professionals

### Create Professional
**POST** `/professionals`

**Request Body:**
```json
{
  "userId": "uuid",
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "+5511988888888"
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Appointment price is derived from the service catalog
- Product sales are tracked via appointment items with quantity
- Product stock is automatically decreased when added to appointments
- Duration-based overlap checking prevents double-booking
- Cancellation fees depend on subscription tier and timing window
