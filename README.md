# 💳 Digital Wallet System — Backend API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-F7DF1E?style=for-the-badge&logo=jsonwebtokens&logoColor=black)

A production-ready, scalable RESTful API backend for a full-featured digital wallet platform. Built with TypeScript, Express.js, MongoDB (Mongoose), and validated with Zod. Supports user wallets, fund transfers, loans, notifications, payment statistics, admin dashboards, and more.

</div>

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Modules](#modules)
7. [API Reference](#api-reference)
8. [Authentication & Authorization](#authentication--authorization)
9. [Data Models / Schemas](#data-models--schemas)
10. [Validation Strategy](#validation-strategy)
11. [Error Handling](#error-handling)
12. [Environment Variables](#environment-variables)
13. [Getting Started](#getting-started)
14. [Running in Development](#running-in-development)
15. [Running in Production](#running-in-production)
16. [Testing](#testing)
17. [Database Seeding](#database-seeding)
18. [Security Considerations](#security-considerations)
19. [Performance & Scalability](#performance--scalability)
20. [Deployment](#deployment)
21. [Contributing](#contributing)
22. [License](#license)

---

## Overview

The **Digital Wallet System Backend** is the server-side engine powering a comprehensive digital financial services platform. It exposes a secure, well-structured REST API that enables:

- User onboarding, KYC profile management, and authentication
- Real-time wallet creation, balance management, and fund transfers
- Peer-to-peer (P2P) payments and transaction history
- Loan application, approval workflows, and repayment tracking
- Notification dispatch (in-app, email) with read/unread state management
- Admin-level controls: user management, transaction oversight, system reports
- Payment statistics, analytics, and revenue dashboards

This backend is designed as a standalone API service, consumed by the React.js frontend but fully usable by any HTTP client. All endpoints return consistent JSON responses and are protected by JWT-based authentication with role-based access control (RBAC).

---

## Architecture

```
Client (React.js / Mobile / API Consumer)
        │
        ▼
   [ Express.js HTTP Server ]
        │
   [ Route Layer ]  ──→  [ Zod Validation Middleware ]
        │
   [ Controller Layer ]
        │
   [ Service Layer ]  ──→  [ Business Logic ]
        │
   [ Data Access Layer (Mongoose Models) ]
        │
   [ MongoDB Atlas / Local MongoDB ]
```

The codebase follows a **layered MVC-inspired architecture** with strict separation of concerns:

- **Routes** handle HTTP path definitions and apply middleware chains.
- **Controllers** parse requests, call service methods, and send responses.
- **Services** contain all business logic, database queries, and transformations.
- **Models** define Mongoose schemas and TypeScript interfaces.
- **Validators** define Zod schemas used both at runtime and for TypeScript type inference.
- **Middleware** handles cross-cutting concerns: auth, error handling, file uploads, rate limiting.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 18.x+ |
| Language | TypeScript | 5.x |
| Framework | Express.js | 4.x |
| Database | MongoDB | 7.x |
| ODM | Mongoose | 8.x |
| Validation | Zod | 3.x |
| Authentication | JSON Web Tokens (jsonwebtoken) | 9.x |
| Password Hashing | bcryptjs | 2.x |
| File Uploads | Multer | 1.x |
| Email | Nodemailer | 6.x |
| Environment | dotenv | 16.x |
| Dev Server | ts-node-dev | 2.x |
| Build | tsc (TypeScript Compiler) | — |
| Linting | ESLint + Prettier | — |

---

## Project Structure

```
digital-wallet-backend/
│
├── src/
│   ├── app.ts                      # Express app setup, middleware registration
│   ├── server.ts                   # HTTP server bootstrap, DB connection
│   │
│   ├── config/
│   │   ├── db.ts                   # MongoDB connection logic
│   │   ├── env.ts                  # Centralized env variable access
│   │   └── constants.ts            # App-wide constants (roles, limits, etc.)
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth.interface.ts
│   │   │
│   │   ├── user/
│   │   │   ├── user.routes.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.model.ts
│   │   │   ├── user.validation.ts
│   │   │   └── user.interface.ts
│   │   │
│   │   ├── wallet/
│   │   │   ├── wallet.routes.ts
│   │   │   ├── wallet.controller.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── wallet.model.ts
│   │   │   ├── wallet.validation.ts
│   │   │   └── wallet.interface.ts
│   │   │
│   │   ├── transaction/
│   │   │   ├── transaction.routes.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── transaction.service.ts
│   │   │   ├── transaction.model.ts
│   │   │   ├── transaction.validation.ts
│   │   │   └── transaction.interface.ts
│   │   │
│   │   ├── loan/
│   │   │   ├── loan.routes.ts
│   │   │   ├── loan.controller.ts
│   │   │   ├── loan.service.ts
│   │   │   ├── loan.model.ts
│   │   │   ├── loan.validation.ts
│   │   │   └── loan.interface.ts
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.routes.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.model.ts
│   │   │   ├── notification.validation.ts
│   │   │   └── notification.interface.ts
│   │   │
│   │   ├── payment-stats/
│   │   │   ├── paymentStats.routes.ts
│   │   │   ├── paymentStats.controller.ts
│   │   │   ├── paymentStats.service.ts
│   │   │   └── paymentStats.interface.ts
│   │   │
│   │   └── admin/
│   │       ├── admin.routes.ts
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts
│   │       └── admin.interface.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # JWT verification, role guard
│   │   ├── validate.middleware.ts  # Zod request validation
│   │   ├── upload.middleware.ts    # Multer file upload config
│   │   ├── rateLimiter.middleware.ts
│   │   └── error.middleware.ts    # Global error handler
│   │
│   ├── utils/
│   │   ├── ApiError.ts             # Custom error class
│   │   ├── ApiResponse.ts          # Standardized response helper
│   │   ├── asyncHandler.ts         # Async try-catch wrapper
│   │   ├── sendEmail.ts            # Nodemailer utility
│   │   ├── generateToken.ts        # JWT sign/verify helpers
│   │   └── paginate.ts             # Generic pagination utility
│   │
│   └── types/
│       ├── express.d.ts            # Express request augmentation (req.user)
│       └── global.d.ts             # Shared global types
│
├── dist/                           # Compiled JavaScript output
├── uploads/                        # Multer upload storage (local dev)
├── .env                            # Environment variables (not committed)
├── .env.example                    # Environment variable template
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── package.json
└── README.md
```

---

## Features

### User & Auth
- User registration with email verification
- Secure login with JWT access + refresh token strategy
- Password reset via email OTP
- Role-based access: `user`, `admin`, `super-admin`, `agent`
- Profile management with avatar/image upload

### Wallet
- Auto-creation of wallet on user registration
- Real-time balance retrieval
- Wallet freeze / unfreeze (admin)
- Wallet-to-wallet fund transfers with atomic transactions
- Wallet history with filters (date range, type)

### Transactions
- Deposit, withdrawal, transfer, refund transaction types
- Full transaction history with pagination and filtering
- Transaction status lifecycle: `pending`, `success`, `failed`, `reversed`
- Fee calculation engine

### Loans
- Loan application submission
- Admin approval / rejection workflow
- Repayment scheduling and tracking
- Interest calculation (flat/reducing balance)
- Loan history per user

### Notifications
- In-app notification creation and dispatch
- Mark as read / mark all as read
- Paginated notification list
- Notification types: `transaction`, `loan`, `system`, `alert`
- Email notification integration via Nodemailer

### Payment Statistics
- User-level payment summaries (total sent, received, fees paid)
- Monthly/weekly breakdown charts
- Admin-level platform revenue and volume stats
- Top users by transaction volume

### Admin Dashboard
- User list with search, filter, and pagination
- Suspend / activate user accounts
- View and manage all transactions
- Loan approval queue
- System health and usage metrics

---

## Modules

### Auth Module (`/api/auth`)

Handles all authentication flows including registration, login, token refresh, and password management.

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Login and receive tokens | Public |
| POST | `/refresh-token` | Refresh access token | Public |
| POST | `/logout` | Invalidate refresh token | Private |
| POST | `/forgot-password` | Send password reset OTP | Public |
| POST | `/reset-password` | Reset password with OTP | Public |
| PATCH | `/change-password` | Change authenticated user password | Private |

---

### User Module (`/api/users`)

Manages user profiles, image uploads, and KYC-level information.

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/me` | Get current user profile | Private |
| PATCH | `/me` | Update current user profile | Private |
| PATCH | `/me/avatar` | Upload/update profile image | Private |
| GET | `/` | Get all users (paginated) | Admin |
| GET | `/:id` | Get user by ID | Admin |
| PATCH | `/:id/status` | Activate or suspend a user | Admin |
| DELETE | `/:id` | Delete a user account | Super-admin |

---

### Wallet Module (`/api/wallets`)

Core wallet CRUD and fund management operations.

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/me` | Get authenticated user's wallet | Private |
| POST | `/deposit` | Deposit funds into wallet | Private |
| POST | `/withdraw` | Withdraw funds from wallet | Private |
| POST | `/transfer` | Transfer funds to another wallet | Private |
| GET | `/:id` | Get wallet by ID | Admin |
| PATCH | `/:id/freeze` | Freeze a wallet | Admin |
| PATCH | `/:id/unfreeze` | Unfreeze a wallet | Admin |

---

### Transaction Module (`/api/transactions`)

Transaction history, filtering, and management.

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/me` | Get current user's transactions | Private |
| GET | `/me?type=transfer&from=2024-01-01` | Filtered transactions | Private |
| GET | `/` | Get all transactions (admin) | Admin |
| GET | `/:id` | Get single transaction by ID | Admin |
| PATCH | `/:id/reverse` | Reverse a transaction | Admin |

---

### Loan Module (`/api/loans`)

Loan lifecycle management from application to repayment.

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/apply` | Submit a loan application | Private |
| GET | `/me` | Get current user's loans | Private |
| GET | `/` | Get all loans (admin, paginated) | Admin |
| GET | `/:id` | Get loan details | Admin |
| PATCH | `/:id/approve` | Approve a loan | Admin |
| PATCH | `/:id/reject` | Reject a loan | Admin |
| POST | `/:id/repay` | Make a loan repayment | Private |
| GET | `/:id/repayments` | Get repayment schedule | Private |

---

### Notification Module (`/api/notifications`)

In-app notification management for users.

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | Get authenticated user's notifications | Private |
| GET | `/unread-count` | Get count of unread notifications | Private |
| PATCH | `/:id/read` | Mark a notification as read | Private |
| PATCH | `/read-all` | Mark all notifications as read | Private |
| DELETE | `/:id` | Delete a notification | Private |
| POST | `/` | Create a notification (system/admin use) | Admin |

---

### Payment Stats Module (`/api/v1/payment-stats`)

Analytics and statistics endpoints.

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/me` | Get current user payment summary | Private |
| GET | `/me/monthly` | Monthly breakdown for current user | Private |
| GET | `/platform` | Platform-wide stats | Admin |
| GET | `/platform/revenue` | Revenue over time | Admin |
| GET | `/platform/top-users` | Top users by volume | Admin |

---

## API Reference

### Base URL

```
Development:  http://localhost:5000
Production:   https://digital-wallet-system-backend-nu.vercel.app
```

### Standard Response Format

All API responses follow a consistent envelope structure:

**Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched successfully",
  "data": {
    "results": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalResults": 48
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### Common Query Parameters

Most list endpoints support the following query parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Items per page (default: 10, max: 100) | `?limit=25` |
| `sort` | string | Sort field and direction | `?sort=-createdAt` |
| `search` | string | Full-text search query | `?search=john` |
| `from` | ISO date | Filter results from date | `?from=2024-01-01` |
| `to` | ISO date | Filter results to date | `?to=2024-12-31` |
| `status` | string | Filter by status | `?status=active` |

---

## Authentication & Authorization

### JWT Strategy

This API uses a **dual-token** authentication strategy:

- **Access Token**: Short-lived JWT (default: 15 minutes). Sent in the `Authorization` header on every request.
- **Refresh Token**: Long-lived JWT (default: 7 days). Used exclusively to obtain new access tokens. Stored securely (httpOnly cookie or client storage).

**Request Header:**
```
Authorization: Bearer <access_token>
```

### Token Refresh Flow

```
Client                             Server
  │                                  │
  │──── POST /auth/refresh-token ────▶│
  │         { refreshToken }          │
  │                                  │
  │◀─── { accessToken, refreshToken }─│
  │                                  │
```

### Role-Based Access Control (RBAC)

| Role | Description | Access Level |
|------|-------------|--------------|
| `user` | Standard wallet user | Own resources only |
| `agent` | Standard wallet user | Own resources only |
| `admin` | Platform administrator | All users' resources, admin routes |
| `super-admin` | Root administrator | Full system access including admin management |

Route protection is applied via middleware:

```typescript
// Public route
router.post('/login', authController.login);

// Authenticated users only
router.get('/me', authenticate, userController.getMe);

// Admin only
router.get('/', authenticate, authorize('admin', 'super-admin'), userController.getAllUsers);

// Super-admin only
router.delete('/:id', authenticate, authorize('super-admin'), userController.deleteUser);
```

---

## Data Models / Schemas

### User

```typescript
interface IUser {
  _id: ObjectId;
  fullName: string;
  email: string;                          // unique, indexed
  phone: string;                          // unique
  password: string;                       // hashed with bcrypt
  role: 'user' | 'admin' | 'super-admin';
  avatar?: string;                        // file path or URL
  isVerified: boolean;
  isActive: boolean;
  wallet?: ObjectId;                      // ref: Wallet
  createdAt: Date;
  updatedAt: Date;
}
```

### Wallet

```typescript
interface IWallet {
  _id: ObjectId;
  user: ObjectId;           // ref: User
  balance: number;          // in smallest currency unit (e.g., cents)
  currency: string;         // e.g., 'USD', 'BDT'
  isFrozen: boolean;
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction

```typescript
interface ITransaction {
  _id: ObjectId;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'loan_disbursement' | 'loan_repayment' | 'refund';
  status: 'pending' | 'success' | 'failed' | 'reversed';
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  sender?: ObjectId;        // ref: Wallet
  receiver?: ObjectId;      // ref: Wallet
  description?: string;
  reference: string;        // unique transaction reference
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Loan

```typescript
interface ILoan {
  _id: ObjectId;
  user: ObjectId;           // ref: User
  amount: number;
  interestRate: number;     // in percentage
  termMonths: number;
  totalRepayable: number;
  amountRepaid: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
  purpose: string;
  approvedBy?: ObjectId;    // ref: User (admin)
  approvedAt?: Date;
  dueDate?: Date;
  repayments: IRepayment[];
  createdAt: Date;
  updatedAt: Date;
}

interface IRepayment {
  amount: number;
  paidAt: Date;
  transactionRef: string;
}
```

### Notification

```typescript
interface INotification {
  _id: ObjectId;
  recipient: ObjectId;      // ref: User
  title: string;
  message: string;
  type: 'transaction' | 'loan' | 'system' | 'alert' | 'promotion';
  isRead: boolean;
  relatedResource?: {
    resourceType: 'transaction' | 'loan' | 'wallet';
    resourceId: ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Validation Strategy

All incoming request data is validated using **Zod schemas** before reaching controller logic. A reusable `validate` middleware wraps Zod parsing and returns structured error messages on failure.

### Example Zod Schema

```typescript
// wallet.validation.ts
import { z } from 'zod';

export const transferFundsSchema = z.object({
  body: z.object({
    recipientWalletId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid wallet ID'),
    amount: z.number().positive('Amount must be greater than 0').max(1_000_000, 'Exceeds maximum transfer limit'),
    description: z.string().max(200).optional(),
  }),
});

export type TransferFundsInput = z.infer<typeof transferFundsSchema>['body'];
```

### Validate Middleware

```typescript
// middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Validation failed',
          errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
```

---

## Error Handling

### Custom ApiError Class

```typescript
// utils/ApiError.ts
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: unknown[] = [],
    public stack?: string
  ) {
    super(message);
    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }
}
```

### Global Error Middleware

All unhandled errors are caught by a single global middleware that normalizes the response:

```typescript
// middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

### HTTP Status Codes Used

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST creating a resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation failure, malformed body |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Insufficient role/permission |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource (email, phone) |
| 422 | Unprocessable Entity | Business logic violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server-side error |

---

## Environment Variables

Create a `.env` file at the root of the project. Refer to `.env.example` for all required fields.

```env
# ─── Application ──────────────────────────────
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# ─── Database ─────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/digital-wallet
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/digital-wallet

# ─── Authentication ───────────────────────────
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── Bcrypt ───────────────────────────────────
BCRYPT_SALT_ROUNDS=12

# ─── Email (Nodemailer) ───────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Digital Wallet <no-reply@digitalwallet.com>

# ─── File Uploads ─────────────────────────────
UPLOAD_DEST=uploads/
MAX_FILE_SIZE_MB=5

# ─── Rate Limiting ────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ─── CORS ─────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.com

# ─── Wallet Limits ────────────────────────────
MAX_TRANSFER_AMOUNT=1000000
MIN_TRANSFER_AMOUNT=1
TRANSACTION_FEE_PERCENTAGE=0.5
```

---

## Getting Started

### Prerequisites

Make sure the following are installed on your machine:

- **Node.js** v18.x or later — [Download](https://nodejs.org)
- **npm** v9.x or later (comes with Node.js)
- **MongoDB** v6.x+ — [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas
- **Git** — [Download](https://git-scm.com)

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/jenifaa/Digital-Wallet-System-Backend.git
cd Digital-Wallet-System-Backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

**4. Ensure MongoDB is running:**
```bash
# Local MongoDB
mongod --dbpath /data/db

# Or use MongoDB Atlas connection string in .env
```

---

## Running in Development

Start the development server with hot-reload using `ts-node-dev`:

```bash
npm run dev
```

The server will start at `http://localhost:5000` (or your configured `PORT`).

**Available npm scripts:**

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `ts-node-dev --respawn src/server.ts` | Development with hot-reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/server.js` | Run compiled production build |
| `lint` | `eslint src/**/*.ts` | Run ESLint |
| `format` | `prettier --write src/` | Format code with Prettier |
| `seed` | `ts-node src/scripts/seed.ts` | Seed the database |
| `test` | `jest --coverage` | Run all tests |

---

## Running in Production

**1. Build the TypeScript source:**
```bash
npm run build
```

**2. Set `NODE_ENV=production` in your environment.**

**3. Start the production server:**
```bash
npm start
```

For production deployments, it is strongly recommended to use a process manager:

```bash
# Using PM2
npm install -g pm2
pm2 start dist/server.js --name "digital-wallet-api"
pm2 save
pm2 startup
```

---

## Testing

The project uses **Jest** with **Supertest** for integration testing.

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Coverage report:
```bash
npm run test:coverage
```

### Test file structure:

```
tests/
├── auth/
│   ├── auth.register.test.ts
│   ├── auth.login.test.ts
│   └── auth.refresh.test.ts
├── wallet/
│   ├── wallet.transfer.test.ts
│   └── wallet.balance.test.ts
├── loan/
│   └── loan.apply.test.ts
├── notification/
│   └── notification.crud.test.ts
└── helpers/
    ├── testDb.ts        # In-memory MongoDB setup (mongodb-memory-server)
    └── testUser.ts      # Helper to create test users and tokens
```

---

## Database Seeding

A seed script is included to populate the database with initial data for development and testing.

```bash
npm run seed
```

This creates:
- 1 Super-admin account
- 2 Admin accounts
- 10 Sample user accounts with wallets
- Sample transactions between users
- Sample loan records

**Default seeded admin credentials:**
```
Email:    super@gmail.com
Password: 123456789
Role:     super-admin
```

> **Warning:** Never run the seed script in production without reviewing it first.

---

## Security Considerations

This API implements the following security measures:

**Authentication & Tokens**
- JWT tokens signed with strong secrets (use at least 64-character random strings)
- Access tokens expire in 15 minutes; refresh tokens in 7 days
- Passwords hashed with bcrypt (12 salt rounds)

**Input Validation**
- All request bodies, query parameters, and route params are validated with Zod before any processing occurs
- MongoDB ObjectId format validated at schema level

**Rate Limiting**
- Express `rate-limiter-flexible` applied globally (100 req/15 min by default)
- Stricter limits on auth endpoints (e.g., login: 10 req/15 min)

**CORS**
- Strict origin allowlist via `ALLOWED_ORIGINS` environment variable
- Credentials mode enabled only for trusted origins

**HTTP Security Headers**
- `helmet` middleware adds security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`

**Data Exposure Prevention**
- Passwords and sensitive fields are excluded from all API responses using Mongoose `select: false`
- Error stack traces hidden in production mode

**File Upload Safety**
- Multer configured with file type whitelist (JPEG, PNG, WebP only)
- Max file size enforced (5 MB default)
- Files stored with UUID-based names to prevent path traversal

**Atomic Wallet Operations**
- Fund transfers use MongoDB sessions with multi-document transactions to prevent race conditions and ensure atomicity

---

## Performance & Scalability

**Database Indexing**

Key indexes are defined at the model level to ensure fast queries:

```typescript
// transaction.model.ts
TransactionSchema.index({ sender: 1, createdAt: -1 });
TransactionSchema.index({ receiver: 1, createdAt: -1 });
TransactionSchema.index({ reference: 1 }, { unique: true });
TransactionSchema.index({ status: 1 });

// notification.model.ts
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// user.model.ts
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });
```

**Pagination**

All list endpoints use cursor-style pagination by default. Never fetch unbounded result sets. The `paginate` utility is applied consistently:

```typescript
// utils/paginate.ts
export const paginate = async <T>(
  model: Model<T>,
  query: FilterQuery<T>,
  options: { page: number; limit: number; sort?: Record<string, 1 | -1>; populate?: string | string[] }
) => { ... };
```

**Connection Pooling**

Mongoose connection pooling is configured for production:

```typescript
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

## Deployment
 
### Deploying to Vercel
 
> **Important Note:** Vercel is primarily designed for frontend and serverless deployments. To deploy an Express.js backend on Vercel, the app must be adapted to run as a **Vercel Serverless Function**. This is done by exporting the Express `app` instance as the default export from an API entry point.
 
---
 
### Step 1 — Adapt the Express App for Vercel
 
Vercel requires a single handler entry point. Create or update `api/index.ts` (Vercel treats the `api/` directory as serverless functions):
 
```typescript
// api/index.ts
import app from '../src/app';
 
export default app;
```
 
Ensure `src/app.ts` exports the Express app **without** calling `.listen()` — that is handled by `src/server.ts` for local development only:
 
```typescript
// src/app.ts
import express from 'express';
// ... all middleware and route registrations ...
 
const app = express();
// register routes, middleware, etc.
 
export default app; // ✅ export only — do NOT call app.listen() here
```
 
```typescript
// src/server.ts  (used only for local dev, not deployed to Vercel)
import app from './app';
import { connectDB } from './config/db';
 
const PORT = process.env.PORT || 5000;
 
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
```
 
---
 
### Step 2 — Add `vercel.json`
 
Create a `vercel.json` at the project root to configure routing and the build output:
 
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```
 
This tells Vercel to compile `api/index.ts` using the Node.js runtime and forward all incoming requests to it.
 
---
 
### Step 3 — Update `tsconfig.json`
 
Ensure TypeScript is configured to output to a `dist` directory and that `api/` is included in the compilation:
 
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": ".",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "api/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
 
---
 
### Step 4 — Update `package.json` Scripts
 
Vercel runs the `build` script automatically during deployment:
 
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/src/server.js",
    "vercel-dev": "vercel dev"
  }
}
```
 
---
 
### Step 5 — Deploy via Vercel CLI
 
**Install the Vercel CLI:**
```bash
npm install -g vercel
```
 
**Login to your Vercel account:**
```bash
vercel login
```
 
**Deploy to preview (staging):**
```bash
vercel
```
 
**Deploy to production:**
```bash
vercel --prod
```
 
Vercel will auto-detect your configuration, build the project, and provide a live URL.
 
---
 
### Step 6 — Set Environment Variables on Vercel
 
Never commit your `.env` file. Set all environment variables through the Vercel Dashboard or CLI:
 
**Via Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable from your `.env` file, selecting the appropriate environments (Production, Preview, Development)
**Via Vercel CLI:**
```bash
vercel env add MONGODB_URI
vercel env add JWT_ACCESS_SECRET
vercel env add JWT_REFRESH_SECRET
vercel env add SMTP_HOST
vercel env add SMTP_USER
vercel env add SMTP_PASS
# ... add all variables from .env.example
```
 
**Required environment variables for Vercel:**
 
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string (local MongoDB won't work on Vercel) |
| `JWT_ACCESS_SECRET` | JWT access token signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | e.g., `15m` |
| `JWT_REFRESH_EXPIRES_IN` | e.g., `7d` |
| `NODE_ENV` | Set to `production` |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_USER` | Email SMTP user |
| `SMTP_PASS` | Email SMTP password |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
 
> **Important:** Vercel serverless functions are **stateless and ephemeral**. Use **MongoDB Atlas** (cloud) as your database — local MongoDB instances are not reachable from Vercel's network.
 
---
 
### Step 7 — Connect GitHub for Auto-Deploy (Recommended)
 
1. Push your project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. Vercel auto-detects the `vercel.json` configuration
5. Set environment variables in the dashboard
6. Click **Deploy**
Every push to `main` will automatically trigger a production deployment. Pull requests get isolated **Preview URLs** for testing.
 
---
 
### Vercel Deployment Considerations
 
| Topic | Detail |
|-------|--------|
| **Serverless cold starts** | First request after inactivity may be slower (~500ms); subsequent requests are fast |
| **Function timeout** | Default 10s on Hobby plan; 60s on Pro plan — keep API responses fast |
| **File uploads (Multer)** | Vercel does **not** support persistent local file storage. Use **Cloudinary**, **AWS S3**, or **Vercel Blob** for file uploads instead of `disk` storage |
| **Database** | Must use MongoDB Atlas or another cloud-hosted DB; `localhost` MongoDB won't work |
| **Logs** | Available in Vercel Dashboard → **Functions** → **Logs** |
| **Custom domain** | Add via Vercel Dashboard → **Settings** → **Domains** |
| **Region** | Select the deployment region closest to your MongoDB Atlas cluster to minimize latency |
 
---


## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes with clear messages following Conventional Commits:
   - `feat: add loan repayment reminder notifications`
   - `fix: resolve wallet population issue in user query`
   - `refactor: extract payment fee logic to service layer`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request with a detailed description

**Code Standards:**
- All code must be written in TypeScript with strict mode enabled
- All new endpoints require a corresponding Zod validation schema
- All new endpoints must have at least one integration test
- Run `npm run lint` and `npm run format` before submitting

---



<div align="center">

Built with ❤️ using TypeScript, Express.js, and MongoDB.

</div>