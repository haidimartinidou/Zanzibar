import { X, Copy, Printer } from "lucide-react";
import { toast } from "sonner";
import type { Playlist, Track } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const fmtRuntime = (totalSecs: number) => {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function deriveCutCue(t: Track): string {
  if (t.cutCue) return t.cutCue;
  const sec = t.playSeconds;
  const label = fmt(sec);
  // ≥ 3 min treated as "let it ride" — short cuts always get explicit instruction
  if (sec >= 180) return `let it ride (~${label})`;
  return `cut after ~${label}`;
}

// Map energy 1–10 to filled dots out of 5
function EnergyDots({ energy }: { energy: number }) {
  const filled = Math.round(energy / 2);
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: i < filled ? "#E4130C" : "rgba(228,19,12,0.15)",
            flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
}

// Inline SVG sparkline — one bar per track, height ∝ energy
function EnergySparkline({ tracks }: { tracks: Track[] }) {
  const H = 40;
  const BAR_W = 6;
  const GAP = 3;
  const total = tracks.length;
  const width = total * (BAR_W + GAP) - GAP;

  return (
    <svg
      viewBox={`0 0 ${width} ${H}`}
      width={width}
      height={H}
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      {tracks.map((t, i) => {
        const barH = Math.max(3, (t.energy / 10) * H);
        const x = i * (BAR_W + GAP);
        const y = H - barH;
        return (
          <rect
            key={t.id}
            x={x}
            y={y}
            width={BAR_W}
            height={barH}
            rx={2}
            fill="#E4130C"
            opacity={0.55 + (t.energy / 10) * 0.45}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CueSheet({
  playlist,
  onClose,
}: {
  playlist: Playlist;
  onClose: () => void;
}) {
  const tracks = playlist.tracks;
  const totalSecs = tracks.reduce((s, t) => s + t.playSeconds, 0);
  const styleBlend =
    playlist.brief.vibes?.length
      ? playlist.brief.vibes.join(" + ")
      : (playlist.brief.vibe ?? "—");

  const copyTracklist = async () => {
    const lines = tracks
      .map((t, i) => `${i + 1}. ${t.artist} – ${t.title}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast.success("Tracklist copied to clipboard");
    } catch {
      toast.error("Clipboard not available");
    }
  };

  return (
    <>
      {/* Print-only styles injected into the document head */}
      <style>{`
        @media print {
          body > *:not(#zz-cuesheet-root) { display: none !important; }
          #zz-cuesheet-root {
            position: static !important; background: white !important;
            backdrop-filter: none !important;
          }
          #zz-cuesheet-modal {
            position: static !important; margin: 0 !important; max-width: 100% !important;
            max-height: none !important; overflow: visible !important;
            box-shadow: none !important; border: none !important;
            border-radius: 0 !important;
          }
          .zz-cs-no-print { display: none !important; }
          .zz-cs-track-row { break-inside: avoid; }
          .zz-cs-sparkline { display: none !important; }
        }
      `}</style>

      <div
        id="zz-cuesheet-root"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          padding: "24px 16px 40px",
          overflowY: "auto",
        }}
        onClick={onClose}
      >
        <div
          id="zz-cuesheet-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 860,
            borderRadius: 28,
            border: "1.5px solid rgba(228,19,12,0.22)",
            background: "#FFFCE0",
            boxShadow: "0 32px 80px rgba(122,18,0,0.18)",
            overflow: "hidden",
            fontFamily: "'Poppins', system-ui, sans-serif",
            color: "#7A1200",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              background: "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
              padding: "32px 36px 28px",
              color: "#FFF3B0",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="zz-cs-no-print"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(255,243,176,0.18)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#FFF3B0",
              }}
              aria-label="Close cue sheet"
            >
              <X size={16} />
            </button>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#FFD98A", marginBottom: 8 }}>
              DJ Cue Sheet
            </div>
            <h2
              style={{
                fontFamily: "'Fredoka', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "clamp(24px, 4vw, 38px)",
                lineHeight: 1.1,
                margin: "0 0 12px",
              }}
            >
              {playlist.name}
            </h2>

            {/* Meta row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", fontSize: 13, color: "#FFE3B0", marginBottom: 20 }}>
              <span>⏱ {fmtRuntime(totalSecs)}</span>
              <span>🎉 {playlist.brief.eventType}</span>
              <span>🎵 {styleBlend}</span>
              <span>⚡ Energy {playlist.brief.energy}/10</span>
            </div>

            {/* Sparkline */}
            <div className="zz-cs-sparkline" style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
              <EnergySparkline tracks={tracks} />
            </div>
          </div>

          {/* ── Track table ── */}
          <div style={{ padding: "0 0 8px" }}>
            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 52px 110px 72px 80px",
                gap: "0 12px",
                padding: "12px 20px 8px",
                borderBottom: "1.5px solid rgba(228,19,12,0.14)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.9,
                color: "#B4740A",
              }}
            >
              <span>#</span>
              <span>Track</span>
              <span style={{ textAlign: "right" }}>Length</span>
              <span>Cut cue</span>
              <span>Transition</span>
              <span>Energy</span>
            </div>

            {tracks.map((t, i) => {
              const cutCue = deriveCutCue(t);
              const isLast = i === tracks.length - 1;

              return (
                <div
                  key={t.id}
                  className="zz-cs-track-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 52px 110px 72px 80px",
                    gap: "0 12px",
                    padding: "13px 20px",
                    borderBottom: isLast ? "none" : "1px solid rgba(228,19,12,0.10)",
                    alignItems: "start",
                  }}
                >
                  {/* Position */}
                  <span
                    style={{
                      fontFamily: "'Fredoka', system-ui, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#E4130C",
                      lineHeight: 1,
                      paddingTop: 2,
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* Artist – Title + reason */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#7A1200", lineHeight: 1.25 }}>
                      {t.artist}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: 13, color: "#B4740A", fontStyle: "italic", lineHeight: 1.25 }}>
                      {t.title}
                    </p>
                    <p style={{ margin: "5px 0 0", fontSize: 11, color: "rgba(122,18,0,0.55)", lineHeight: 1.4 }}>
                      {t.reason}
                    </p>
                  </div>

                  {/* Play length */}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "#7A1200",
                      fontWeight: 600,
                      textAlign: "right",
                      paddingTop: 2,
                    }}
                  >
                    {fmt(t.playSeconds)}
                  </span>

                  {/* Cut cue */}
                  <span
                    style={{
                      fontSize: 11,
                      color: "#7A1200",
                      lineHeight: 1.4,
                      paddingTop: 2,
                    }}
                  >
                    {cutCue}
                  </span>

                  {/* Transition label */}
                  <span style={{ paddingTop: 2 }}>
                    {t.transitionToNext ? (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                          borderRadius: 999,
                          padding: "2px 8px",
                          background:
                            t.transitionToNext === "hard"
                              ? "rgba(228,19,12,0.12)"
                              : "rgba(180,116,10,0.12)",
                          color:
                            t.transitionToNext === "hard" ? "#E4130C" : "#B4740A",
                          border:
                            t.transitionToNext === "hard"
                              ? "1px solid rgba(228,19,12,0.3)"
                              : "1px solid rgba(180,116,10,0.3)",
                        }}
                      >
                        {t.transitionToNext === "hard" ? "hard cut" : "smooth"}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: "rgba(122,18,0,0.3)" }}>—</span>
                    )}
                    {t.transitionNote && (
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(122,18,0,0.5)", lineHeight: 1.35 }}>
                        {t.transitionNote}
                      </p>
                    )}
                  </span>

                  {/* Energy dots */}
                  <div style={{ paddingTop: 4 }}>
                    <EnergyDots energy={t.energy} />
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "#B4740A" }}>
                      {t.energy}/10
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Footer actions ── */}
          <div
            className="zz-cs-no-print"
            style={{
              padding: "16px 20px",
              borderTop: "1.5px solid rgba(228,19,12,0.14)",
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              background: "#FFF6D8",
            }}
          >
            <button
              onClick={copyTracklist}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1.5px solid rgba(228,19,12,0.28)",
                borderRadius: 999,
                background: "transparent",
                color: "#7A1200",
                padding: "8px 18px",
                fontFamily: "'Poppins', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "border-color 140ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E4130C")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(228,19,12,0.28)")}
            >
              <Copy size={14} /> Copy tracklist
            </button>
            <button
              onClick={() => window.print()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#E4130C",
                color: "#FFF3B0",
                border: "none",
                borderRadius: 999,
                padding: "8px 18px",
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(228,19,12,0.25)",
                transition: "opacity 140ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Printer size={14} /> Print cue sheet
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
