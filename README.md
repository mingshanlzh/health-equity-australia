# Health Equity Australasia — Health Equity SIG

Community website for the Health Equity Special Interest Group, serving
researchers, practitioners and students across Australia, Aotearoa New Zealand
and the world.

**Live site:** https://mingshanlzh.github.io/health-equity-australasia/

## Features

- **Seminar series** — upcoming and past seminars with recordings and slides (admin-managed)
- **Member blog** — members write Markdown posts with live preview, tags and comments
- **Noticeboard** — community announcements (jobs, PhD opportunities, CFPs)
- **Member research** — a shared library of member publications and projects
- **Member directory** — public profiles with photos, bios, interests and links
- **Auth & roles** — email/password signup, admin approval workflow, admin panel
- **Design** — shadcn/ui + Tailwind v4, light/dark mode, clean academic style

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, `output: "export"` — fully static) |
| UI | Tailwind CSS v4, shadcn/ui components, lucide-react icons |
| Data & auth | Supabase (PostgreSQL + RLS + Auth + Storage), client-side only |
| Hosting | GitHub Pages via Actions (`.github/workflows/deploy.yml`) |

## Development

```bash
npm install
npm run dev
```

## Database

The complete schema lives in `supabase/schema.sql`. It is idempotent — run the
whole file in the Supabase SQL editor to (re)create tables, RLS policies, the
signup trigger, and the avatars storage bucket.

Admin accounts: emails listed in `handle_new_user()` are auto-promoted to
admin on signup; other members are approved from the `/admin` panel.

## Deployment

Every push to `main` builds and deploys to GitHub Pages. The site is served
under the `/health-equity-australasia` sub-path (see `basePath` in
`next.config.ts`). If a custom domain is added later, set the
`NEXT_PUBLIC_BASE_PATH=""` env var in the workflow.
