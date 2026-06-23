# Thailand Luxury Escape 2026 ✨

A production-ready, mobile-first **personal travel companion** for a luxury Pattaya + Bangkok escape — built to feel like a premium travel magazine.

> **Travelers:** Nagarjun & Shalini · **Dates:** 26 – 30 June 2026 · **Budget:** ₹50,000 (~20,000 THB)

---

## ✦ Highlights

- **Luxury dark theme** with gold accents, glassmorphism and smooth Framer Motion animations
- **Live dashboard** — current/next activity, time remaining, trip progress
- **Full itinerary** — 5-day interactive timeline with completion toggles (green / gold / gray states)
- **Ticket Center** — flights, bus & attraction tickets with QR codes and local image storage
- **Budget tracker** — add/edit/delete expenses, search, filters, Recharts visualisations
- **Shopping planner**, **offline currency converter**, **hotels**, **flights**, **bus transfers**
- **Travel journal** with photos, **packing checklist** with progress ring, **emergency** contacts
- **Analytics** dashboard and **settings** with export / import / backup / restore
- **PWA** — installable, offline support, manifest, service worker, splash/app icons
- **LocalStorage persistence** via Zustand — your data stays on your device

---

## ✦ Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 15 (App Router)             |
| Language     | TypeScript                          |
| Styling      | Tailwind CSS + ShadCN-style UI      |
| State        | Zustand + `persist` (LocalStorage)  |
| Charts       | Recharts                            |
| Icons        | Lucide React                        |
| Animation    | Framer Motion                       |
| PWA          | Web Manifest + Service Worker       |
| Deployment   | Vercel-ready                        |

---

## ✦ Getting Started

### Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- npm / pnpm / yarn

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page shows the
hero + countdown; **Open Trip Dashboard** enters the app at `/dashboard`.

### Production build

```bash
npm run build
npm run start
```

> The service worker only registers in production (`npm run build && npm run start`)
> to keep development hot-reload clean.

---

## ✦ Project Structure

```
src/
├─ app/
│  ├─ layout.tsx            # Root layout, fonts, metadata, PWA registration
│  ├─ page.tsx              # Landing / hero + countdown
│  ├─ globals.css           # Theme tokens, glassmorphism, gold utilities
│  └─ (app)/                # Authenticated app shell group
│     ├─ layout.tsx         # Sidebar + mobile bottom nav
│     ├─ dashboard/         # Live status, progress, upcoming widget
│     ├─ itinerary/         # 5-day interactive timeline
│     ├─ tickets/           # Ticket center + QR drawer
│     ├─ budget/            # Expense CRUD + charts
│     ├─ shopping/          # Shopping planner
│     ├─ currency/          # Offline THB ↔ INR converter
│     ├─ hotels/            # Hotel cards
│     ├─ flights/           # Flight timeline + boarding pass
│     ├─ bus/               # Bus transfers
│     ├─ journal/           # Travel journal with photos
│     ├─ packing/           # Packing checklist + progress ring
│     ├─ emergency/         # Emergency contacts
│     ├─ analytics/         # Trip analytics
│     └─ settings/          # Theme, export/import, reset
├─ components/
│  ├─ ui/                   # Button, Card, Badge, Progress, Input, Drawer, Tabs
│  ├─ app-shell.tsx         # Responsive navigation shell
│  ├─ qr-code.tsx           # SVG QR renderer
│  ├─ progress-ring.tsx     # Circular progress
│  ├─ countdown.tsx         # useCountdown / useNow hooks
│  ├─ transport.tsx         # Transport icons
│  └─ common.tsx            # PageHeader, StatCard, motion helpers
└─ lib/
   ├─ types.ts              # All TypeScript domain types
   ├─ seed.ts               # Itinerary, hotels, flights, tickets, etc.
   ├─ store.ts              # Zustand store + persistence
   └─ utils.ts              # Formatters, date/time, QR matrix, helpers
public/
├─ manifest.webmanifest     # PWA manifest
├─ sw.js                    # Service worker (offline support)
└─ icons/                   # App icons (SVG + generated PNGs)
```

---

## ✦ Data Model

Fully typed in [`src/lib/types.ts`](src/lib/types.ts):

`Trip` · `Activity` · `Expense` · `Hotel` · `Flight` · `BusTicket` ·
`ShoppingItem` · `JournalEntry` · `PackingItem` · `Ticket` · `EmergencyContact` ·
`Settings`

### Persistence

Persisted to LocalStorage (`thailand-luxury-escape-v1`): expenses, packing,
shopping, journal, completed activities, tickets and settings. Use
**Settings → Export / Import** to back up or restore as JSON.

### Seed data

All mock content lives in [`src/lib/seed.ts`](src/lib/seed.ts) — edit the trip,
travelers, itinerary, hotels, flights, buses, tickets and contacts there.

---

## ✦ Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com/new), **Import Project** and select the repo.
3. Framework preset auto-detects **Next.js** — no env vars required.
4. Click **Deploy**. Done.

Or via CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

### Environment

No environment variables are needed — the app is fully client-side with
LocalStorage persistence. To regenerate PNG icons from the SVG:

```bash
npm install --no-save sharp
node -e "const s=require('sharp'),f=require('fs'),v=f.readFileSync('public/icons/icon.svg');[[192,'public/icons/icon-192.png'],[512,'public/icons/icon-512.png'],[180,'public/icons/apple-icon.png']].forEach(([n,o])=>s(v,{density:300}).resize(n,n).png().toFile(o))"
```

---

## ✦ Notes

- QR codes are stylised, deterministic visuals for this personal companion
  (not spec-compliant encoders) and render consistently per booking.
- Ticket & journal images are stored locally as data URLs on your device.
- The experience is tuned for a luxe **dark** aesthetic; a light theme toggle is
  available in Settings.

Crafted for **Nagarjun & Shalini** — have an unforgettable escape. 🇹🇭
