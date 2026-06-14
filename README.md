# hegli.dev

Personal website and admin dashboard built with Next.js, Supabase, and Tailwind CSS. Currently in active development.

## Tech Stack

- **Frontend** — Next.js 16 (App Router) + TypeScript
- **Styling** — Tailwind CSS
- **Backend / Auth / Database** — Supabase
- **Hosting** — Vercel
- **Domain** — Cloudflare (hegli.dev)

## Features

### Public
- Dark hero landing page
- About me section
- Contact section with GitHub and LinkedIn links

### Admin Dashboard (private, auth required)
- Supabase authentication — login/logout with session management
- Protected `/admin` routes via Next.js middleware
- Live date & time bar (Auckland, NZ timezone)
- **Reminders widget** — add, colour code, and delete reminders (stored in Supabase)
- **GitHub activity widget** — contribution graph and recent repo activity via GitHub GraphQL API
- **Steam deals widget** — live top deals from the Steam storefront API

## In Progress

- Stocks widget (Finnhub API) — personalised watchlist with live prices
- News & patch notes widget — League of Legends and Overwatch patch notes
- Public projects section
- About me page
- UI polish and dark mode

## Planned (v2 / v3)

- Spotify now playing widget
- Custom stock deviation from personal buy price
- Mobile responsiveness polish
- Dark mode toggle
- Modular Widgets
- Theme Changer

## Project Structure

```
app/
├── page.tsx                  # Public landing page
├── login/
│   └── page.tsx              # Login page
├── admin/
│   ├── layout.tsx            # Auth protection for all admin routes
│   ├── page.tsx              # Admin dashboard
│   └── components/
│       ├── Sidebar.tsx       # Admin sidebar navigation
│       ├── DateTimeBar.tsx   # Live date and time display
│       ├── WidgetGrid.tsx    # Dashboard widget grid
│       ├── GitHubWidget.tsx  # GitHub activity and contribution graph
│       └── SteamWidget.tsx   # Steam deals
├── api/
│   ├── github/
│   │   └── route.ts          # GitHub GraphQL API route (auth protected)
│   └── steam/
│       └── route.ts          # Steam storefront API route (auth protected)
└── lib/
    ├── supabase.js           # Supabase browser client
    └── supabase-server.js    # Supabase server client (SSR)
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GITHUB_TOKEN=
GITHUB_USERNAME=
NEXT_PUBLIC_GITHUB_USERNAME=
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public site.

---

## License

MIT License

Copyright (c) 2026 Henry Li

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

> This project is open source. All content and personal data is stored privately in Supabase and is not exposed through the repository.
