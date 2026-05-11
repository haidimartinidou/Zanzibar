// Spotify Web API + PKCE OAuth helpers (client-side only).

const TOKEN_KEY = "vibedeck:spotify_token";
const REFRESH_KEY = "vibedeck:spotify_refresh";
const EXPIRES_KEY = "vibedeck:spotify_expires";
const VERIFIER_KEY = "vibedeck:spotify_verifier";
const RETURN_KEY = "vibedeck:spotify_return";
/** Query params: hop from localhost → 127.0.0.1 before PKCE (same storage origin as Spotify callback). */
const PKCE_RESUME_QP = "spotify_pkce";
const PKCE_RETURN_QP = "spotify_return";

export const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
].join(" ");

/**
 * Spotify no longer allows `localhost` as a redirect host (loopback must be an IP literal).
 * If the user opened the app via `http://localhost:PORT`, normalize so the OAuth
 * `redirect_uri` matches what you register in the Spotify dashboard, e.g.
 * `http://127.0.0.1:PORT/spotify-callback`.
 * @see https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
 */
export const REDIRECT_URI = () => {
  const { protocol, hostname, port } = window.location;
  const host = hostname === "localhost" ? "127.0.0.1" : hostname;
  const origin = port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`;
  return `${origin}/spotify-callback`;
};

function clientId() {
  // Spotify "Client ID" is not a secret; it's safe to expose to the browser.
  const id = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
  if (!id) throw new Error("VITE_SPOTIFY_CLIENT_ID not configured");
  return id;
}

// PKCE helpers
function randStr(len = 64) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ("0" + b.toString(16)).slice(-2)).join("");
}
async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startSpotifyLogin(returnPath?: string) {
  // Callback uses 127.0.0.1 (Spotify disallows "localhost"). sessionStorage is per-origin,
  // so we must not store the PKCE verifier on localhost if the redirect returns to 127.0.0.1.
  if (window.location.hostname === "localhost") {
    const u = new URL(window.location.href);
    u.hostname = "127.0.0.1";
    u.searchParams.set(PKCE_RESUME_QP, "1");
    if (returnPath) u.searchParams.set(PKCE_RETURN_QP, returnPath);
    window.location.replace(u.toString());
    return;
  }

  const id = clientId();
  const verifier = randStr(64);
  const challenge = await sha256(verifier);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  if (returnPath) sessionStorage.setItem(RETURN_KEY, returnPath);
  const params = new URLSearchParams({
    client_id: id,
    response_type: "code",
    redirect_uri: REDIRECT_URI(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

/**
 * After hopping localhost → 127.0.0.1, continue OAuth from the same origin as `/spotify-callback`.
 * Called once from the root layout on load.
 */
export async function resumeSpotifyPkceLoginIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.location.hostname === "localhost") return;
  const u = new URL(window.location.href);
  if (u.searchParams.get(PKCE_RESUME_QP) !== "1") return;
  const returnPath = u.searchParams.get(PKCE_RETURN_QP) ?? u.pathname;
  u.searchParams.delete(PKCE_RESUME_QP);
  u.searchParams.delete(PKCE_RETURN_QP);
  window.history.replaceState({}, "", u.toString());
  await startSpotifyLogin(returnPath);
}

export async function exchangeCode(code: string) {
  const id = clientId();
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI(),
    client_id: id,
    code_verifier: verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const json = await res.json();
  saveTokens(json);
  sessionStorage.removeItem(VERIFIER_KEY);
}

function saveTokens(t: { access_token: string; refresh_token?: string; expires_in: number }) {
  localStorage.setItem(TOKEN_KEY, t.access_token);
  if (t.refresh_token) localStorage.setItem(REFRESH_KEY, t.refresh_token);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + t.expires_in * 1000 - 30_000));
}

async function refresh(): Promise<string | null> {
  const id = clientId();
  const refresh_token = localStorage.getItem(REFRESH_KEY);
  if (!refresh_token) return null;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token, client_id: id }),
  });
  if (!res.ok) { logoutSpotify(); return null; }
  const json = await res.json();
  saveTokens(json);
  return json.access_token;
}

export async function getAccessToken(): Promise<string | null> {
  const tok = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
  if (tok && Date.now() < exp) return tok;
  if (localStorage.getItem(REFRESH_KEY)) return await refresh();
  return null;
}

export function isSpotifyConnected() {
  return typeof window !== "undefined" && !!localStorage.getItem(TOKEN_KEY);
}

export function logoutSpotify() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export function consumeReturnPath() {
  const p = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return p;
}

// Spotify Web API
async function api(path: string, init?: RequestInit): Promise<any> {
  const tok = await getAccessToken();
  if (!tok) throw new Error("Not connected to Spotify");
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${tok}` },
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${await res.text()}`);
  return res.json();
}

export type ResolvedTrack = { uri: string; id: string; durationMs: number };

export type SearchResult = { uri: string; id: string; durationMs: number; title: string; artist: string };

export async function searchTracks(query: string, limit = 8): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const data = await api(`/search?type=track&limit=${limit}&q=${encodeURIComponent(query)}`);
  const items = data?.tracks?.items ?? [];
  return items.map((t: any) => ({
    uri: t.uri,
    id: t.id,
    durationMs: t.duration_ms,
    title: t.name,
    artist: (t.artists ?? []).map((a: any) => a.name).join(", "),
  }));
}

// Strip noisy qualifiers that often kill exact-match search:
//   "(Live at BBC ...)", "[Todd Terry's Feel Good Mix]", "- Remastered 2015",
//   "feat. X", "featuring X".
function normalizeTitle(title: string): string {
  return title
    .replace(/\s*[\(\[][^)\]]*[\)\]]/g, "")
    .replace(/\s*-\s*(remaster(ed)?|live|mix|edit|version|mono|stereo)[^-]*$/i, "")
    .replace(/\s*(feat\.?|featuring)\s+[^()-]+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchTrack(title: string, artist: string): Promise<ResolvedTrack | null> {
  const tryQuery = async (q: string) => {
    const data = await api(`/search?type=track&limit=1&q=${encodeURIComponent(q)}`);
    const t = data?.tracks?.items?.[0];
    return t ? { uri: t.uri, id: t.id, durationMs: t.duration_ms } as ResolvedTrack : null;
  };
  // 1. Strict
  let r = await tryQuery(`track:${title} artist:${artist}`);
  if (r) return r;
  // 2. Loose
  r = await tryQuery(`${title} ${artist}`);
  if (r) return r;
  // 3. Normalized title (strip parentheticals/feat/remaster) + artist
  const cleanTitle = normalizeTitle(title);
  if (cleanTitle && cleanTitle !== title) {
    r = await tryQuery(`track:${cleanTitle} artist:${artist}`);
    if (r) return r;
    r = await tryQuery(`${cleanTitle} ${artist}`);
    if (r) return r;
  }
  // 4. Title-only last resort
  r = await tryQuery(cleanTitle || title);
  return r;
}

/**
 * Heuristic smart-start in ms. Spotify deprecated /audio-analysis for new
 * apps in late 2024 (403 Forbidden), so we approximate the first
 * "interesting" moment from track energy + duration:
 *   - low-energy tracks tend to start engaging quickly → start near 0
 *   - high-energy tracks usually have an 8-32s intro before the drop
 * Capped at 25% of the track length so we never overshoot.
 */
export function heuristicStartMs(energy: number, durationMs: number): number {
  const e = Math.max(1, Math.min(10, energy || 5));
  // Linear-ish ramp: energy 1 → 0s, energy 10 → 32s
  const guessSec = Math.round(((e - 1) / 9) * 32);
  const capMs = Math.floor(durationMs * 0.25);
  return Math.max(0, Math.min(guessSec * 1000, capMs));
}

// In-memory cache of audio analysis per track id.
const analysisCache = new Map<string, any | null>();

export async function getAudioAnalysis(trackId: string): Promise<any | null> {
  if (analysisCache.has(trackId)) return analysisCache.get(trackId)!;
  try {
    const data = await api(`/audio-analysis/${trackId}`);
    analysisCache.set(trackId, data);
    return data;
  } catch {
    analysisCache.set(trackId, null);
    return null;
  }
}

/**
 * Snap a target start time to the nearest musical phrase boundary so playback
 * never lands mid-word. Strategy:
 *  1. Find the section boundary closest to target (within ±10s).
 *  2. Else snap to the nearest bar (downbeat).
 *  3. Else snap to a 4-second grid as a coarse fallback.
 */
export function snapToPhrase(targetMs: number, analysis: any | null): number {
  if (!analysis) return Math.round(targetMs / 4000) * 4000;
  const targetSec = targetMs / 1000;

  const sections: any[] = analysis.sections ?? [];
  let best: number | null = null;
  let bestDist = Infinity;
  for (const s of sections) {
    const d = Math.abs(s.start - targetSec);
    if (d < bestDist) { bestDist = d; best = s.start; }
  }
  if (best !== null && bestDist <= 10) return Math.max(0, Math.round(best * 1000));

  const bars: any[] = analysis.bars ?? [];
  let bestBar: number | null = null;
  let barDist = Infinity;
  for (const b of bars) {
    const d = Math.abs(b.start - targetSec);
    if (d < barDist) { barDist = d; bestBar = b.start; }
  }
  if (bestBar !== null) return Math.max(0, Math.round(bestBar * 1000));

  return Math.round(targetMs / 4000) * 4000;
}

export type SpotifyConnectDevice = {
  id: string;
  is_active: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
};

function playQuery(deviceId: string) {
  return `device_id=${encodeURIComponent(deviceId)}`;
}

export async function getAvailableDevices(): Promise<SpotifyConnectDevice[]> {
  const data = await api("/me/player/devices");
  return (data?.devices ?? []) as SpotifyConnectDevice[];
}

/**
 * Web Playback SDK can fire "ready" before GET /me/player/devices lists the device.
 * Without this, /me/player/play returns 404 "Device not found".
 */
export async function waitForConnectDevice(
  deviceId: string,
  { attempts = 16, delayMs = 200 } = {},
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const devices = await getAvailableDevices();
      if (devices.some((d) => d.id === deviceId && !d.is_restricted)) return true;
    } catch {
      /* bearer may still be propagating */
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

export async function transferPlayback(deviceId: string) {
  await api(`/me/player`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
}

/** Route playback to our Web Player, then start the track (two steps Spotify expects for browser SDK). */
export async function transferAndPlay(deviceId: string, uri: string, positionMs = 0) {
  await transferPlayback(deviceId);
  // Connect API can return before the device is ready to accept play; brief pause avoids 404s.
  await new Promise((r) => setTimeout(r, 150));
  await playTrack(deviceId, uri, positionMs);
}

export async function playTrack(deviceId: string, uri: string, positionMs = 0) {
  await api(`/me/player/play?${playQuery(deviceId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris: [uri], position_ms: positionMs }),
  });
}
export async function pausePlayback(deviceId: string) {
  await api(`/me/player/pause?${playQuery(deviceId)}`, { method: "PUT" });
}
export async function resumePlayback(deviceId: string) {
  await api(`/me/player/play?${playQuery(deviceId)}`, { method: "PUT" });
}
