import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Play, Pause, SkipForward, SkipBack, Trash2, ArrowUp, ArrowDown,
  Save, ExternalLink, Music2, Volume2, Plus, Search, X, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import type { Track, Playlist, TransitionMode } from "@/lib/types";
import {
  isSpotifyConnected, startSpotifyLogin, searchTrack, searchTracks,
  transferPlayback, transferAndPlay, pausePlayback, resumePlayback, logoutSpotify, heuristicStartMs,
  getAudioAnalysis, snapToPhrase,
  type ResolvedTrack, type SearchResult,
} from "@/lib/spotify";
import { useSpotifyPlayer, type SpotifyState } from "@/hooks/useSpotifyPlayer";
import { ZanzibarPlant } from "@/components/ZanzibarPlant";
import { OrderRecap } from "@/components/OrderRecap";

export const Route = createFileRoute("/set/$id")({ component: SetPage });

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmtMs = (ms: number) => fmt(ms / 1000);

const TRANSITION_FADE_MS: Record<TransitionMode, number> = { hard: 0, smooth: 2500, long: 5000 };
// How much of the fade is overlap (next track starts BEFORE current ends).
// Real DJs ride the blend — we mirror that by starting the next intro mid-fade.
const TRANSITION_OVERLAP_RATIO: Record<TransitionMode, number> = { hard: 0, smooth: 0.55, long: 0.7 };
const BASE_VOLUME = 0.8;

// Pick a fade length per track-pair based on energy delta. Big jumps = shorter,
// punchier cuts; similar energy = longer, washy blends. Mirrors a DJ reading the floor.
function pairFadeMs(baseFadeMs: number, fromEnergy: number, toEnergy: number) {
  if (baseFadeMs === 0) return 0;
  const delta = Math.abs((toEnergy ?? 5) - (fromEnergy ?? 5));
  const scale = Math.max(0.45, 1.15 - delta * 0.08);
  return Math.round(baseFadeMs * scale);
}

