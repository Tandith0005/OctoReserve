# 🏢 Multi-Tenant Resource Booking & Availability System

A production-ready backend system for managing shared resources across multiple organizations with timezone-aware scheduling, conflict prevention, and dynamic availability generation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Database Schema](#database-schema)
- [AUTHENTICATION](#authentication)
- [Contribution](#contribution)


## 🎯 Overview

This backend system enables multiple organizations to manage shared resources (meeting rooms, desks, devices) and allows employees to create time-based bookings. The system ensures complete tenant isolation, prevents booking conflicts, respects timezone configurations, and generates dynamic availability slots.

### Key Capabilities

- **Multi-Tenant Architecture**: Complete data isolation between organizations
- **Timezone-Aware Scheduling**: Luxon-powered timezone handling for global teams
- **Smart Availability Engine**: Dynamic slot generation considering all constraints
- **Conflict Prevention**: Prevents overlapping bookings with buffer time support
- **Role-Based Access**: ORG_ADMIN and EMPLOYEE roles with proper permissions

## ✨ Features

### Core Features

✅ **Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control (ORG_ADMIN / EMPLOYEE)
- Token refresh mechanism

✅ **Organization Management**
- Multi-tenant isolation
- Customizable timezone per organization
- Configurable booking policies (duration limits, working hours, buffer times)
- Organization activation/deactivation

✅ **Resource Management**
- Support for multiple resource types (meeting rooms, desks, devices)
- Resource-specific buffer time overrides
- Soft delete functionality
- Unique resource naming within organizations

✅ **Booking Management**
- Conflict detection with buffer time consideration
- Working hours validation
- Booking window limits (configurable days in advance)
- Update and cancel functionality
- Past booking protection

✅ **Availability Engine** (Most Important)
- Dynamic slot generation based on requested duration
- Respects existing bookings with buffer times
- Working hours enforcement
- Timezone-aware calculations
- Batch availability for multiple resources
- Daily availability ranges

### Bonus Features

- 📝 Request logging with Winston
- 🔄 MongoDB transactions for data consistency
- 🧹 Soft delete with automatic filtering
- 📊 Query optimization with indexes
- 🛡️ Rate limiting ready structure

## 🛠 Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 20.x+ |
| Language | TypeScript | 5.x |
| Framework | Express.js | 4.x |
| Database | MongoDB | 6.x+ |
| ODM | Mongoose | 8.x |
| Validation | Zod | 3.x |
| Date/Time | Luxon | 3.x |
| Auth | JWT | 9.x |
| Hashing | bcryptjs | 2.x |
| Logging | Winston | 3.x |
| Dev | Nodemon | 3.x |

## 🏗 Architecture

### Project Structure
src/
├── config/ # Configuration files
│ ├── database.ts # MongoDB connection
│ └── logger.ts # Winston logger config
├── routes/ 
│ └── indexRoutes.ts # Main routes
├── middlewares/ # Express middlewares
│ ├── auth.middleware.ts
│ ├── errorHandler.ts
│ ├── role.middleware.ts
│ └── validation.ts
├── models/ # Mongoose models
│ ├── User.model.ts
│ ├── Organization.model.ts
│ ├── Resource.model.ts
│ ├── Booking.model.ts
│ └── RefreshToken.model.ts
├── modules/ # Feature modules
│ ├── auth/ # Authentication module
│ ├── organization/ # Organization management
│ ├── resource/ # Resource management
│ ├── booking/ # Booking management
│ └── availability/ # Availability engine
├── types/ # TypeScript type definitions
│ └── index.ts
├── utils/ # Utility functions
│ ├── appError.ts
│ ├── catchAsync.ts
│ ├── jwt.ts
│ └── sendResponse.ts
├── app.ts # Express app entry
└── server.ts # Server entry

### Data Flow
```
Client Request
→ Route Middleware (Auth, Role)
→ Validation (Zod)
→ Controller (catchAsync)
→ Service (Business Logic)
→ Model (Database)
→ Response (sendResponse)
→ Error Handler (if error)
```

### Multi-Tenant Isolation Strategy

All data models include `organizationId` field with indexes:
- Resources are scoped to organizations
- Bookings inherit organization context from resources
- Users belong to exactly one organization
- All queries automatically filter by `organizationId`

## 📋 Prerequisites

- Node.js (v20 or higher)
- MongoDB (v6 or higher)
- npm or yarn package manager
- Git

## 🚀 Installation & Setup


```bash
1. Clone the Repository
git clone https://github.com/Tandith0005/OctoReserve.git
cd OctoReserve

2. Install Dependencies
npm install

3. Set Up Environment Variables
cp .env.example .env

4. Run the Application
npm run dev

5. Verify Installation
http://localhost:5000/ # You'll see OctoReserve is running! meaning server is running
http://localhost:5000/api/v1/health # You'll see {"status": "OK","timestamp": "Year-Month-Day Timezone"} meaning v1 is running fine
```

## 📊 Database Schema

### Organization Schema
```typescript
{
  name: string (unique),
  timezone: string,
  bookingConfig: {
    defaultDuration: number,
    maxDuration: number,
    minDuration: number,
    bookingWindowDays: number,
    workingHours: {
      start: string,
      end: string,
      workingDays: number[]
    },
    bufferTime: {
      before: number,
      after: number
    }
  },
  isActive: boolean
}
```

### User Schema
```typescript
{
  email: string (unique),
  password: string (hashed),
  name: string,
  role: 'ORG_ADMIN' | 'EMPLOYEE',
  organizationId: ObjectId,
  isActive: boolean,
  lastLogin: Date
}
```

### Resource Schema
```typescript
{
  name: string,
  type: 'MEETING_ROOM' | 'DESK' | 'DEVICE' | 'OTHER',
  organizationId: ObjectId,
  capacity?: number,
  location?: string,
  amenities?: string[],
  bufferTime?: { before: number, after: number },
  isActive: boolean,
  isDeleted: boolean
}
```

### Booking Schema
```typescript
{
  resourceId: ObjectId,
  organizationId: ObjectId,
  userId: ObjectId,
  title: string,
  description?: string,
  startTime: Date,
  endTime: Date,
  duration: number,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
  cancelledAt?: Date,
  cancelledBy?: ObjectId,
  cancellationReason?: string
}
```

## Authentication

### All protected endpoints require a Bearer token:
```text
Authorization: Bearer <access_token>
```

## 🤝 Contributing

While this is an assessment project, contributions are welcome. Please follow these steps:
1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit changes (git commit -m 'Add amazing feature')
4. Push to branch (git push origin feature/amazing-feature)
5. Open a Pull Request