# Zanzibar

A Cloudflare/Vite + Supabase app for Spotify-powered DJ playlists.

## Local development

1. Copy `.env.example` to `.env`.
2. Fill in the required values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LOVABLE_API_KEY`
   - `VITE_SPOTIFY_CLIENT_ID` or `SPOTIFY_CLIENT_ID`
3. Install dependencies:
   - `npm install`
4. Start the app:
   - `npm run dev`

## Build

- `npm run build`
- `npm run preview`

## Deployment notes

### Required environment variables

- `VITE_SUPABASE_URL` — Supabase project URL for client-side auth and data access.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase public anon key for client-side access.
- `SUPABASE_URL` — Same Supabase URL for server-side functions.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key for server-side admin operations and function calls.
- `LOVABLE_API_KEY` — API key for the Lovable AI gateway used by `supabase/functions/generate-playlist`.
- `VITE_SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_ID` — Spotify app client ID for the PKCE login flow.

### Spotify setup

- Register a Spotify developer app.
- Add the production redirect URI: `https://<your-domain>/spotify-callback`.
- Use the Spotify app client ID in `VITE_SPOTIFY_CLIENT_ID` for development or `SPOTIFY_CLIENT_ID` for production.

### Supabase setup

- Deploy the function in `supabase/functions/generate-playlist`.
- Run your Supabase migrations for the production database.
- Ensure `LOVABLE_API_KEY` is configured in the function environment.

### Recommended deployment path: Cloudflare + Supabase

#### 1. Prerequisites

- Cloudflare account with a Workers project
- Supabase project with the database set up
- Spotify developer app with redirect URI registered
- Lovable API access for playlist generation

#### 2. Deploy the Supabase Edge Function

From the project root:

```bash
npx supabase functions deploy generate-playlist --project-id <your-project-id>
```

Then set the LOVABLE_API_KEY secret in the Supabase dashboard:
- Go to `Project Settings` → `Functions` → `generate-playlist`
- Add environment variable `LOVABLE_API_KEY` with your API key

#### 3. Deploy to Cloudflare Workers

First, install Wrangler:

```bash
npm install -g @cloudflare/wrangler
# or locally:
npm install --save-dev @cloudflare/wrangler
```

Authenticate:

```bash
npx wrangler login
```

Set production secrets in Cloudflare:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put LOVABLE_API_KEY
npx wrangler secret put SPOTIFY_CLIENT_ID
```

(Paste your actual values when prompted for each.)

Build and publish:

```bash
npm run build
npx wrangler publish
```

#### 4. Verify deployment

- Visit your worker URL.
- Check that `/spotify-callback` route exists.
- Test Spotify login (redirect to Spotify should work if client ID is correct).
- Test playlist generation (should call the Supabase function).

## What was fixed

- Added `src/server/spotify.functions.server.ts` to provide the required Spotify client ID helper.
- Added `.env.example` with the app's required environment variables.
- Added dev-safe stubs for Supabase and Spotify helpers so the app boots without secrets.
- Updated `spotify-callback.tsx` to show a friendly message when Spotify is not configured.
- Enhanced README with complete Cloudflare + Supabase deployment commands.
