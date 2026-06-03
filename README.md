# Zanzibar

A Cloudflare Workers + Supabase app for Spotify-powered AI DJ setlists.

## Stack

- **Frontend/SSR**: TanStack Start (React, Vite, TypeScript)
- **Deployment**: Cloudflare Workers
- **Database + Auth**: Supabase
- **Playlist AI**: OpenAI (`gpt-4o-mini`) via Supabase Edge Function
- **Music playback**: Spotify Web Playback SDK

---

## Local development

1. Copy `.env.example` to `.env` and fill in all values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5173`.

### Required `.env` values

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API (anon key) |
| `SUPABASE_URL` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role key) |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard → your app |
| `SPOTIFY_CLIENT_ID` | Same as above |

---

## Build

```bash
npm run build      # production build
npm run preview    # serve the production build locally
```

---

## Deployment: Cloudflare Workers + Supabase

### 1. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 2. Set production secrets

Paste each value when prompted:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SPOTIFY_CLIENT_ID
```

### 3. Build and deploy

```bash
npm run build
npx wrangler deploy
```

Wrangler will print your live URL — e.g. `https://zanzibar.<your-subdomain>.workers.dev`.

### 4. Register the Spotify redirect URI

In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), open your app → Edit → add:

```
https://zanzibar.<your-subdomain>.workers.dev/spotify-callback
```

### 5. Deploy the Supabase edge function

```bash
npx supabase functions deploy generate-playlist --project-id <your-supabase-project-id>
```

Then add the `OPENAI_API_KEY` secret in Supabase:

```bash
npx supabase secrets set OPENAI_API_KEY=<your-key> --project-id <your-supabase-project-id>
```

### 6. Verify

- Visit your worker URL.
- Test Spotify login — the `/spotify-callback` route should complete the PKCE flow.
- Create a vibe brief and confirm playlist generation calls OpenAI successfully.
