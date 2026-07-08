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
  getAudioAnalysis, snapToPhrase, createSpotifyPlaylistAndAddTracks,
  type ResolvedTrack, type SearchResult,
} from "@/lib/spotify";
import { useSpotifyPlayer, type SpotifyState } from "@/hooks/useSpotifyPlayer";
import { ZanzibarPlant } from "@/components/ZanzibarPlant";
import { OrderRecap } from "@/components/OrderRecap";
import { DJLoading } from "@/components/DJLoading";

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

  if (!pl) return (
    <div style={{ minHeight: "100vh", background: "#FFF6D8" }}>
      <SiteHeader />
      <DJLoading label="loading your set..." />
    </div>
  );

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

  const saveToSpotify = async () => {
    if (!spotifyOn) return toast.error("Connect Spotify first");
    const toastId = toast.loading("Resolving tracks…");
    try {
      const uris: string[] = [];
      for (const t of pl.tracks) {
        const info = await resolve(t);
        if (info) uris.push(info.uri);
      }
      if (uris.length === 0) throw new Error("No tracks could be found on Spotify");
      toast.loading("Creating Spotify playlist…", { id: toastId });
      const url = await createSpotifyPlaylistAndAddTracks(pl.name, uris);
      toast.success("Playlist saved to Spotify!", { id: toastId });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't save to Spotify", { id: toastId });
    }
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
    <div style={{ minHeight: "100vh", background: "#FFF6D8", color: "#7A1200", fontFamily: "'Poppins', system-ui, sans-serif", paddingBottom: 120 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600&display=swap');
        .zz-track-row {
          border-radius: 20px;
          border: 1.5px solid rgba(228,19,12,0.18);
          background: #FFFCE0;
          padding: 16px 18px;
          transition: border-color 160ms ease;
        }
        .zz-track-row.zz-active {
          border-color: #E4130C;
          background: #FFF3E0;
          box-shadow: 0 6px 24px rgba(228,19,12,0.14);
        }
        .zz-play-btn {
          width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          background: #E4130C; color: #FFF3B0;
          box-shadow: 0 6px 18px rgba(228,19,12,0.28);
          transition: opacity 140ms ease;
        }
        .zz-play-btn:hover:not(:disabled) { opacity: 0.88; }
        .zz-play-btn:disabled { background: rgba(122,18,0,0.15); color: rgba(122,18,0,0.4); cursor: not-allowed; box-shadow: none; }
        .zz-ctrl-box {
          display: flex; align-items: center; gap: 4px;
          border: 1px solid rgba(228,19,12,0.22); border-radius: 10px;
          background: #FFF6D8; padding: 4px 8px; font-size: 12px;
        }
        .zz-ctrl-input {
          width: 44px; background: transparent; text-align: right; font-family: monospace;
          outline: none; color: #7A1200; border: none;
        }
        .zz-ctrl-label { color: #B4740A; font-size: 11px; }
        .zz-auto-btn {
          border: 1px solid rgba(228,19,12,0.22); border-radius: 8px;
          padding: 3px 7px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px;
          background: transparent; color: #B4740A; cursor: pointer; transition: all 140ms ease;
        }
        .zz-auto-btn.active { border-color: #E4130C; background: rgba(228,19,12,0.08); color: #E4130C; }
        .zz-icon-btn {
          width: 28px; height: 28px; border: none; background: none; cursor: pointer;
          color: rgba(122,18,0,0.45); display: flex; align-items: center; justify-content: center;
          border-radius: 8px; transition: all 140ms ease;
        }
        .zz-icon-btn:hover { color: #E4130C; background: rgba(228,19,12,0.08); }
        .zz-icon-btn.danger:hover { color: #E4130C; }
        .zz-add-song {
          display: flex; align-items: center; gap: 6px;
          border: 1.5px dashed rgba(228,19,12,0.2); border-radius: 999px;
          background: transparent; color: rgba(122,18,0,0.5); cursor: pointer;
          padding: 4px 14px; font-size: 12px; transition: all 140ms ease;
        }
        .zz-add-song:hover { border-color: #E4130C; color: #E4130C; }
        .zz-spotify-bar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
          border-radius: 18px; border: 1.5px solid rgba(228,19,12,0.16);
          background: #FFFCE0; padding: 12px 18px; font-size: 13px;
          margin-bottom: 16px;
        }
        .zz-connect-btn {
          background: #1DB954; color: #fff; border: none; border-radius: 999px;
          padding: 8px 18px; font-weight: 700; font-size: 13px; cursor: pointer;
          font-family: 'Poppins', sans-serif; transition: opacity 140ms ease;
        }
        .zz-connect-btn:hover { opacity: 0.88; }
        .zz-save-spotify-btn {
          background: #1DB954; color: #fff; border: none; border-radius: 999px;
          padding: 8px 18px; font-weight: 700; font-size: 13px; cursor: pointer;
          font-family: 'Poppins', sans-serif; display: flex; align-items: center; gap: 6px;
          transition: opacity 140ms ease;
        }
        .zz-save-spotify-btn:hover { opacity: 0.88; }
        .zz-save-zanzibar-btn {
          background: #E4130C; color: #FFF3B0; border: none; border-radius: 999px;
          padding: 8px 18px; font-family: 'Fredoka', sans-serif; font-weight: 700;
          font-size: 15px; cursor: pointer; box-shadow: 0 6px 18px rgba(228,19,12,0.22);
          display: flex; align-items: center; gap: 6px; transition: opacity 140ms ease;
        }
        .zz-save-zanzibar-btn:hover:not(:disabled) { opacity: 0.88; }
        .zz-save-zanzibar-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .zz-player-bar {
          position: fixed; inset: auto 0 0 0; z-index: 40;
          background: #FFFCE0; border-top: 1.5px solid rgba(228,19,12,0.18);
        }
        .zz-player-inner {
          max-width: 820px; margin: 0 auto; display: flex; align-items: center; gap: 16px;
          padding: 12px 24px;
        }
        .zz-player-play {
          width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer;
          background: #E4130C; color: #FFF3B0;
          box-shadow: 0 8px 24px rgba(228,19,12,0.3); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 140ms ease;
        }
        .zz-player-play:hover { opacity: 0.88; }
        .zz-skip-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(122,18,0,0.6); padding: 8px; border-radius: 10px;
          transition: color 140ms ease;
        }
        .zz-skip-btn:hover { color: #E4130C; }
        .zz-recap-btn {
          position: fixed; right: 16px; top: 80px; z-index: 30;
          display: flex; align-items: center; gap: 6px;
          border: 1.5px solid rgba(228,19,12,0.28); border-radius: 999px;
          background: #FFFCE0; padding: 7px 14px; font-size: 12px; font-weight: 600;
          cursor: pointer; color: #7A1200; box-shadow: 0 4px 14px rgba(122,18,0,0.1);
          transition: border-color 140ms ease;
        }
        .zz-recap-btn:hover { border-color: #E4130C; }
        @media (max-width: 680px) {
          .zz-track-controls { display: none !important; }
        }
      `}</style>

      <SiteHeader />

      {/* Order Recap */}
      <button type="button" onClick={() => setRecapOpen(true)} className="zz-recap-btn">
        <ClipboardList size={14} /> Order Recap
      </button>
      {recapOpen && <OrderRecap brief={pl.brief} onClose={() => setRecapOpen(false)} />}

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 40px" }}>

        {/* Set title + action buttons */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={pl.name}
              onChange={(e) => { setPl({ ...pl, name: e.target.value }); setDirty(true); }}
              style={{
                border: "none", background: "transparent", outline: "none",
                fontFamily: "'Fredoka', system-ui, sans-serif", fontWeight: 700, fontSize: 38,
                color: "#E4130C", width: "100%", padding: 0,
              }}
            />
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#B4740A" }}>
              {pl.tracks.length} tracks · {fmt(totalSecs)} total · {pl.brief.eventType}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {spotifyOn && (
              <button className="zz-save-spotify-btn" onClick={saveToSpotify} title="Save full tracks to your Spotify account">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Save to Spotify
              </button>
            )}
            {id !== "draft" && (
              <button className="zz-save-zanzibar-btn" onClick={save} disabled={!dirty}>
                <Save size={14} /> {dirty ? "Save changes" : "Saved"}
              </button>
            )}
          </div>
        </div>

        {/* Spotify + transition bar */}
        <div className="zz-spotify-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Music2 size={16} style={{ color: "#E4130C", flexShrink: 0 }} />
            <span style={{ color: "#B4740A", fontSize: 13 }}>
              {spotifyOn
                ? `Spotify connected${spReady ? " · player ready" : " · loading player…"}`
                : "Connect Spotify Premium to play full tracks in-app."}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#B4740A" }}>Transition</span>
            <Select value={transitionMode} onValueChange={(v) => setTransition(v as TransitionMode)}>
              <SelectTrigger style={{ height: 32, fontSize: 12, width: 130, borderColor: "rgba(228,19,12,0.22)", background: "#FFF6D8", color: "#7A1200" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hard">Hard cut</SelectItem>
                <SelectItem value="smooth">Smooth (1.5s)</SelectItem>
                <SelectItem value="long">Long (3s)</SelectItem>
              </SelectContent>
            </Select>
            {spotifyOn ? (
              <button
                onClick={() => { logoutSpotify(); setSpotifyOn(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#B4740A", fontFamily: "'Poppins', sans-serif" }}
              >
                Disconnect
              </button>
            ) : (
              <button
                className="zz-connect-btn"
                onClick={async () => {
                  try { await startSpotifyLogin(window.location.pathname); }
                  catch (e: any) { toast.error(e?.message ?? "Failed to start Spotify login"); }
                }}
              >
                Connect Spotify
              </button>
            )}
          </div>
        </div>

        {spotifyOn && isFramed && (
          <div style={{ marginBottom: 16, borderRadius: 18, border: "1.5px solid #E4130C", background: "rgba(228,19,12,0.06)", padding: "12px 18px", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
            <Volume2 size={16} style={{ color: "#E4130C", flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, color: "#7A1200", flex: 1 }}>
              Spotify may stay silent in embedded contexts. Open the app directly for browser audio.
            </p>
            <button
              onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}
              style={{ background: "#E4130C", color: "#FFF3B0", border: "none", borderRadius: 999, padding: "6px 14px", fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
            >
              Open tab
            </button>
          </div>
        )}

        {/* Track list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pl.tracks.map((t, i) => {
            const auto = t.autoStart ?? true;
            const startMs = startDisplayMs(t);
            const isCur = i === current;
            return (
              <div key={t.id}>
                <div className={`zz-track-row${isCur ? " zz-active" : ""}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      className="zz-play-btn"
                      onClick={() => onRowClick(i)}
                      disabled={!spotifyOn}
                      title={spotifyOn ? "Play track" : "Connect Spotify to play"}
                    >
                      {isCur && desiredPlaying && !spotifyPaused ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
                    </button>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "#7A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                        <a href={search(t)} target="_blank" rel="noreferrer" style={{ color: "#B4740A", display: "flex" }}>
                          <ExternalLink size={13} />
                        </a>
                        {t.globalEar && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(228,19,12,0.1)", border: "1px solid rgba(228,19,12,0.3)", borderRadius: 999, padding: "2px 8px", color: "#E4130C" }}>
                            🌍 {t.language ?? "Global"}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 13, color: "#B4740A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artist}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, fontStyle: "italic", color: "rgba(122,18,0,0.55)" }}>{t.reason}</p>
                    </div>

                    {/* Controls */}
                    <div className="zz-track-controls" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div className="zz-ctrl-box">
                          <span className="zz-ctrl-label">start</span>
                          <input
                            className="zz-ctrl-input"
                            type="text"
                            value={fmtMs(startMs)}
                            onChange={(e) => {
                              const [m, s] = e.target.value.split(":").map((n) => Number(n) || 0);
                              setStart(i, (m * 60 + s) * 1000);
                            }}
                          />
                        </div>
                        <button className={`zz-auto-btn${auto ? " active" : ""}`} onClick={() => toggleAuto(i)} title="Auto-pick start">Auto</button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div className="zz-ctrl-box">
                          <span className="zz-ctrl-label">end</span>
                          <input
                            className="zz-ctrl-input"
                            type="text"
                            value={typeof t.endMs === "number" ? fmtMs(t.endMs) : fmtMs(startMs + t.playSeconds * 1000)}
                            onChange={(e) => {
                              const [m, s] = e.target.value.split(":").map((n) => Number(n) || 0);
                              setEnd(i, (m * 60 + s) * 1000);
                            }}
                            title="End point in the source track"
                          />
                        </div>
                        {typeof t.endMs === "number" && (
                          <button className="zz-auto-btn" onClick={() => clearEnd(i)} title="Use cut length">Clear</button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div className="zz-ctrl-box">
                          <span className="zz-ctrl-label">cut</span>
                          <input
                            className="zz-ctrl-input"
                            type="number"
                            value={Math.round(trackCutSec(t))}
                            onChange={(e) => { setLength(i, Number(e.target.value)); clearEnd(i); }}
                          />
                          <span className="zz-ctrl-label">s</span>
                        </div>
                        <button className="zz-icon-btn" onClick={() => reorder(i, -1)}><ArrowUp size={13} /></button>
                        <button className="zz-icon-btn" onClick={() => reorder(i, 1)}><ArrowDown size={13} /></button>
                        <button className="zz-icon-btn danger" onClick={() => remove(i)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>

                  {isCur && (
                    <div style={{ marginTop: 12, height: 4, borderRadius: 999, background: "rgba(228,19,12,0.15)", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#E4130C", width: `${pct}%`, transition: "width 0.25s linear" }} />
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
                  <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
                    <button type="button" className="zz-add-song" onClick={() => setInsertAt(i)} title="Add a song after this one">
                      <Plus size={12} /> Add song here
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {id === "draft" && (
          <div style={{ marginTop: 24, borderRadius: 18, border: "1.5px solid rgba(228,19,12,0.28)", background: "rgba(228,19,12,0.05)", padding: "16px 20px", fontSize: 14 }}>
            <Link to="/auth" style={{ fontWeight: 700, color: "#E4130C" }}>Sign in</Link>
            <span style={{ color: "#B4740A" }}> to save this set to your library.</span>
          </div>
        )}
      </main>

      {/* Persistent energy plant — desktop only */}
      <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 30, pointerEvents: "none", display: "none" }} className="sm-plant-sidebar">
        <div style={{ width: 112 }}>
          <ZanzibarPlant energy={track?.energy ?? 5} className="h-auto w-full opacity-95" />
          <p style={{ marginTop: 4, textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#B4740A" }}>
            Energy {track?.energy ?? 5}/10
          </p>
        </div>
      </div>

      {/* Bottom player bar */}
      {track && (
        <div className="zz-player-bar">
          <div className="zz-player-inner">
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#7A1200", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#B4740A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button className="zz-skip-btn" onClick={prev}><SkipBack size={18} /></button>
              <button className="zz-player-play" onClick={onBottomToggle}>
                {showPlay ? <Play size={20} style={{ marginLeft: 2 }} /> : <Pause size={20} />}
              </button>
              <button className="zz-skip-btn" onClick={next}><SkipForward size={18} /></button>
            </div>
            <div style={{ minWidth: 60, textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#B4740A" }}>
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
    <div style={{ margin: "8px 0", borderRadius: 18, border: "1.5px solid rgba(228,19,12,0.3)", background: "rgba(255,243,176,0.6)", padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Search size={14} style={{ color: "#E4130C", flexShrink: 0 }} />
        <Input
          autoFocus
          placeholder={spotifyOn ? "Search song or artist…" : "Connect Spotify to search"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={!spotifyOn}
          style={{ height: 34, fontSize: 13, borderColor: "rgba(228,19,12,0.22)", background: "#FFF6D8", color: "#7A1200" }}
        />
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#B4740A", padding: 4 }}>
          <X size={14} />
        </button>
      </div>
      {loading && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#B4740A" }}>Searching…</p>}
      {results.length > 0 && (
        <ul style={{ margin: "8px 0 0", maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, padding: 0, listStyle: "none" }}>
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onPick(r)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  borderRadius: 12, border: "1px solid rgba(228,19,12,0.18)", background: "#FFFCE0",
                  padding: "8px 12px", textAlign: "left", fontSize: 13, cursor: "pointer",
                  transition: "border-color 140ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E4130C")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(228,19,12,0.18)")}
              >
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: "#7A1200" }}>{r.title}</span>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, color: "#B4740A" }}>{r.artist}</span>
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#B4740A", flexShrink: 0 }}>{fmtMs(r.durationMs)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
