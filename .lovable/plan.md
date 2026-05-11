## 1. Persistent, always-visible plant

Today the plant is rendered once at the bottom of the playlist column, so it disappears once the user scrolls into the tracklist.

Fix in `src/routes/set.$id.tsx`:

- Remove the static plant under the tracklist.
- Render the plant in a **fixed sidebar** on the right edge of the screen (e.g. `fixed right-4 top-1/2 -translate-y-1/2 z-30`, hidden on `<sm` to stay out of the way on mobile, ~110px wide).
- It stays visible while scrolling and reacts to the currently playing track's energy.
- On mobile, show a compact version inline above the bottom player bar instead.

## 2. Plant fixes (leaves anchored, bordeaux pot)

In `src/components/ZanzibarPlant.tsx`:

- Several "free" leaves come from the **crown leaf at tip** rendered with a rotation that doesn't match the stem tangent + from leaf pairs being placed on alternate sides only (so the unmatched side looks floating). Rewrite leaf placement so:
  - Leaves are placed in **pairs at the same** `u` **parameter** along the stem (one each side), guaranteeing both originate from the exact same point on the path. If no stem in between the pair, no leaves.
  - Drop the separate "crown leaf" group; instead place a final pair right at `u≈0.98` so it joins the tip naturally.
  - Use the path tangent for rotation (already computed) and offset the leaf base by 0 — base point stays glued to the curve.
- Pot color: replace the brown `--zz-pot` gradient with a **bordeaux** gradient (e.g. `oklch(0.42 0.13 18)` → `oklch(0.22 0.09 15)`), keep rim shading darker.

## 3. Audio robustness — skip missing songs instead of stopping

Today, in `startTrack` (set.$id.tsx ~L219), a missing track shows a toast and sets `desiredPlaying=false`, halting the set.

Fix:

- When `resolve(t)` returns null, toast `Skipping "<title>" — not on Spotify` and **call `startTrack(index + 1)**` (or stop only if it was the last track).
- Same handling for `playTrack` exceptions: if the API fails for an individual track, advance to the next instead of aborting the set.
- Add a small retry: try `searchTrack(title, artist)` first; if null, retry with **title-only** (drop bracketed mix/remix qualifiers like `[Todd Terry's Feel Good Mix]`, `(Live at …)`) before giving up. This solves the screenshotted Hedonism failure where the long parenthetical mix name killed the match.
- Update `searchTrack` in `src/lib/spotify.ts` to internally normalize the query: strip parenthetical/bracketed suffixes and "feat./featuring" segments when the strict match fails.

## 4. New logo — minimal, wordless Zanzibar Gem mark

Rewrite `src/components/HoloLogo.tsx`:

- Pure SVG mark, no text, no zebra. A single stylized **Zanzibar gem leaf** silhouette (the iconic glossy teardrop) standing inside a soft circular gradient that matches the existing sunset palette (fuchsia → lime accents already used across the app).
- Keep it simple: one bold leaf with a subtle highlight stripe and a thin central vein, sitting on a darker disc with a glow ring. Scales cleanly from 24px to 96px.

Wordmark: in `src/components/SiteHeader.tsx`, change the brand text so only the first letter is capitalized: **"Zanzibar"** (currently rendered as ZANZIBAR / ZanzibarDeck / similar — will verify and normalize).

## 5. Smarter transition strategy (no jarring jumps)

The Valerie → Mr. Brightside problem is an energy/texture cliff. The current prompt allows large energy deltas if styles are listed.

Update `supabase/functions/generate-playlist/index.ts`:

- Add a hard rule to the prompt: **consecutive tracks may differ by at most 2 energy points** unless the user's timeline explicitly schedules a jump at that moment. Larger jumps must be bridged by a transitional track (a song that sits between in energy, instrumentation, or tempo).
- Add an explicit "DJ mixing" rubric: every pick must justify continuity with the previous track on at least one of: tempo (±15 BPM), key/mode, instrumentation, or mood. Include this in `transitionNote`.
- Bias toward smoother arcs: prefer a **gradual ramp** over staircase jumps; reserve "Inspired Hard Cuts" for moments where energy is already aligned.
- Surface a `energyDelta` validation in the tool schema response so the model self-checks before returning.
- Tighten the system prompt with a worked counter-example: "Bad: Amy Winehouse 'Valerie' (chill soul, energy 4) → The Killers 'Mr. Brightside' (full rock, energy 9). Good: bridge with mid-energy indie-soul like Michael Kiwanuka or Black Pumas first."

## Files touched

- `src/routes/set.$id.tsx` — fixed-position plant; auto-skip on resolve/play failure
- `src/components/ZanzibarPlant.tsx` — paired leaves anchored to stem, bordeaux pot
- `src/lib/spotify.ts` — query normalization fallback in `searchTrack`
- `src/components/HoloLogo.tsx` — new minimal Zanzibar gem mark
- `src/components/SiteHeader.tsx` — wordmark casing → "Zanzibar"
- `supabase/functions/generate-playlist/index.ts` — transition rubric + energy-delta rule