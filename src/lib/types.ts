export type EnergyLevel = "chill" | "warmup" | "groove" | "upbeat" | "peak";

export type TimelinePhase = {
  minutes: number;        // length of this window
  energy: EnergyLevel;    // dancefloor intensity
  vibe?: string;          // optional style override for this window
};

export type VibeBrief = {
  eventType: string;
  vibes: string[];        // multi-select styles to blend (e.g. ["indie", "jazz"])
  vibe?: string;          // legacy single-vibe (back-compat with old playlists)
  energy: number;         // 1-10 overall (used when no timeline)
  formality: "casual" | "semi-formal" | "formal";
  crowd: string;
  durationMinutes: number;
  notes?: string;
  timeline?: TimelinePhase[]; // optional per-window plan
  globalEar?: boolean;    // opt-in: include non-English tracks from global artists
  countries?: string[];   // specific countries to draw music from
};

export type TransitionKind = "hard" | "smooth";

export type Track = {
  id: string;
  title: string;
  artist: string;
  reason: string;       // why it fits the vibe
  playSeconds: number;  // length of the smart cut
  energy: number;       // 1-10
  startMs?: number;     // resolved start position; undefined = auto-pick
  autoStart?: boolean;  // when true (default), recompute startMs from analysis
  endMs?: number;       // explicit end position in the source track; overrides playSeconds when set
  transitionToNext?: TransitionKind; // DJ-recommended cut style INTO the next track
  transitionNote?: string;            // brief description of the transition idea
  globalEar?: boolean;   // marked as a Global Ear discovery pick
  language?: string;     // primary sung language (e.g. "Portuguese", "Yoruba")
};

export type TransitionMode = "hard" | "smooth" | "long";

export type Playlist = {
  id?: string;
  name: string;
  brief: VibeBrief;
  tracks: Track[];
  transition?: TransitionMode;
  created_at?: string;
};
