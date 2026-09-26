# FlowPilot — Full-Stack SaaS (Frontend + Node/Express Backend + MongoDB Atlas)

Your original landing page, now backed by a real signup/login system and a working
dashboard: projects, tasks, clients, automations and analytics — all stored in your
own MongoDB Atlas (cloud) database.

```
flowpilot/
├── frontend/           ← your landing page (untouched design) + login, signup, dashboard
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   └── dashboard.html
├── backend/            ← Node.js + Express + Mongoose API
│   ├── server.js
│   ├── seed.js          (optional demo data)
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── .env.example
└── README.md            (this file)
```

The backend serves the frontend too, so once it's running, the whole site — landing
page, login, signup, dashboard — lives at one URL (e.g. `http://localhost:5000`).

---

## 1. Get a free MongoDB Atlas database (5 minutes)

1. Go to **https://www.mongodb.com/cloud/atlas/register** and create a free account.
2. Create a free **M0 cluster** (no credit card needed).
3. Under **Database Access**, create a database user with a username and password
   (save these — you'll need them).
4. Under **Network Access**, click **Add IP Address** → **Allow access from anywhere**
   (`0.0.0.0/0`) — fine for development; tighten this later for production.
5. Click **Connect** on your cluster → **Drivers** → copy the connection string. It
   looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the database user you created, and add
   `/flowpilot` before the `?` so it points at a database named `flowpilot`:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/flowpilot?retryWrites=true&w=majority
   ```

---

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and paste in:
- `MONGODB_URI` — the connection string from step 1
- `JWT_SECRET` — any long random string. You can generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

---

## 3. Install dependencies and run

```bash
cd backend
npm install
npm start
```

You should see:
```
MongoDB connected: cluster0-shard-...
FlowPilot server running at http://localhost:5000
```

Open **http://localhost:5000** in your browser — that's your landing page, live,
talking to your real MongoDB Atlas database.

- Click **Start free** → creates a real account + workspace in MongoDB.
- Click **Log in** → signs you into your dashboard.
- The dashboard's Projects / Tasks / Clients / Automations / Overview are all real
  CRUD screens reading and writing to your database.

### Optional: load demo data instantly
```bash
npm run seed
```
This creates a demo workspace with sample clients, projects, tasks, automations and
7 days of automation-run history, so the dashboard looks populated right away.
Log in with:
```
Email:    demo@flowpilot.com
Password: Demo12345!
```

For development with auto-restart on file changes:
```bash
npm run dev
```

---

## 4. What's actually implemented

**Auth**
- Signup creates a `Workspace` + an `owner` `User`, hashes the password with bcrypt,
  and sets a secure `httpOnly` JWT cookie.
- Login verifies credentials and sets the same cookie.
- Every API route below is protected — it only ever reads/writes data that belongs
  to the logged-in user's workspace.

**Data model** (MongoDB collections, via Mongoose)
- `Workspace` — name, plan (starter/growth/scale)
- `User` — name, email, hashed password, role (owner/admin/member)
- `Client` — name, email, company, status (lead/active/inactive)
- `Project` — name, status, progress %, linked client
- `Task` — title, status (todo/in-progress/done), priority, linked project
- `Automation` — name, trigger, AI step, action, status, run/success counters
- `AutomationRun` — one record per execution (success/failed), used for the chart

**API** (all under `/api`, all JSON)
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/clients          POST /api/clients
PUT    /api/clients/:id      DELETE /api/clients/:id

GET    /api/projects         POST /api/projects
PUT    /api/projects/:id     DELETE /api/projects/:id

GET    /api/tasks            POST /api/tasks
PUT    /api/tasks/:id        DELETE /api/tasks/:id

GET    /api/automations      POST /api/automations
PUT    /api/automations/:id  DELETE /api/automations/:id
POST   /api/automations/:id/run   (simulates a run, logs it, updates stats)

GET    /api/analytics/summary
```

**Security**
- Passwords hashed with bcrypt (never stored in plain text)
- JWT stored in an `httpOnly` cookie (not readable by JavaScript / not stealable via XSS)
- `helmet` for security headers
- Rate limiting on `/api/auth/*` (30 requests / 15 min) to slow down brute-force attempts
- Input validation on signup (`express-validator`)
- Every query is scoped to `req.user.workspace`, so one workspace can never see another's data

---

## 5. Putting this on your agency portfolio / deploying it live

For a public link people can actually click:
- **Backend**: deploy the `backend/` folder to **Render**, **Railway**, or **Fly.io**
  (all have free tiers). Set the same environment variables (`MONGODB_URI`,
  `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`) in their dashboard.
- **Database**: your MongoDB Atlas cluster from step 1 already works from anywhere —
  no change needed.
- Because the backend also serves the frontend (`frontend/` folder), you don't need a
  separate static host — one deployed backend = the whole live site.
- Update `CLIENT_URL` in your `.env` to your real deployed URL once you have one, so
  cookies and CORS behave correctly in production.

## 6. Notes / honest limitations

- The "AI processing" step shown in automations (drafting emails, etc.) is currently
  **simulated** — running an automation logs a success/failure and updates stats, but
  it doesn't call a real AI model or send real emails yet. Wiring that up (e.g. to the
  Anthropic API or an email service like Resend/SendGrid) is a natural next step and
  the `Automation` model already has the right fields (`trigger`, `aiStep`, `action`)
  to hang that logic off of.
