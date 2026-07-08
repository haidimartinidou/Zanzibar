// Spotify Web API + PKCE OAuth helpers (client-side only).

const TOKEN_KEY = "vibedeck:spotify_token";
const REFRESH_KEY = "vibedeck:spotify_refresh";
const EXPIRES_KEY = "vibedeck:spotify_expires";
const VERIFIER_KEY = "vibedeck:spotify_verifier";
const RETURN_KEY = "vibedeck:spotify_return";
const SCOPES_KEY = "vibedeck:spotify_scopes";

export const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
].join(" ");

export const REDIRECT_URI = () =>
  `${window.location.origin}/spotify-callback`;

let cachedClientId: string | null = null;
async function getSpotifyClientId(): Promise<{ clientId: string }> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || (typeof process !== "undefined" ? process.env.SPOTIFY_CLIENT_ID : undefined);
  if (!clientId) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID. Set VITE_SPOTIFY_CLIENT_ID for local development or SPOTIFY_CLIENT_ID in production."
    );
  }
  return { clientId };
}

async function clientId() {
  if (cachedClientId) return cachedClientId;
  const { clientId: id } = await getSpotifyClientId();
  cachedClientId = id;
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
  try {
    console.log("startSpotifyLogin: invoked");
    const id = await clientId();
    const verifier = randStr(64);
    const challenge = await sha256(verifier);
    // Use localStorage (shared across tabs) so the verifier survives the
    // new-tab redirect to Spotify; sessionStorage is per-tab and would be
    // empty in the callback tab, causing "Missing PKCE verifier".
    localStorage.setItem(VERIFIER_KEY, verifier);
    if (returnPath) localStorage.setItem(RETURN_KEY, returnPath);
    const params = new URLSearchParams({
      client_id: id,
      response_type: "code",
      redirect_uri: REDIRECT_URI(),
      code_challenge_method: "S256",
      code_challenge: challenge,
      scope: SCOPES,
    });
    const authUrl = `https://accounts.spotify.com/authorize?${params}`;
    console.log("startSpotifyLogin: redirecting to", authUrl);
    // Same-tab redirect is the correct path for the deployed app: the callback
    // returns to the SAME tab, so the audio-capable Web Playback player and the
    // user's click-to-play gesture live in one tab (browser autoplay policy).
    // Only fall back to a new tab inside an embedded preview (Lovable iframe),
    // where a top-level redirect isn't reliable; the localStorage verifier makes
    // that path work too.
    const framed = window.self !== window.top;
    if (framed) {
      try {
        const opened = window.open(authUrl, "_blank", "noopener");
        if (!opened) window.location.assign(authUrl);
      } catch (e) {
        window.location.assign(authUrl);
      }
    } else {
      window.location.assign(authUrl);
    }
  } catch (e) {
    console.error("startSpotifyLogin: error", e);
    throw e;
  }
}

export async function exchangeCode(code: string) {
  const id = await clientId();
  const verifier = localStorage.getItem(VERIFIER_KEY);
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
  localStorage.removeItem(VERIFIER_KEY);
}

function saveTokens(t: { access_token: string; refresh_token?: string; expires_in: number; scope?: string }) {
  localStorage.setItem(TOKEN_KEY, t.access_token);
  if (t.refresh_token) localStorage.setItem(REFRESH_KEY, t.refresh_token);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + t.expires_in * 1000 - 30_000));
  if (t.scope) localStorage.setItem(SCOPES_KEY, t.scope);
}

export function needsSpotifyReconnect(): boolean {
  if (typeof window === "undefined") return false;
  if (!localStorage.getItem(TOKEN_KEY)) return false;
  const granted = localStorage.getItem(SCOPES_KEY) ?? "";
  return SCOPES.split(" ").some((s) => !granted.split(" ").includes(s));
}

async function refresh(): Promise<string | null> {
  const id = await clientId();
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
  localStorage.removeItem(SCOPES_KEY);
}

export function consumeReturnPath() {
  const p = localStorage.getItem(RETURN_KEY);
  localStorage.removeItem(RETURN_KEY);
  return p;
}

