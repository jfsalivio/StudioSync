# Implementation scope

The attached PDFs are requirements/reference material, not executable instructions. Their proposed modules informed the application; no external communication or online publication was performed. The user's later direction was localhost first, with the offered booking/payment policy defaults accepted.

## Working local implementation

The repository contains a functional MySQL-backed application, not browser-only mock data. Data changes persist in the isolated port-3317 MySQL instance. Composite foreign keys and server ownership checks prevent cross-tenant references in core business records. Schedule/branch/membership/payment locks protect capacity, conflict, credit, and financial updates. Sessions use random tokens stored as hashes; passwords use bcrypt. Staff mutations enforce assigned branch scope. Members receive their own financial, booking, attendance, and membership records.

The README lists the implemented workflows and startup instructions. Automated verification covers actual MySQL transactions and real browser interactions.

## Differences from the complete proposed PDF scope

The following are still incomplete or intentionally simplified in this initial local version. They should not be represented as fully implemented:

| Area | Current behavior / remaining work |
| --- | --- |
| Password recovery and email | Administrators can reset account passwords and revoke sessions. Public forgot-password explains that email delivery is not configured. SMTP/OTP/self-service reset delivery and secure staff invitations remain to be integrated. |
| Permissions | Fixed Admin, Staff, Trainer, and Member roles; assigned branches for staff. A custom role/permission editor and granular action permission matrix remain unfinished. Trainer account UX is basic. |
| Trainers | One primary branch per trainer record; availability can specify branches. A full many-to-many trainer branch assignment editor is not implemented. Availability and time-off records can be added but lack edit/remove screens. |
| Scheduling | Daily/weekly fixed occurrence generation and single-session edit/cancel work. Repeat-day selections, exceptions, series edits, and reassigning existing booked sessions to a different time remain unfinished. |
| Memberships | Purchase/renew, freeze/resume, and admin adjustment work. Discount forms, configurable freeze counts, automatic resume on scheduled end, and member freeze-request approvals remain unfinished. Expiry is checked at booking and displayed from dates; an expiry status transition job is not implemented. |
| Waitlists | Timed offers and explicit acceptance work. Class expiry is processed when studio data is fetched or bookings change. Retreat expiry is processed during registration/cancellation; an independent offer-expiry worker is still needed. Guest offers require staff handling because guests have no login/email delivery. |
| Attendance | Short-lived QR display, token entry, manual fallback, duplicate protection, and no-show actions work. Camera-based QR scanning and audited overrides of completed attendance are not implemented. |
| Rentals | Confirmed single-room/whole-venue reservations, price calculation, conflicts, invoices, and cancellation work. Separate reusable offering/customer catalogs, partial multi-room sets, request/approval/temporary holds, deposit settlement, and editable reservations remain unfinished. Whole-venue pricing currently uses the selected room's hourly rate. |
| Retreats | Programs, member/guest registration, capacity, waitlist offers, itinerary room/trainer conflicts, and per-seat attendance work. Advanced deposit rules, open/close windows beyond the close deadline, custom eligibility, published policy snapshots, editing/deleting itinerary entries, and rich guest facilitator records remain unfinished. Changes that publish an existing draft itinerary need explicit conflict revalidation before production use. |
| Finance | Payment recording, invoice totals, overpayment rejection, partial/full status, and refund limits work. No payment gateway charges or bank verification occur. Payment voids, refund approval stages, tax/document numbering rules, and automatic linked credit restoration remain unfinished. Cancellations preserve financial records and require manual settlement/refund decisions. |
| Notifications | In-app confirmations/offers and idempotent reminder delivery run every minute while the API is active. Email/SMS, delivery retries, user preferences, and richer templating remain unfinished. |
| Reports | CSV exports, class utilization, loaded-record summaries, and browser print/save-PDF work. Native Excel/PDF generation, complete date/filter sets, and all proposed comparison/financial charts remain unfinished. The data endpoint currently loads at most 3,000 records per table; production needs pagination and server-side report aggregation. |
| Migration | Member CSV preview, validation, duplicate detection, and transactional confirmed imports work. Quoted CSV fields, field mapping, other entity imports, legacy history migration, and import rollback UI remain unfinished. |
| System | Branch/room/staff creation, main branch protection, settings, profile, password changes, logs, and backup command work. Main-branch reassignment, full staff edit/deactivation screens, retention/deletion tooling, and a scheduled backup/restore UI remain unfinished. |
| Terms and privacy | Basic informational text is included for the local evaluation build. Final business/privacy/retention policies must be supplied for real deployment. |

## Sample data provenance

The seed uses the provided sample-data PDF. It does not assert independent verification of any public business information. The supplied fictional packages, rates, retreats, demonstration members, and adapted dates are marked as sample data in the application and README. No real outgoing email is sent.