function SetPage() {
  const { id } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pl, setPl] = useState<Playlist | null>(null);
  const [current, setCurrent] = useState(0);
  const [desiredPlaying, setDesiredPlaying] = useState(false);
  const [spotifyPaused, setSpotifyPaused] = useState(true);
  const [elapsed, setElapsed] = useState(0); // seconds within the cut
  const [dirty, setDirty] = useState(false);
  const [spotifyOn, setSpotifyOn] = useState(
    () => typeof window !== "undefined" && isSpotifyConnected(),
  );
  const [insertAt, setInsertAt] = useState<number | null>(null); // index AFTER which to insert
  const [recapOpen, setRecapOpen] = useState(false);

  const resolveCache = useRef<Map<string, ResolvedTrack | null>>(new Map());
  const fadeOutTimer = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);
  const playReqId = useRef(0);

  // Spotify SDK only updates display; never flips the user's intent.
  const handleState = useCallback((s: SpotifyState) => {
    setSpotifyPaused(s.paused);
  }, []);

  const {
    deviceId, ready: spReady, error: spError, activate: activateSpotify,
    setVolume, rampVolume, cancelRamp, player, reconnect, getDeviceId,
  } = useSpotifyPlayer(handleState, spotifyOn);
  const isFramed = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    setSpotifyOn(isSpotifyConnected());
  }, [pathname]);
  useEffect(() => { if (spError) toast.error(spError); }, [spError]);

  useEffect(() => {
    (async () => {
      if (id === "draft") {
        const raw = sessionStorage.getItem("vibedeck:draft");
        if (raw) setPl(JSON.parse(raw));
        return;
      }
      const { data, error } = await supabase.from("playlists").select("*").eq("id", id).single();
      if (error) return toast.error(error.message);
      setPl(data as any);
    })();
  }, [id]);

  const transitionMode: TransitionMode = (pl?.transition as TransitionMode) ?? "smooth";
  const fadeMs = TRANSITION_FADE_MS[transitionMode];

  const clearTimers = useCallback(() => {
    if (fadeOutTimer.current) { clearTimeout(fadeOutTimer.current); fadeOutTimer.current = null; }
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null; }
  }, []);

  const resolve = useCallback(async (t: Track): Promise<ResolvedTrack | null> => {
    const key = `${t.title}|${t.artist}`;
    if (resolveCache.current.has(key)) return resolveCache.current.get(key)!;
    try {
      const r = await searchTrack(t.title, t.artist);
      resolveCache.current.set(key, r);
      return r;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, []);

  const computeStartMs = useCallback(async (t: Track, info: ResolvedTrack): Promise<number> => {
    const target = t.autoStart === false && typeof t.startMs === "number"
      ? t.startMs
      : heuristicStartMs(t.energy, info.durationMs);
    // Snap to nearest phrase boundary so we don't land mid-word.
    const analysis = await getAudioAnalysis(info.id);
    return snapToPhrase(target, analysis);
  }, []);

  // Effective cut length: prefer explicit endMs - startMs when both known.
  const computeCutSec = useCallback((t: Track, startMs: number): number => {
    if (typeof t.endMs === "number" && t.endMs > startMs) {
      return Math.max(5, (t.endMs - startMs) / 1000);
    }
    return t.playSeconds;
  }, []);

  // Preload (resolve) the next track's Spotify info while current plays,
  // so the actual switch has zero network latency.
  const preloadNext = useCallback((index: number) => {
    const t = pl?.tracks[index];
    if (!t) return;
    const key = `${t.title}|${t.artist}`;
    if (resolveCache.current.has(key)) return;
    resolve(t).catch(() => {});
  }, [pl, resolve]);

  // Schedule the blend: at `fadeStart` we begin the fade-out; if we're crossfading
  // we ALSO start the next track at that instant so it fades in over the same window
  // (single-stream pseudo-crossfade). Hard cuts wait for the full cut length.
  const scheduleEndOfCut = useCallback((reqId: number, cutSec: number, playingIndex: number) => {
    if (fadeOutTimer.current) clearTimeout(fadeOutTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const cutMs = cutSec * 1000;
    const total = pl?.tracks.length ?? 0;
    const hasNext = playingIndex + 1 < total;
    const fromE = pl?.tracks[playingIndex]?.energy ?? 5;
    const toE = pl?.tracks[playingIndex + 1]?.energy ?? fromE;
    // If the AI marked this transition as a "hard" cut, override the global mode.
    const pairKind = pl?.tracks[playingIndex]?.transitionToNext;
    const effectiveMode: TransitionMode = pairKind === "hard" ? "hard" : transitionMode;
    const effectiveBaseFade = TRANSITION_FADE_MS[effectiveMode];
    const thisFadeMs = hasNext ? pairFadeMs(effectiveBaseFade, fromE, toE) : effectiveBaseFade;
    const overlapMs = hasNext ? Math.round(thisFadeMs * TRANSITION_OVERLAP_RATIO[effectiveMode]) : 0;
    const fadeStart = Math.max(0, cutMs - thisFadeMs);
    // Next track is started BEFORE the current cut ends → real overlap.
    const nextStartAt = Math.max(0, cutMs - overlapMs);

    // Preload upcoming track ~6s before we need it.
    const preloadAt = Math.max(0, nextStartAt - 6000);
    if (hasNext) {
      window.setTimeout(() => {
        if (reqId !== playReqId.current) return;
        preloadNext(playingIndex + 1);
      }, preloadAt);
    }

    if (thisFadeMs > 0 && hasNext) {
      // 1. Begin fade-out (eased tail, like a DJ riding the low-pass).
      fadeOutTimer.current = window.setTimeout(() => {
        if (reqId !== playReqId.current) return;
        rampVolume(BASE_VOLUME, 0, thisFadeMs, "easeOut");
      }, fadeStart);
      // 2. Drop the next track mid-fade → intros blend with the tail.
      advanceTimer.current = window.setTimeout(() => {
        if (reqId !== playReqId.current) return;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        startTrack(playingIndex + 1);
      }, nextStartAt);
      return;
    }

    // Hard cut (or end of set): wait full cut length, no late fade-out.
    advanceTimer.current = window.setTimeout(() => {
      if (reqId !== playReqId.current) return;
      const nextIndex = playingIndex + 1;
      if (nextIndex >= total) {
        playReqId.current++;
        clearTimers();
        setDesiredPlaying(false);
        if (deviceId) { pausePlayback(deviceId).catch(() => {}); }
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      startTrack(nextIndex);
    }, cutMs);
  }, [fadeMs, transitionMode, rampVolume, pl, deviceId, clearTimers, preloadNext]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attempt a playback action, recovering from the common Spotify failures:
  //  - "Device not found" (404) / device errors: the SDK device dropped (idle,
  //    tab backgrounded, or a backend hiccup). Retrying the same dead id never
  //    works, so we reconnect ONCE to get a fresh device_id, then retry. The
  //    `fn` reads getDeviceId() each attempt so it picks up the new id.
  //  - transient 502 / restriction: just wait and retry.
  const playWithRetry = useCallback(async (fn: () => Promise<void>, reqId: number) => {
    let lastErr: any;
    let reconnected = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (reqId !== playReqId.current) return;
      try {
        await fn();
        return;
      } catch (e: any) {
        lastErr = e;
        const msg = String(e?.message ?? "").toLowerCase();
        const deviceLost = msg.includes("device") || msg.includes("404");
        const transient = deviceLost || msg.includes("502") || msg.includes("restriction");
        if (!transient) throw e;
        if (deviceLost && !reconnected) {
          reconnected = true;
          await reconnect(); // re-register the device, wait for fresh 'ready'
          if (reqId !== playReqId.current) return;
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
    throw lastErr;
  }, [reconnect]);

  // Single command to start a track at index. Cancels any in-flight start.
  const startTrack = useCallback(async (index: number) => {
    if (!pl) return;
    const t = pl.tracks[index];
    if (!t) return;
    if (!spotifyOn) { toast.error("Connect Spotify first"); return; }
    if (!spReady || !deviceId) { toast.error("Spotify player still loading…"); return; }

    const reqId = ++playReqId.current;
    clearTimers();
    setCurrent(index);
    setElapsed(0);
    setDesiredPlaying(true);

    try {
      const info = await resolve(t);
      if (reqId !== playReqId.current) return;
      if (!info) {
        toast.error(`Skipping "${t.title}" — not found on Spotify`);
        const nextIndex = index + 1;
        if (nextIndex < pl.tracks.length) {
          // Try the next track in the set.
          startTrack(nextIndex);
        } else {
          setDesiredPlaying(false);
        }
        return;
      }
      const startMs = await computeStartMs(t, info);
      if (reqId !== playReqId.current) return;
      const cutSec = computeCutSec(t, startMs);

      await activateSpotify();
      if (reqId !== playReqId.current) return;

      cancelRamp();
      // Play directly to the freshest device_id; playWithRetry reconnects and
      // refreshes the id if the device dropped ("Device not found").
      await playWithRetry(
        () => transferAndPlay(getDeviceId() ?? deviceId, info.uri, startMs),
        reqId,
      );
      if (reqId !== playReqId.current) return;
      await setVolume(BASE_VOLUME);
      if (reqId !== playReqId.current) return;

      const startTs = Date.now();
      tickTimer.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTs) / 1000));
      }, 250);

      scheduleEndOfCut(reqId, cutSec, index);
    } catch (e: any) {
      if (reqId === playReqId.current) {
        toast.error(`Skipping "${t.title}": ${e.message ?? "playback failed"}`);
        const nextIndex = index + 1;
        if (nextIndex < pl.tracks.length) {
          startTrack(nextIndex);
        } else {
          setDesiredPlaying(false);
        }
      }
    }
  }, [pl, spotifyOn, spReady, deviceId, resolve, computeStartMs, computeCutSec, fadeMs, setVolume, rampVolume, cancelRamp, scheduleEndOfCut, clearTimers, playWithRetry, getDeviceId]);

  const pause = useCallback(async () => {
    playReqId.current++; // cancel scheduled fades/advances
    clearTimers();
    setDesiredPlaying(false);
    if (deviceId) { try { await pausePlayback(deviceId); } catch { /* ignore */ } }
  }, [deviceId, clearTimers]);

  const resume = useCallback(async () => {
    if (!pl) return;
    if (!deviceId) return;
    // If we never started, start the current track fresh.
    if (spotifyPaused && elapsed === 0) { startTrack(current); return; }
    setDesiredPlaying(true);
    try {
      await activateSpotify();
      await playWithRetry(async () => {
        const dev = getDeviceId() ?? deviceId;
        await transferPlayback(dev);
        await resumePlayback(dev);
      }, playReqId.current);
    } catch (e: any) { toast.error(e.message); }
    // Reschedule end-of-cut from current elapsed.
    const reqId = ++playReqId.current;
    const t = pl.tracks[current];
    if (!t) return;
    const startTs = Date.now() - elapsed * 1000;
    if (tickTimer.current) clearInterval(tickTimer.current);
    tickTimer.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTs) / 1000));
    }, 250);
    const cutSec = computeCutSec(t, t.startMs ?? 0);
    const remaining = Math.max(0, cutSec - elapsed);
    scheduleEndOfCut(reqId, elapsed + remaining, current);
  }, [pl, deviceId, spotifyPaused, elapsed, current, startTrack, scheduleEndOfCut, playWithRetry, getDeviceId]);

  const next = useCallback(() => {
    if (!pl) return;
    const i = Math.min(pl.tracks.length - 1, current + 1);
    if (i === current) { pause(); return; }
    if (desiredPlaying) startTrack(i);
    else { setCurrent(i); setElapsed(0); }
  }, [pl, current, desiredPlaying, startTrack, pause]);

  const prev = useCallback(() => {
    if (!pl) return;
    const i = Math.max(0, current - 1);
    if (desiredPlaying) startTrack(i);
    else { setCurrent(i); setElapsed(0); }
  }, [pl, current, desiredPlaying, startTrack]);

  // Cleanup on unmount.
  useEffect(() => () => { clearTimers(); }, [clearTimers]);

  if (!pl) return <div className="min-h-screen"><SiteHeader /><p className="container px-4 py-12">Loading...</p></div>;

  const updateTracks = (tracks: Track[]) => { setPl({ ...pl, tracks }); setDirty(true); };
  const reorder = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pl.tracks.length) return;
    const arr = [...pl.tracks];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    updateTracks(arr);
    if (current === i) setCurrent(j);
    else if (current === j) setCurrent(i);
  };
  const remove = (i: number) => {
    const arr = pl.tracks.filter((_, k) => k !== i);
    updateTracks(arr);
    if (current >= arr.length) setCurrent(Math.max(0, arr.length - 1));
  };
  const insertAfter = (i: number, picked: SearchResult) => {
    const newTrack: Track = {
      id: `manual-${Date.now()}`,
      title: picked.title,
      artist: picked.artist,
      reason: "Manually added",
      playSeconds: 90,
      energy: pl.tracks[i]?.energy ?? 6,
      autoStart: true,
    };
    resolveCache.current.set(`${picked.title}|${picked.artist}`, {
      uri: picked.uri, id: picked.id, durationMs: picked.durationMs,
    });
    const arr = [...pl.tracks];
    arr.splice(i + 1, 0, newTrack);
    updateTracks(arr);
    if (current > i) setCurrent(current + 1);
    setInsertAt(null);
  };
  const setLength = (i: number, secs: number) => {
    const arr = [...pl.tracks];
    arr[i] = { ...arr[i], playSeconds: Math.max(15, Math.min(300, secs)) };
    updateTracks(arr);
  };
  const setStart = (i: number, ms: number) => {
    const arr = [...pl.tracks];
    arr[i] = { ...arr[i], startMs: Math.max(0, ms), autoStart: false };
    updateTracks(arr);
  };
  const setEnd = (i: number, ms: number) => {
    const arr = [...pl.tracks];
    arr[i] = { ...arr[i], endMs: Math.max(0, ms) };
    updateTracks(arr);
  };
  const clearEnd = (i: number) => {
    const arr = [...pl.tracks];
    const { endMs: _omit, ...rest } = arr[i];
    arr[i] = rest;
    updateTracks(arr);
  };
  const toggleAuto = (i: number) => {
    const arr = [...pl.tracks];
    const nextAuto = !(arr[i].autoStart ?? true);
    arr[i] = { ...arr[i], autoStart: nextAuto, ...(nextAuto ? { startMs: undefined } : {}) };
    updateTracks(arr);
  };
  const setTransition = (mode: TransitionMode) => { setPl({ ...pl, transition: mode }); setDirty(true); };

  const save = async () => {
    if (id === "draft") return toast.error("Sign in to save");
    const { error } = await supabase
      .from("playlists")
      .update({ tracks: pl.tracks as any, name: pl.name, transition: pl.transition ?? "smooth" } as any)
      .eq("id", id);
    if (error) return toast.error(error.message);
    setDirty(false);
    toast.success("Saved");
  };

  const trackCutSec = (t: Track) => computeCutSec(t, t.startMs ?? 0);
  const totalSecs = pl.tracks.reduce((s, t) => s + trackCutSec(t), 0);
  const track = pl.tracks[current];
  const currentCut = track ? trackCutSec(track) : 0;
  const pct = currentCut > 0 ? (elapsed / currentCut) * 100 : 0;
  const search = (t: Track) => `https://open.spotify.com/search/${encodeURIComponent(`${t.title} ${t.artist}`)}`;
  const showPlay = !desiredPlaying || spotifyPaused;

  // For the Start display, fall back to a 0:00 placeholder when we don't have
  // duration yet. Once a track is resolved (after first play) we show the
  // heuristic value derived from real durationMs.
  const startDisplayMs = (t: Track) => {
    if (t.autoStart === false && typeof t.startMs === "number") return t.startMs;
    const cached = resolveCache.current.get(`${t.title}|${t.artist}`);
    if (!cached) return heuristicStartMs(t.energy, 3 * 60 * 1000); // assume 3 min
    return heuristicStartMs(t.energy, cached.durationMs);
  };

  const onRowClick = (i: number) => {
    activateSpotify();
    if (i === current) {
      if (desiredPlaying && !spotifyPaused) pause();
      else if (desiredPlaying && spotifyPaused) resume();
      else startTrack(i);
    } else {
      startTrack(i);
    }
  };

  const onBottomToggle = () => {
    activateSpotify();
    if (!desiredPlaying) {
      if (elapsed === 0) startTrack(current);
      else resume();
    } else if (spotifyPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <div className="min-h-screen pb-40">
      <SiteHeader />

      {/* Energy plant lives inside the playlist column now (see below). */}


      {/* Order Recap floating button (top-right). */}
      <button
        type="button"
        onClick={() => setRecapOpen(true)}
        className="fixed right-4 top-20 z-30 flex items-center gap-2 rounded-full border border-primary/40 bg-card/80 px-3 py-2 text-xs font-medium shadow-glow backdrop-blur transition-all hover:border-primary hover:bg-primary/10"
        title="Show the choices you made"
      >
        <ClipboardList className="h-4 w-4 text-primary" />
        Order Recap
      </button>

      {recapOpen && <OrderRecap brief={pl.brief} onClose={() => setRecapOpen(false)} />}

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Input
              value={pl.name}
              onChange={(e) => { setPl({ ...pl, name: e.target.value }); setDirty(true); }}
              className="border-0 bg-transparent !text-3xl font-bold focus-visible:ring-0 px-0"
            />
            <p className="text-sm text-muted-foreground">
              {pl.tracks.length} tracks · {fmt(totalSecs)} total · {pl.brief.eventType}
            </p>
          </div>
          {id !== "draft" && (
            <Button onClick={save} disabled={!dirty} variant={dirty ? "default" : "outline"} className={dirty ? "bg-gradient-sunset shadow-glow bg-lime-400 text-fuchsia-700 border-lime-400" : ""}>
              <Save className="mr-1 h-4 w-4" /> {dirty ? "Save" : "Saved"}
            </Button>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 p-3 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Music2 className="h-4 w-4 shrink-0 text-primary" />
            {spotifyOn ? (
              <span className="truncate text-muted-foreground">
                Spotify connected{spReady ? " · player ready" : " · loading player..."}
              </span>
            ) : (
              <span className="truncate text-muted-foreground">
                Connect Spotify Premium to play full tracks in-app.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Transition</span>
            <Select value={transitionMode} onValueChange={(v) => setTransition(v as TransitionMode)}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hard">Hard cut</SelectItem>
                <SelectItem value="smooth">Smooth (1.5s)</SelectItem>
                <SelectItem value="long">Long (3s)</SelectItem>
              </SelectContent>
            </Select>
            {spotifyOn ? (
              <Button size="sm" variant="ghost" onClick={() => { logoutSpotify(); setSpotifyOn(false); }}>
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-gradient-sunset shadow-glow bg-lime-400 text-fuchsia-700 border-lime-400"
                onClick={async () => {
                  try {
                    await startSpotifyLogin(window.location.pathname);
                  } catch (e: any) {
                    toast.error(e?.message ?? 'Failed to start Spotify login');
                  }
                }}
              >
                Connect Spotify
              </Button>
            )}
          </div>
        </div>

        {spotifyOn && isFramed && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-primary/50 bg-primary/10 p-3 text-sm shadow-glow">
            <div className="flex min-w-0 gap-2">
              <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                Spotify can show "Playing on VibeDeck" but stay silent in some embedded contexts. Open the app directly for browser audio.
              </p>
            </div>
            <Button size="sm" className="shrink-0 bg-gradient-sunset shadow-glow" onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}>
              Open tab
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {pl.tracks.map((t, i) => {
            const auto = t.autoStart ?? true;
            const startMs = startDisplayMs(t);
            const isCur = i === current;
            return (
              <div key={t.id}>
                <div
                  className={`rounded-2xl border p-4 transition-all ${
                    isCur ? "border-primary bg-primary/5 shadow-glow" : "border-border/60 bg-card/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onRowClick(i)}
                      disabled={!spotifyOn}
                      title={spotifyOn ? "Play track" : "Connect Spotify to play"}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-glow border-lime-400 transition-opacity ${
                        spotifyOn
                          ? "bg-gradient-sunset text-primary-foreground bg-lime-400 text-fuchsia-700 cursor-pointer hover:opacity-90"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                    >
                      {isCur && desiredPlaying && !spotifyPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{t.title}</p>
                        <a href={search(t)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {t.globalEar && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                            title={`Global Ear pick — discover an artist from outside the English-speaking scene${t.language ? ` (${t.language})` : ""}.`}
                          >
                            🌍 {t.language ?? "Global"}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{t.artist}</p>
                      <p className="mt-1 text-xs italic text-muted-foreground/80">{t.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs">
                        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 px-2 py-1">
                          <span className="text-muted-foreground">start</span>
                          <input
                            type="text"
                            value={fmtMs(startMs)}
                            onChange={(e) => {
                              const [m, s] = e.target.value.split(":").map((n) => Number(n) || 0);
                              setStart(i, (m * 60 + s) * 1000);
                            }}
                            className="w-12 bg-transparent text-right font-mono outline-none"
                          />
                        </div>
                        <button
                          onClick={() => toggleAuto(i)}
                          className={`rounded-md border px-1.5 py-1 text-[10px] uppercase tracking-wide ${
                            auto ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"
                          }`}
                          title="Auto-pick start based on track energy"
                        >
                          Auto
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 px-2 py-1">
                          <span className="text-muted-foreground">end</span>
                          <input
                            type="text"
                            value={typeof t.endMs === "number" ? fmtMs(t.endMs) : fmtMs(startMs + t.playSeconds * 1000)}
                            onChange={(e) => {
                              const [m, s] = e.target.value.split(":").map((n) => Number(n) || 0);
                              setEnd(i, (m * 60 + s) * 1000);
                            }}
                            className="w-12 bg-transparent text-right font-mono outline-none"
                            title="End point in the source track"
                          />
                        </div>
                        {typeof t.endMs === "number" && (
                          <button
                            onClick={() => clearEnd(i)}
                            className="rounded-md border border-border/60 px-1.5 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                            title="Use cut length instead of explicit end point"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 px-2 py-1">
                          <span className="text-muted-foreground">cut</span>
                          <input
                            type="number"
                            value={Math.round(trackCutSec(t))}
                            onChange={(e) => { setLength(i, Number(e.target.value)); clearEnd(i); }}
                            className="w-12 bg-transparent text-right font-mono outline-none"
                          />
                          <span className="text-muted-foreground">s</span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => reorder(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => reorder(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                  {isCur && (
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gradient-sunset transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>

                {insertAt === i ? (
                  <InsertSongPanel
                    spotifyOn={spotifyOn}
                    onCancel={() => setInsertAt(null)}
                    onPick={(picked) => insertAfter(i, picked)}
                  />
                ) : (
                  <div className="my-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setInsertAt(i)}
                      className="group flex items-center gap-1 rounded-full border border-dashed border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-all hover:border-primary hover:text-primary"
                      title="Add a song after this one"
                    >
                      <Plus className="h-3 w-3" /> Add song here
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>


        {id === "draft" && (
          <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm">
            <Link to="/auth" className="font-semibold text-primary">Sign in</Link>
            <span className="text-muted-foreground"> to save this set to your library.</span>
          </div>
        )}
      </main>

      {/* Persistent energy plant — fixed sidebar (desktop only). */}
      <div className="pointer-events-none fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 sm:block">
        <div className="w-28 lg:w-32">
          <ZanzibarPlant energy={track?.energy ?? 5} className="h-auto w-full opacity-95" />
          <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
            Energy {track?.energy ?? 5}/10
          </p>
        </div>
      </div>

      {track && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="container mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{track.title}</p>
              <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={prev}><SkipBack className="h-4 w-4" /></Button>
              <Button
                size="icon"
                onClick={onBottomToggle}
                className={`h-12 w-12 rounded-full bg-gradient-sunset shadow-glow bg-lime-400 text-fuchsia-700 border-lime-400 ${desiredPlaying && !spotifyPaused ? "animate-pulse-ring" : ""}`}
              >
                {showPlay ? <Play className="h-5 w-5 pl-0.5" /> : <Pause className="h-5 w-5" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={next}><SkipForward className="h-4 w-4" /></Button>
            </div>
            <div className="hidden w-24 text-right font-mono text-xs text-muted-foreground tabular-nums sm:block">
              {fmt(elapsed)} / {fmt(currentCut)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InsertSongPanel({
  spotifyOn,
  onCancel,
  onPick,
}: {
  spotifyOn: boolean;
  onCancel: () => void;
  onPick: (r: SearchResult) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spotifyOn) return;
    if (!q.trim()) { setResults([]); return; }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchTracks(q, 8);
        setResults(r);
      } catch (e: any) {
        toast.error(e.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q, spotifyOn]);

  return (
    <div className="my-2 rounded-2xl border border-primary/40 bg-primary/5 p-3 shadow-glow">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <Input
          autoFocus
          placeholder={spotifyOn ? "Search song or artist…" : "Connect Spotify to search"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={!spotifyOn}
          className="h-8"
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      {loading && <p className="mt-2 text-xs text-muted-foreground">Searching…</p>}
      {results.length > 0 && (
        <ul className="mt-2 max-h-64 space-y-1 overflow-auto">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-left text-sm transition-all hover:border-primary hover:bg-primary/10"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.artist}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{fmtMs(r.durationMs)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
