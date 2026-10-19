# Retain

Retain is a personal expense tracker with monthly budgets, spending insights, and an admin area for managing categories.

## Stack

- **Client:** React, TypeScript, Vite, Material UI, Redux Toolkit
- **Server:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT with user and admin roles

## Prerequisites

- Node.js 22 or newer
- npm
- MongoDB running locally or a MongoDB connection string

## Project Structure

```text
client/   React frontend
server/   Express API and database models
```

## Local Setup

### 1. Configure the server

Copy `server/.env.example` to `server/.env` and configure your development environment.

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

Run these commands from the project root in PowerShell:

```powershell
Set-Location "server"
npm install

Set-Location "..\client"
npm install
```

### 3. Seed development data

With the server environment configured, run:

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

The API runs at `http://127.0.0.1:5000`.

Confirm it is available at:

`http://127.0.0.1:5000/api/health`

### 5. Start the client

Open a second terminal from the project root and run:

```powershell
Set-Location "client"
npm run dev
```

Open the Vite URL, normally `http://127.0.0.1:5173`.

## Available Client Routes

| Route | Access | Purpose |
|---|---|---|
| `/login` | Public | Sign in |
| `/signup` | Public | Create a user account |
| `/` | Authenticated | Dashboard and monthly budget |
| `/expenses` | Authenticated | List, filter, and create expenses |
| `/expenses/:id` | Authenticated | View, edit, or delete an expense |
| `/admin` | Admin only | View insights and manage categories |

## Features

- **Accounts and roles:** Sign up, sign in, and sign out using JWT authentication with `user` and `admin` roles. React Context manages authentication state, role checks, and protected routes through `AuthContext`, `RequireAuth`, and `RequireAdmin`.
- **Session handling:** Sessions survive page refreshes. If the API is temporarily unavailable, users can retry or sign out.
- **Expense management:** Create, view, edit, and delete expenses with a title, amount, category, date, payment method, and optional notes. Users can access only their own expenses.
- **Search, filters, and sorting:** Redux Toolkit manages expense search text, category, payment method, date range, amount range, sort field, sort order, and page through `filtersSlice`. Fetched expenses are managed by `expensesSlice`.
- **Pagination:** Displays 10 expenses per page and uses API metadata such as `total`, `page`, and `pages`. Changing a filter returns the list to page 1.
- **Monthly budgets and dashboard:** Set a budget for each month and view total spending, remaining budget, percentage used, budget status, highest expense, spending by category, and recent expenses.
- **Admin area:** View platform insights, including user count, expense count and value, expenses this month, most and least used categories, and recent users.
- **Category management:** Admins can create, rename, and delete categories. When a category is deleted, its expenses are moved to the protected `Uncategorized` category.

## API Reference

All routes except health, signup, and login require an `Authorization: Bearer <token>` header.

Errors are returned as JSON with a message, for example:

```json
{
  "message": "Error description"
}
```

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/signup` | Public | Create a user. Body: `name`, `email`, `password` (8+ characters) |
| POST | `/api/auth/login` | Public | Sign in. Body: `email`, `password` |
| GET | `/api/auth/me` | User | Confirm the session and return a refreshed token |
| GET | `/api/expenses` | User | List own expenses. Supports search, filters, sorting, and pagination |
| POST | `/api/expenses` | User | Create an expense |
| GET | `/api/expenses/:id` | Owner | Get one expense |
| PUT | `/api/expenses/:id` | Owner | Update an expense |
| DELETE | `/api/expenses/:id` | Owner | Delete an expense |
| GET | `/api/budgets/:month` | User | Get the budget summary for `YYYY-MM` |
| PUT | `/api/budgets/:month` | User | Set the budget. Body: `amount` (0 or more) |
| GET | `/api/dashboard?month=YYYY-MM` | User | Get the dashboard summary for a month; defaults to the current month |
| GET | `/api/categories` | User | List categories |
| POST | `/api/categories` | Admin | Create a category. Body: `name` |
| PUT | `/api/categories/:id` | Admin | Rename a category |
| DELETE | `/api/categories/:id` | Admin | Delete a category; its expenses move to `Uncategorized` |
| GET | `/api/admin/insights` | Admin | Get platform statistics |

### Expense List Query Parameters

The `GET /api/expenses` endpoint supports:

- `search`
- `category`
- `paymentMethod`
- `startDate` and `endDate`
- `minAmount` and `maxAmount`
- `sortBy` (`date` or `amount`)
- `order` (`asc` or `desc`)
- `page`
- `limit` (maximum 100)

### Expense Creation Fields

The `POST /api/expenses` endpoint accepts:

- `title`
- `amount`
- `category` (category ID)
- `date`
- `paymentMethod` (`cash`, `card`, `bank_transfer`, `mobile_money`, or `other`)
- `notes` (optional)

## Validation and Tests

### Client type-check and build

Run:

```powershell
Set-Location "client"
npx tsc --noEmit
npm run build
```

### API integration tests

The integration suite contains 27 tests covering authentication, ownership, validation, search, filters, sorting, pagination, budgets, the dashboard, and admin authorization.

The tests require a **disposable MongoDB database whose name contains `test`**. The suite deletes data in the selected test database and refuses to run if the database name does not meet the requirement. Never use your production database for testing.

For a local MongoDB instance:

```powershell
Set-Location "server"
$env:TEST_MONGO_URI = "mongodb://127.0.0.1:27017/retain_test"
npm test
```

If `TEST_MONGO_URI` is not set, the tests are skipped.

## Deployment (Render and MongoDB Atlas)

Retain is deployed using two Render services connected to MongoDB Atlas:

- API: Render Web Service
- Client: Render Static Site

### API — Render Web Service

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Configure the following environment variables in Render. Do not commit production secrets to the repository.

| Variable | Value |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string, including the database name |
| `JWT_SECRET` | A long, randomly generated secret |
| `CLIENT_URL` | `https://retain-client-m0fw.onrender.com` |
| `ADMIN_EMAIL` | Needed when running the seed script |
| `ADMIN_PASSWORD` | Needed when running the seed script |

Render sets `PORT` automatically.

In MongoDB Atlas, configure **Network Access** to allow the Render service to connect. Render's free web services do not have fixed outbound IP addresses. If you allow `0.0.0.0/0`, protect the database with a strong password and appropriate database-user permissions.

### Client — Render Static Site

| Setting | Value |
|---|---|
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Environment variable | `VITE_API_URL=https://retain-api-io2b.onrender.com/api` |

Configure the following rewrite rule for client-side routing:

| Setting | Value |
|---|---|
| Source | `/*` |
| Destination | `/index.html` |
| Action | Rewrite |

### Deployed URLs

- **Client:** https://retain-client-m0fw.onrender.com
- **API:** https://retain-api-io2b.onrender.com
- **API health check:** https://retain-api-io2b.onrender.com/api/health

Render free web services may sleep when idle. The first API request after a pause can take up to a minute. The client may show a connection error while the API starts; retry after a short wait.

## Troubleshooting

### `querySrv ECONNREFUSED` or `querySrv ETIMEOUT`

MongoDB Atlas `mongodb+srv://` connection strings require DNS SRV lookups. Some home, campus, mobile, or Windows network configurations can block these queries.

If the API cannot connect locally:

1. Try changing your computer's DNS resolver to a public resolver such as `8.8.8.8` or `1.1.1.1`, then restart the terminal.
2. Alternatively, use an appropriate standard MongoDB connection string from Atlas instead of the SRV connection string, if one is available for your cluster.

Avoid hardcoding DNS server addresses in the application code.
