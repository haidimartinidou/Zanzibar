import { useEffect, useRef, useState } from "react";
import { getAccessToken, isSpotifyConnected } from "@/lib/spotify";

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve) => {
    if (window.Spotify) return resolve();
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    document.body.appendChild(s);
  });
  return sdkPromise;
}

export type SpotifyState = {
  paused: boolean;
  position: number;
  duration: number;
  trackUri: string | null;
};

export function useSpotifyPlayer(
  onState?: (s: SpotifyState) => void,
  enabled = true,
) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const rampIdRef = useRef(0);

  // Cancel any in-flight rampVolume loop. Call before starting a new track
  // or a new ramp, otherwise the old loop will keep stepping volume and
  // override the new value (e.g. mute the next track).
  const cancelRamp = () => { rampIdRef.current++; };

  const activate = async () => {
    try {
      await playerRef.current?.activateElement?.();
    } catch {
      /* surfaced via listeners */
    }
  };

  const setVolume = async (v: number) => {
    try {
      await playerRef.current?.setVolume?.(Math.max(0, Math.min(1, v)));
    } catch {
      /* ignore */
    }
  };

  /**
   * Smoothly ramp volume from `from` to `to` over `ms`.
   * `curve`:
   *  - "linear"   straight line
   *  - "easeOut"  fast start, slow tail (good for fade-out — tail lingers like a DJ filter sweep)
   *  - "easeIn"   slow start, fast finish (good for fade-in — new track blooms in)
   */
  const rampVolume = async (
    from: number,
    to: number,
    ms: number,
    curve: "linear" | "easeOut" | "easeIn" = "linear",
  ) => {
    const myId = ++rampIdRef.current;
    const steps = 16;
    const stepMs = Math.max(20, ms / steps);
    for (let i = 1; i <= steps; i++) {
      if (myId !== rampIdRef.current) return; // cancelled by newer ramp / track
      const t = i / steps;
      const k =
        curve === "easeOut" ? 1 - Math.pow(1 - t, 2) :
        curve === "easeIn"  ? t * t :
        t;
      const v = from + (to - from) * k;
      await setVolume(v);
      await new Promise((r) => setTimeout(r, stepMs));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      playerRef.current?.disconnect?.();
      playerRef.current = null;
      setDeviceId(null);
      setReady(false);
      return;
    }
    if (!isSpotifyConnected()) return;
    let mounted = true;

    (async () => {
      try {
        await loadSdk();
        if (!mounted) return;
        const player = new window.Spotify.Player({
          name: "VibeDeck",
          getOAuthToken: async (cb: (t: string) => void) => {
            const tok = await getAccessToken();
            if (tok) cb(tok);
          },
          volume: 0.8,
        });
        playerRef.current = player;
        player.addListener("ready", ({ device_id }: any) => {
          if (!mounted) return;
          setDeviceId(device_id);
          setReady(true);
        });
        player.addListener("not_ready", () => mounted && setReady(false));
        player.addListener("initialization_error", ({ message }: any) => mounted && setError(message));
        player.addListener("authentication_error", ({ message }: any) => mounted && setError(message));
        player.addListener("account_error", ({ message }: any) =>
          mounted && setError(message + " (Spotify Premium required)"));
        player.addListener("playback_error", ({ message }: any) => mounted && setError(message));
        player.addListener("autoplay_failed", () =>
          mounted && setError("Browser blocked audio start. Press Play once in VibeDeck, then keep this tab open."));
        player.addListener("player_state_changed", (state: any) => {
          if (!mounted || !state) return;
          onStateRef.current?.({
            paused: state.paused,
            position: state.position,
            duration: state.duration,
            trackUri: state.track_window?.current_track?.uri ?? null,
          });
        });
        await player.connect();
      } catch (e: any) {
        setError(e.message ?? "Failed to load Spotify SDK");
      }
    })();

    return () => {
      mounted = false;
      playerRef.current?.disconnect?.();
      playerRef.current = null;
      setDeviceId(null);
      setReady(false);
    };
  }, [enabled]);

  return { deviceId, ready, error, player: playerRef, activate, setVolume, rampVolume, cancelRamp };
}
