# Healthcheck Dashboard

Monitor HTTP endpoints with on-demand checks, scheduled polling, and alerting on failures. Built with Next.js (App Router), NextAuth, Tailwind, and MongoDB.

## Features
- Add/edit/delete endpoints with per-endpoint polling interval (seconds).
- Manual checks or automatic polling in the dashboard.
- Stores only the last 100 checks per endpoint.
- Email alerts on failed checks (configurable SMTP + alert recipient).
- Authenticated dashboard (NextAuth credentials).

## Prerequisites
- Node.js 18+
- MongoDB instance

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env and set values:
   ```bash
   cp .env.example .env.local
   ```
   Required keys:
   - `MONGODB_URI` – MongoDB connection string
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL` – NextAuth config
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY` (`SSL` or `TLS`), `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
   - `ALERT_EMAIL` – address to receive failure alerts
3. Run dev server:
   ```bash
   npm run dev
   ```

## Usage
- Open `http://localhost:3000`, sign in, add endpoints, and set intervals (seconds).
- Click “Check Now” for a manual run. Auto polling runs while the dashboard is open.
- Failed checks trigger an email to `ALERT_EMAIL` using the SMTP settings.

## Notes
- Only the newest 100 checks per endpoint are retained; older records are pruned automatically.
- For Zoho SMTP, use either `PORT=465` + `SECURITY=SSL` or `PORT=587` + `SECURITY=TLS`, and an app password if 2FA is on.
# server-health-check-alert-system
