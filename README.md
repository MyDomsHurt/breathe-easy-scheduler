# Breathe-Easy Scheduler

Internal scheduling & operations viewer for **Breathe-Easy** (Hong Kong AC cleaning).

Built from the August 2026 Excel schedule. Clean jobs are distinguished from **returns** by an empty `ACs` field.

## Features (MVP)

- 389 jobs from August 2026, structured and searchable
- Filter by week, team (Josh / Matthew / Tiago / Nick / Alun / Iggi), clean vs return, date
- Live search across client name, mobile, address, notes, invoice
- View by date or by team
- Revenue totals update with filters
- Job detail modal with full notes, payment, invoice info
- Mobile-friendly layout

## Quick start

```bash
# From this folder
npx serve .
# or
python3 -m http.server 8080
```

Then open http://localhost:3000 (or 8080).

> Because the app fetches `data/jobs.json`, it must be served over HTTP (not opened as a file://).

## Data

- `data/jobs.json` — cleaned & normalized job records
- Source: `August 2026.xlsx` (Week 1–4 sheets)
- Rule: **empty ACs column → `is_return: true`**

## Next iterations (ready for)

- Edit / reschedule jobs
- Client history & recurring leak detection
- Day capacity view (jobs + total AC units per tech)
- Payment status tracking
- Export filtered views
- Connect to live HubSpot / Google Sheets

## Tech

Vanilla HTML + Tailwind CSS (CDN) + plain JS. No build step.

---

Breathe-Easy · August 2026
