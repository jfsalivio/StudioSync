# StudioSync

A web platform for boutique fitness studios. React 19 + TypeScript + Vite + Tailwind CSS 4 on the frontend; Express 5 and MySQL 8 on the backend. The interface uses the updated bright off-white and warm sage palette, with terracotta and ochre accents using Inter throughout.

## Open the application

Web interface: **http://127.0.0.1:5177**
API / database health: **http://127.0.0.1:4017/api/health**

Register a studio from the landing page to create an independent workspace, its administrator, and its first branch. Add a room, trainer, class, and plan before scheduling your first class.

## Start again later

From PowerShell in this directory:

```powershell
npm.cmd run db:start
npm.cmd run dev
```

If StudioSync MySQL is already running, skip `db:start`. The start command refuses to take over an occupied port. Keep the terminal running while using the application. Stop the web/API process with Ctrl+C. To stop only StudioSync's database:

```powershell
npm.cmd run db:stop
```

## Dedicated MySQL connection

| Setting | Value |
| --- | --- |
| Host | 127.0.0.1 |
| Port | **3317** |
| Database | studiosync |
| Application user | studiosync |
| Password | Generated locally; read `DB_PASSWORD` in `.env` |
| Data and configuration | `.runtime/mysql/` |

The dedicated connection avoids modifying other MySQL instances. StudioSync uses a separate `mysqld.exe` process, independent data directory, generated credentials, loopback binding, and disabled MySQL X Protocol. No Windows service or global database configuration is changed. `.env`, `.runtime/`, and dependencies are excluded from Git. Local recovery credentials remain in the ignored runtime directory and must not be committed.

On a fresh checkout, install Node.js and MySQL 8, then:

```powershell
npm.cmd install
npm.cmd run db:setup
npm.cmd run db:seed
npm.cmd run dev
```

`db:setup` runs once and refuses to overwrite an existing `.env` or data directory. Set `MYSQL_BIN` if MySQL's binaries are not in `C:/Program Files/MySQL/MySQL Server 8.0/bin`. `db:seed` creates/migrates schema and seeds only an empty database; it preserves existing studio records.

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
