# StudioSync

StudioSync has three parts that need to run: the **database** stores your records, the **backend** handles login and data, and the **frontend** displays the website.

## Run the app on this computer

Use these steps each time you want to work on the app. This computer already has the project and database set up.

### 1. Open PowerShell in the project folder

Open a PowerShell terminal and enter:

```powershell
cd C:\Users\user\StudioSync
```

Run all commands below from this folder. Use `npm.cmd` as shown so PowerShell does not block `npm.ps1`.

### 2. Start the database

```powershell
npm.cmd run db:start
```

Wait for **StudioSync MySQL started on port 3317**.

If it says **Port 3317 is already occupied**, the database may already be running. Continue to step 3, then check the backend link in that step. If the health check fails, see Troubleshooting below.

### 3. Start the backend in this terminal

```powershell
npm.cmd run dev:api
```

Wait for **StudioSync API: http://127.0.0.1:4017**. Leave this terminal open and running.

Open this link in your browser to check that the backend can reach the database:

**http://127.0.0.1:4017/api/health**

You should see a response containing `"status":"ok"`. This is a status page, not the website.

### 4. Open a second PowerShell terminal and start the frontend

Keep the backend terminal running. In a new terminal, enter:

```powershell
cd C:\Users\user\StudioSync
npm.cmd run dev:web
```

Wait for Vite to show **http://127.0.0.1:5177/**. Leave this terminal open too.

### 5. Open the website

Visit **http://127.0.0.1:5177** in your browser. Log in with your existing account, or select **Register your studio** to create one.

While using the app, keep both terminals open:

| Terminal | What runs there |
| --- | --- |
| First terminal | Backend: `npm.cmd run dev:api` |
| Second terminal | Frontend: `npm.cmd run dev:web` |

The database runs in the background after step 2. You do not need a third terminal for it.

### 6. Stop the app when finished

Press **Ctrl+C** in each of the two running terminals. If asked whether to terminate the batch job, type **Y** and press Enter.

Then stop the database from either terminal:

```powershell
npm.cmd run db:stop
```

Next time, repeat steps 1?5. You do not need to install or set up the database again.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| ?An unexpected server error occurred? when logging in | Open the backend health link from step 3. If it fails, check the backend terminal for the error. If it shows `ECONNREFUSED` on port `3317`, start the database with step 2, then try again. |
| The website does not open | Make sure the frontend terminal is still running. Use `http://127.0.0.1:5177`. |
| The backend health page does not open | Start the backend using step 3 and check that terminal for errors. |
| Port `5177` or `4017` is already in use | Check your other terminals: that part of the app may already be running. Use the existing process, or press Ctrl+C in its terminal before restarting it. |
| Database start says port `3317` is occupied | Check the backend health page. If it reports `"status":"ok"`, continue using the app. Otherwise, inspect the backend terminal; do not delete or recreate the database. |
| PowerShell blocks `npm.ps1` | Use `npm.cmd`, not `npm`. |

## First-time setup on another Windows computer only

**Skip this section on this computer.** These commands are for a fresh copy of the project without an existing `.env` or `.runtime/mysql/data` directory.

1. Install Node.js and MySQL Server 8.0.
2. Open PowerShell in the project folder.
3. Install the project dependencies:

```powershell
npm.cmd install
```

4. Create the local database, then create its tables and sample data:

```powershell
npm.cmd run db:setup
npm.cmd run db:seed
```

Wait for each command to finish before running the next. Setup starts the database for you, so continue with **step 3 (Start the backend)** in the running guide above.

The default MySQL program folder is `C:/Program Files/MySQL/MySQL Server 8.0/bin`. If yours is different, set it before running setup:

```powershell
$env:MYSQL_BIN = 'C:/your/MySQL/bin'
```

`db:setup` refuses to overwrite an existing setup. Do not delete `.env` or the database folder to make it run again. `db:seed` creates/migrates tables and adds sample data only to an empty database; it preserves existing studio records.

## Optional reference

You do not need the sections below to start the app.

### Start frontend and backend together

Once the database is running, you can use `npm.cmd run dev` in one terminal instead of the separate backend and frontend commands. Use either this method or the two-terminal method above to avoid port conflicts.

### Database connection details

| Setting | Value |
| --- | --- |
| Host | 127.0.0.1 |
| Port | 3317 |
| Database | studiosync |
| Application user | studiosync |
| Password | Generated locally; stored as `DB_PASSWORD` in `.env` |
| Data and configuration | `.runtime/mysql/` |

This is a separate local MySQL instance. It does not change other MySQL databases or Windows services. Keep `.env` and `.runtime/` private and out of Git.

## Included workflows

- Public introduction, studio registration, role-based login, contact inquiry storage, and informational pages.
- Dashboard, weekly/list class calendar, member management, trainers, classes, plans, branches, rooms, and staff accounts.
- Transactional bookings: capacity checks, membership eligibility, reserved/used/available credits, an append-only credit ledger, attendance, late cancellation and no-show policies.
- Class waitlists with expiring offers and explicit acceptance; secure short-lived QR codes with front-desk token entry and manual check-in.
- One-time/daily/weekly schedules, room and trainer conflict checks, trainer availability/time off, and room closures.
- Membership purchases and renewal through a new membership record, manual activation through payment, freeze/resume, purchased-term snapshots, and audited credit adjustments.
- Room/whole-venue rental reservations with calculated hourly charges, room capacity checks, and conflict protection against classes, closures, and retreat activities.
- Retreat programs, itinerary activities, member/guest registrations, multi-seat capacity checks, waitlist offers, and per-seat check-in.
- Recorded Cash/GCash/Bank Transfer payments, invoices, validated refunds, CSV exports, and browser printing / save as PDF.
- In-app notifications and configurable reminders, activity logs, validated member CSV import, profile/password changes, and database backups.

Default policies: 12-hour cancellation cutoff; late cancellation/no-show credit forfeiture; manual Cash, GCash, and Bank Transfer payment recording. These are editable under Settings. Datetimes are stored as UTC; the sample studio uses Asia/Manila.

See [implementation scope](docs/IMPLEMENTATION.md) for differences from the full proposed PDF specification, including production integrations and advanced workflows that remain unfinished.

## Checks and backup

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
npm.cmd run db:backup
```

Integration tests use a temporary tenant and remove their fixtures. Browser tests use installed Microsoft Edge and require the local API/web server. They exercise the sample accounts; the member form test archives its test member. Backups are consistent SQL snapshots in `.runtime/backups/`; the backup script uses only port 3317.

For a production-style local run, run `npm.cmd run build`, then `npm.cmd start` and visit http://127.0.0.1:4017. The API serves the compiled frontend. Keep `APP_ORIGIN` aligned with the URL in use.

## Deployment later

Nothing has been published. Use a Node-capable host and a persistent MySQL database when deploying. Configure environment variables from `.env.example`, HTTPS, production origins, database backups, and real account credentials. Set `NODE_ENV=production` only behind HTTPS because session cookies then use the Secure flag. Loopback binding is intentional for this local installation; adapt the server binding for your host. The dedicated local MySQL instance must not be exposed to the public internet. Replace demo accounts/data and finalize the studio's policies before using real customer records.

Locally extracted PDF reference text in `docs/specifications/` is excluded from Git. Historical schedules were adapted to relative demonstration dates. Prices, packages, rental rates, retreat programs, and member contacts are sample data, not verified business offerings.
