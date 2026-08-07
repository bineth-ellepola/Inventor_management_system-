# NANCE Inventory Management System (NIMS)

A full MERN-stack app implementing the spec: role-based auth (Store Keeper / Manager),
raw material requests with a manager approval workflow, dashboards, and a shared
inventory ledger.

## What's included

**Backend** (`/server`) — Node.js + Express + MongoDB (Mongoose) + JWT
- Role-based auth: `storekeeper`, `manager`
- Materials API: create/edit/delete pending requests, browse approved inventory,
  search / filter by category / pagination
- Approvals API: manager views pending requests, approves (merges refills into
  existing stock) or rejects, plus approval history
- Dashboard stats endpoints for both roles

**Frontend** (`/client`) — React (Vite) + Tailwind CSS + React Router + Axios + React Toastify
- Login page
- Store Keeper dashboard (stat cards) + "My Requests" (add / edit / delete pending, refill)
- Manager dashboard (stat cards) + Approvals (approve / reject, history tab)
- Shared Inventory page (search, filter, pagination)
- Design: an industrial "manifest/ledger" look — graphite sidebar, amber accent,
  and a stamp-style status badge (Pending / Approved / Rejected) that echoes a
  real paper requisition stamp.

## Prerequisites

- Node.js 18+
- A MongoDB connection string (MongoDB Atlas, or a local `mongod`)

## Quick start (recommended)

From the repo root, install everything and run both apps together with one command:

```bash
npm run install:all   # installs server + client dependencies
npm run dev            # runs the API and the client concurrently
```

- API: `http://localhost:5050/api` (check `GET /api/health` to confirm it's up)
- Client: `http://localhost:5173`

> Note: the API defaults to port **5050**, not 5000 — on macOS, port 5000 is
> commonly held by the AirPlay Receiver (Control Center), which causes an
> `EADDRINUSE` crash on startup. If you change `PORT` in `server/.env`, also
> update `VITE_API_URL` in `client/.env` to match.

This requires `server/.env` and `client/.env` to already exist (see the manual
setup below for what to put in them). The root `package.json` only orchestrates
the two dev servers via `concurrently`; it has no dependencies of its own beyond that.

## Manual setup (run each app separately)

### 1. Backend setup

```bash
cd server
npm install
```

Edit `.env` and set:
```
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any long random string>
PORT=5050
CLIENT_URL=http://localhost:5173
```

Run it:
```bash
npm run dev     # requires nodemon (already in devDependencies)
# or
npm start
```

The API will be live at `http://localhost:5050/api`. Check `GET /api/health` to confirm it's up.

### 2. Frontend setup

```bash
cd client
npm install
cp .env.example .env
```

By default `.env` points at `http://localhost:5050/api` — change it if your backend runs elsewhere.

Run it:
```bash
npm run dev
```

The app will be live at `http://localhost:5173`.

## 3. Create your first users

There's no seed script, so register your first Manager and Store Keeper via the API directly
(the register endpoint is open so you can bootstrap accounts — consider locking it down or
restricting it to managers-only once you have a manager account):

```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Manager","email":"manager@nance.com","password":"password123","role":"manager"}'

curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sam Storekeeper","email":"storekeeper@nance.com","password":"password123","role":"storekeeper"}'
```

Then log in through the app at `http://localhost:5173/login` with either account.

## How the approval workflow works

1. Store Keeper submits a **new material** or a **refill** of an existing approved item.
2. The request is created with `status: "Pending"`.
3. Manager reviews it on the Approvals page:
   - **Approve** → for a new material, the request itself becomes the approved inventory
     record; for a refill, its quantity is added onto the existing approved material and the
     refill request is marked Approved too.
   - **Reject** → status becomes `Rejected` with an optional reason; inventory is untouched.
4. Only `Approved` materials show up in the shared Inventory view and dashboard counts.

## API reference

| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Create an account |
| POST | /api/auth/login | Public | Log in, returns JWT |
| GET | /api/auth/profile | Private | Current user profile |
| GET | /api/materials | Private | Approved inventory (search/category/pagination) |
| GET | /api/materials/mine | Store Keeper | My requests (any status) |
| GET | /api/materials/:id | Private | Single material |
| POST | /api/materials | Store Keeper | Submit new/refill request |
| PUT | /api/materials/:id | Store Keeper | Edit own pending request |
| DELETE | /api/materials/:id | Store Keeper | Delete own pending request |
| GET | /api/materials/stats/storekeeper | Store Keeper | Dashboard card stats |
| GET | /api/materials/stats/manager | Manager | Dashboard card stats |
| GET | /api/approvals | Manager | Pending requests |
| GET | /api/approvals/history | Manager | Approved + rejected history |
| PUT | /api/approvals/:id/approve | Manager | Approve a request |
| PUT | /api/approvals/:id/reject | Manager | Reject a request |

## Notes / good next steps (see "Future Enhancements" in the original spec)

- Lock down `/api/auth/register` behind manager auth once you have your first manager account
- Add barcode/QR support, low-stock notifications, PDF/Excel reports, audit logs,
  email notifications, and multi-warehouse support as described in the original brief
