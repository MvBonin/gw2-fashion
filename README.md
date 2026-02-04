# GW2 Fashion

Share and discover fashion templates for Guild Wars 2.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase URL and key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

- Set **NEXT_PUBLIC_SITE_URL** to your public URL (e.g. `https://gw2-fashion.com`) so login redirects and metadata use the correct domain.
- In Supabase: **Authentication → URL Configuration** – set **Site URL** and add your callback to **Redirect URLs** (e.g. `https://gw2-fashion.com/auth/callback`).

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run start` – run production build