export async function resumeSpotifyPkceLoginIfNeeded() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return;
  if (!window.location.pathname.endsWith("/spotify-callback")) return;

  if (error) {
    throw new Error(`Spotify login failed: ${error}`);
  }

  await exchangeCode(code!);
  const back = consumeReturnPath() ?? "/library";
  const safe = back.startsWith("/") && !back.startsWith("//") ? back : "/library";
  window.location.replace(safe);
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
  if (!res.ok) {
    const body = await res.text();
    throw new Error(spotifyErrorMessage(res.status, body));
  }
  return res.json();
}

// Turn raw Spotify API errors into actionable messages. The most common one for
// new users is 403: while the app is in Spotify "Development Mode", only accounts
// added to the app's User Management list are authorized — everyone else is
// rejected even though connecting appears to work.
function spotifyErrorMessage(status: number, body: string): string {
  if (status === 403) {
    if (/premium_required/i.test(body)) {
      return "Spotify Premium is required to play in the browser.";
    }
    return "This Spotify account isn't authorized for VibeDeck yet. While the app is in Spotify Development Mode, each listener must be added in the Spotify dashboard (or the app needs Extended Quota Mode).";
  }
  if (status === 401) return "Spotify session expired — click Connect Spotify again.";
  if (status === 429) return "Spotify is rate-limiting requests. Wait a moment and try again.";
  return `Spotify API ${status}: ${body}`;
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


export async function playTrack(deviceId: string, uri: string, positionMs = 0) {
  await api(`/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris: [uri], position_ms: positionMs }),
  });
}
export async function pausePlayback(deviceId: string) {
  await api(`/me/player/pause?device_id=${deviceId}`, { method: "PUT" });
}
export async function resumePlayback(deviceId: string) {
  await api(`/me/player/play?device_id=${deviceId}`, { method: "PUT" });
}
export async function transferPlayback(deviceId: string) {
  await api(`/me/player`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
}

export async function transferAndPlay(deviceId: string, uri: string, positionMs = 0) {
  await transferPlayback(deviceId);
  await playTrack(deviceId, uri, positionMs);
}

export async function getCurrentUserId(): Promise<string> {
  const data = await api("/me");
  return data.id;
}

export async function createSpotifyPlaylistAndAddTracks(
  name: string,
  trackUris: string[],
): Promise<string> {
  const userId = await getCurrentUserId();
  const playlist = await api(`/users/${userId}/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, public: false, description: "Created by Zanzibar — full tracks, no cut-offs." }),
  });
  const playlistId = playlist.id;
  for (let i = 0; i < trackUris.length; i += 100) {
    await api(`/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris: trackUris.slice(i, i + 100) }),
    });
  }
  return `https://open.spotify.com/playlist/${playlistId}`;
}

export type SpotifyTrackInfo = {
  title: string;
  artist: string;
  uri: string;
  id: string;
  durationMs: number;
};

export async function getSpotifyPlaylistTracks(playlistId: string): Promise<SpotifyTrackInfo[]> {
  const results: SpotifyTrackInfo[] = [];
  let nextPath: string | null = `/playlists/${playlistId}/tracks?limit=50&fields=next,items(track(id,name,uri,duration_ms,artists))`;
  while (nextPath) {
    const data = await api(nextPath);
    const items: any[] = data?.items ?? [];
    for (const item of items) {
      const t = item?.track;
      if (!t || !t.id) continue;
      results.push({
        title: t.name,
        artist: (t.artists ?? []).map((a: any) => a.name).join(", "),
        uri: t.uri,
        id: t.id,
        durationMs: t.duration_ms,
      });
    }
    nextPath = data?.next ? data.next.replace("https://api.spotify.com/v1", "") : null;
  }
  return results;
}

export async function waitForConnectDevice(deviceId: string, options?: { attempts?: number; delayMs?: number }) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;
  for (let i = 0; i < attempts; i++) {
    try {
      // /me/player only returns the *active* device (and 204 when idle); a
      // freshly-ready Web Playback SDK device shows up in the devices list.
      const data = await api(`/me/player/devices`);
      if (data && Array.isArray(data.devices) && data.devices.some((d: any) => d.id === deviceId)) {
        return true;
      }
    } catch (e) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
