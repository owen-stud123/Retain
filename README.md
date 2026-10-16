# Retain

Retain is a personal expense tracker with monthly budgets, spending insights, and an admin area for managing categories.

## Stack

- **Client:** React, TypeScript, Vite, Material UI, Redux Toolkit
- **Server:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT with user and admin roles

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB running locally or a MongoDB connection string

## Project structure

```text
client/   React frontend
server/   Express API and database models
```

## Local setup

### 1. Configure the server

Copy `server/.env.example` to `server/.env` and set values for your development environment:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/retain
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://127.0.0.1:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-development-password
```

Never commit `.env` files or real credentials.

### 2. Install dependencies

```powershell
Set-Location "server"
npm install

Set-Location "..\client"
npm install
```

### 3. Seed development data

With the server environment configured:

```powershell
Set-Location "server"
npm run seed
```

This creates or updates the configured admin, creates a demo user, adds default categories, and generates sample expenses and a current-month budget.

The seeded demo user is:

```text
Email: demo@retain.app
Password: Password123!
```

Use the configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the admin account. Change development credentials before sharing or deploying the application.

### 4. Start the API

```powershell
Set-Location "server"
npm run dev
```

The API runs on `http://127.0.0.1:5000`. Confirm it is available at:

```text
http://127.0.0.1:5000/api/health
```

### 5. Start the client

In a second terminal:

```powershell
Set-Location "client"
npm run dev
```

Open the Vite URL, normally `http://127.0.0.1:5173`.

## Available client routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | Sign in |
| `/signup` | Public | Create a user account |
| `/` | Authenticated | Dashboard and monthly budget |
| `/expenses` | Authenticated | List, filter, and create expenses |
| `/expenses/:id` | Authenticated | View, edit, or delete an expense |
| `/admin` | Admin only | View insights and manage categories |

## API areas

- `/api/health` — health check
- `/api/auth` — signup, login, and current-user authentication
- `/api/dashboard` — user spending summaries
- `/api/expenses` — expense CRUD and filtered lists
- `/api/budgets` — monthly budget operations
- `/api/categories` — category reads and admin category CRUD
- `/api/admin` — admin-only insights

## Validation

Build and type-check the client:

```powershell
Set-Location "client"
npx tsc --noEmit
npm run build
```

Check the server health endpoint while the API is running:

```powershell
Invoke-WebRequest http://127.0.0.1:5000/api/health
```

The server test script is not implemented yet; runtime verification currently uses the health endpoint and the application flows above.