- Team invites / multiple members per workspace aren't built yet — every signup is
  currently a single `owner` user. The `role` field and `authorize()` middleware are
  already in place to extend this.
- This is a solid, secure foundation for a portfolio piece or an MVP — not yet a
  production-hardened multi-tenant SaaS (e.g. no email verification, no password
  reset flow yet).

---

## 7. Fixes applied in this revision (deployment-readiness pass)

- **`trust proxy` was missing** — on Render/Railway/Fly/Heroku, the app sits
  behind a reverse proxy. Without `app.set('trust proxy', 1)`, `express-rate-limit`
  throws on requests carrying an `X-Forwarded-For` header, which would have
  crashed every login/signup attempt in production. Fixed in `server.js`.
- **Missing env-var validation** — the server now refuses to start with a
  clear message if `JWT_SECRET` is unset or still the placeholder value,
  instead of silently signing insecure tokens.
- **CORS was too permissive** — in production it now only allows the exact
  `CLIENT_URL` you configure, instead of reflecting any origin back on
  credentialed requests.
- **Mass-assignment on every `PUT` route** — `Client`, `Project`, `Task` and
  `Automation` updates used to pass the raw request body straight into
  `findOneAndUpdate`, so a client could smuggle in fields like `workspace` and
  corrupt its own records. All four controllers now whitelist exactly the
  fields that route is allowed to change (see `backend/utils/pick.js`).
- **Orphaned `Workspace` on signup failure** — if `Workspace.create()`
  succeeded but the user record then failed to save, the workspace was left
  behind with no valid owner. Signup now rolls that back.
- **7-day automation chart bucketing bug** — day buckets were computed using
  the server's local timezone while run dates were compared in UTC, which
  could silently shift a run into the wrong day's bar depending on where the
  server is hosted. Now bucketed consistently in UTC end-to-end (backend and
  frontend chart labels).
- **Tasks tab "Project" dropdown was empty on first visit** — it only got
  populated as a side effect of visiting the Projects tab first. It now loads
  independently whenever the Tasks tab opens.
- **No general API rate limiting** — only `/api/auth/*` was protected; a
  lightweight limiter now covers all `/api/*` routes.
- **No 404 handling for the site itself** — unmatched non-API routes now
  redirect to the landing page instead of showing Express's bare error page.
- Added `engines.node` to `package.json` and a `Procfile`, so Render/Railway/
  Heroku-style platforms detect the correct runtime and start command
  automatically.

Every backend file was also syntax-checked (`node --check`) and every
`require()` cross-referenced against `package.json` — nothing missing,
nothing unused.
