# Retain

Retain is a personal expense tracker with monthly budgets, spending insights, and an admin area for managing categories.

## Stack

- **Client:** React, TypeScript, Vite, Material UI, Redux Toolkit
- **Server:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT with user and admin roles

## Prerequisites

- Node.js 22 or newer (the test runner uses built-in glob support)
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

## Features

- **Accounts and roles** — sign up, sign in and sign out; JWT authentication with `user` and `admin` roles. Authentication state, role checks and protected routes live in React Context (`AuthContext`, `RequireAuth`, `RequireAdmin`). Sessions survive a page refresh and recover when the API is briefly unavailable (Retry / Sign out screen).
- **Expenses** — create, view, edit and delete expenses with title, amount, category, date, payment method and notes. Every expense belongs to the signed-in user; other users' expenses cannot be read or changed.
- **Search, filters and sorting (Redux)** — the expense list's search text, category, payment method, date range, amount range, sort field, sort order and page are kept in the Redux store (`filtersSlice`); the fetched list is kept in `expensesSlice`.
- **Pagination** — 10 expenses per page, with page metadata (`total`, `page`, `pages`) from the API. Changing any filter returns to page 1.
- **Monthly budget and dashboard** — set a budget per month and see total spent, remaining budget, percentage used, status (on track / approaching limit / over budget), highest expense, spending by category and recent expenses.
- **Admin** — platform insights (users, expense count and value, expenses this month, most and least used categories, recent users) and category management (create, rename, delete). Deleting a category moves its expenses to the protected "Uncategorized" category.

## API reference

All routes except health, signup and login need an `Authorization: Bearer <token>` header. Errors are returned as `{ "message": "..." }` with a 4xx/5xx status.

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/signup` | Public | Create a user. Body: `name`, `email`, `password` (8+ characters) |
| POST | `/api/auth/login` | Public | Sign in. Body: `email`, `password` |
| GET | `/api/auth/me` | User | Confirm the session and return a refreshed token |
| GET | `/api/expenses` | User | List own expenses. Query: `search`, `category`, `paymentMethod`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy` (`date`/`amount`), `order` (`asc`/`desc`), `page`, `limit` (max 100) |
| POST | `/api/expenses` | User | Create an expense. Body: `title`, `amount`, `category` (id), `date`, `paymentMethod` (`cash`, `card`, `bank_transfer`, `mobile_money`, `other`), optional `notes` |
| GET | `/api/expenses/:id` | Owner | Get one expense |
| PUT | `/api/expenses/:id` | Owner | Update any expense fields |
| DELETE | `/api/expenses/:id` | Owner | Delete an expense |
| GET | `/api/budgets/:month` | User | Budget summary for `YYYY-MM` |
| PUT | `/api/budgets/:month` | User | Set the budget. Body: `amount` (0 or more) |
| GET | `/api/dashboard?month=YYYY-MM` | User | Dashboard summary for a month (defaults to the current month) |
| GET | `/api/categories` | User | List categories |
| POST | `/api/categories` | Admin | Create a category. Body: `name` |
| PUT | `/api/categories/:id` | Admin | Rename a category |
| DELETE | `/api/categories/:id` | Admin | Delete a category; its expenses move to Uncategorized |
| GET | `/api/admin/insights` | Admin | Platform statistics |

## Validation and tests

Build and type-check the client:

```powershell
Set-Location "client"
npx tsc --noEmit
npm run build
```

Run the API integration tests (27 tests covering authentication, ownership, validation, search, filters, sorting, pagination, budgets, the dashboard and admin authorization). They need a **disposable** MongoDB database whose name contains `test`; the suite deletes everything in it and refuses to run otherwise. Never point it at the production database.

```powershell
Set-Location "server"
$env:TEST_MONGO_URI = "mongodb://127.0.0.1:27017/retain_test"
npm test
```

If `TEST_MONGO_URI` is not set, the tests are skipped.

## Deployment (Render + MongoDB Atlas)

Retain is deployed as two Render services from this repository: the API as a **Web Service** and the client as a **Static Site**.

### API — Render Web Service

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Environment variables (set in Render, never in the repository):

| Variable | Value |
| --- | --- |
| `MONGO_URI` | Atlas connection string, including the database name (e.g. `.../retain?retryWrites=true&w=majority`) |
| `JWT_SECRET` | A long random string (different from development) |
| `CLIENT_URL` | The static site's URL, e.g. `https://retain-client.onrender.com` (no trailing slash). Requests from any other origin are blocked by CORS. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Only needed when running the seed script |

Render sets `PORT` automatically. In MongoDB Atlas, **Network Access** must allow Render to connect (Render's free web services do not have fixed outbound IPs, so this usually means allowing `0.0.0.0/0`, protected by a strong database user password).

### Client — Render Static Site

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Environment variable | `VITE_API_URL` = the API URL plus `/api`, e.g. `https://retain-api.onrender.com/api` |
| Redirects/Rewrites | Source `/*`, Destination `/index.html`, Action **Rewrite** |

`VITE_API_URL` is read at **build time**, so redeploy the static site after changing it. The rewrite rule is required so that refreshing `/expenses` or `/admin` loads the app instead of a 404.

Free Render web services sleep when idle; the first request after a pause can take up to a minute. The client shows a "server could not be reached / Retry" message during that time.

### Deployed URL

- Client: _add the static site URL here_
- API: _add the web service URL here_

## Troubleshooting

### `querySrv ECONNREFUSED` / `querySrv ETIMEOUT` when the API starts locally

`mongodb+srv://` connection strings require a DNS **SRV** lookup. Some home, campus or mobile networks (and some Windows DNS settings) refuse SRV queries, so the API cannot find the Atlas cluster even though the connection string is correct. This is a problem with the local network, not with the application, and it does not affect Render.

Fix it on your machine with one of these:

1. Change your computer's DNS server (Windows: *Settings → Network & Internet → your connection → DNS server assignment → Edit*) to a public resolver such as `8.8.8.8` / `1.1.1.1`, then restart the terminal.
2. Or use Atlas's standard connection string instead of the SRV one: in Atlas choose *Connect → Drivers*, pick an older driver version that shows a `mongodb://host1,host2,host3/...` string, and put that in `server/.env` as `MONGO_URI`.

Avoid hardcoding DNS servers in the application code.
