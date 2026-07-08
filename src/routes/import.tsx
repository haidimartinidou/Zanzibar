import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { DJLoading } from "@/components/DJLoading";
import { toast } from "sonner";
import { isSpotifyConnected, startSpotifyLogin, getSpotifyPlaylistTracks } from "@/lib/spotify";
import type { Track } from "@/lib/types";

export const Route = createFileRoute("/import")({ component: ImportPage });

function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  // Full URL: https://open.spotify.com/playlist/37i9dQZF1DXdbXrPNafg8V
  const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  // Spotify URI: spotify:playlist:37i9dQZF1DXdbXrPNafg8V
  const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  // Bare ID: 37i9dQZF1DXdbXrPNafg8V
  if (/^[a-zA-Z0-9]{20,30}$/.test(trimmed)) return trimmed;
  return null;
}

function assignEnergy(index: number, total: number): number {
  const pct = total <= 1 ? 0.5 : index / (total - 1);
  if (pct < 0.15) return 4;       // warmup
  if (pct < 0.35) return 6;       // building
  if (pct < 0.65) return 8;       // peak
  if (pct < 0.85) return 7;       // still going
  return 5;                        // wind down
}

function ImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const spotifyOn = typeof window !== "undefined" && isSpotifyConnected();

  const handleImport = async () => {
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      toast.error("Paste a Spotify playlist URL, URI, or ID");
      return;
    }
    if (!spotifyOn) {
      toast.error("Connect Spotify first — click the button below");
      return;
    }

    setLoading(true);
    try {
      const spotifyTracks = await getSpotifyPlaylistTracks(playlistId);
      if (spotifyTracks.length === 0) throw new Error("Playlist is empty or not accessible");

      const tracks: Track[] = spotifyTracks.map((st, i) => ({
        id: `import-${st.id}`,
        title: st.title,
        artist: st.artist,
        reason: "Imported from your Spotify playlist",
        playSeconds: 90,
        energy: assignEnergy(i, spotifyTracks.length),
        autoStart: true,
      }));

      const playlistName = `Imported set · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

      const { data: session } = await supabase.auth.getSession();

      if (session.session) {
        const { data: row, error } = await supabase
          .from("playlists")
          .insert({
            user_id: session.session.user.id,
            name: playlistName,
            brief: { eventType: "Imported", vibes: [], energy: 7, formality: "casual", crowd: "", durationMinutes: Math.round((tracks.length * 90) / 60) },
            tracks: tracks as any,
          })
          .select("id")
          .single();
        if (error) throw error;
        await navigate({ to: "/set/$id", params: { id: row.id } });
      } else {
        sessionStorage.setItem("zanzibar:draft", JSON.stringify({ name: playlistName, brief: { eventType: "Imported" }, tracks }));
        await navigate({ to: "/set/$id", params: { id: "draft" } });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Import failed");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF6D8", color: "#7A1200", fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600&display=swap');
        .zz-import-input {
          width: 100%; padding: 14px 18px;
          border: 1.5px solid rgba(228,19,12,0.28); border-radius: 14px;
          background: #FFF6D8; color: #7A1200;
          font-family: 'Poppins', system-ui, sans-serif; font-size: 15px;
          outline: none; box-sizing: border-box; transition: border-color 160ms ease;
        }
        .zz-import-input:focus { border-color: #E4130C; }
        .zz-import-input::placeholder { color: rgba(122,18,0,0.4); }
        .zz-import-btn {
          width: 100%; padding: 14px;
          background: #E4130C; color: #FFF3B0; border: none; border-radius: 999px;
          font-family: 'Fredoka', system-ui, sans-serif; font-weight: 700; font-size: 18px;
          cursor: pointer; box-shadow: 0 12px 28px rgba(228,19,12,0.24); transition: opacity 140ms ease;
        }
        .zz-import-btn:hover:not(:disabled) { opacity: 0.88; }
        .zz-import-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .zz-spotify-connect {
          background: #1DB954; color: #fff; border: none; border-radius: 999px;
          padding: 12px 28px; font-weight: 700; font-size: 16px; cursor: pointer;
          font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 24px rgba(29,185,84,0.28); transition: opacity 140ms ease;
        }
        .zz-spotify-connect:hover { opacity: 0.88; }
        .zz-how-step {
          background: #FFFCE0; border: 1.5px solid rgba(228,19,12,0.16);
          border-radius: 20px; padding: 20px 22px;
        }
      `}</style>

      <SiteHeader />

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* Header */}
        <div
          style={{
            borderRadius: 28, padding: "32px 36px", marginBottom: 36,
            background: "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
            color: "#FFF3B0", position: "relative", overflow: "hidden",
          }}
        >
          <Noise />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#FFD98A", marginBottom: 10 }}>
              § Import
            </div>
            <h1 style={{ fontFamily: "'Fredoka', system-ui, sans-serif", fontWeight: 700, fontSize: 42, margin: "0 0 12px", lineHeight: 1.05 }}>
              Party-ify your Spotify playlist.
            </h1>
            <p style={{ margin: 0, color: "#FFE3B0", fontSize: 15, lineHeight: 1.6 }}>
              Paste any Spotify playlist and Zanzibar applies smart cut-offs to every track — turning your library into a live DJ set.
            </p>
          </div>
        </div>

        {loading ? (
          <DJLoading label="importing your playlist..." />
        ) : !spotifyOn ? (
          /* Not connected — prompt to connect */
          <div style={{ textAlign: "center", background: "#FFFCE0", border: "1.5px solid rgba(228,19,12,0.18)", borderRadius: 24, padding: "40px 32px", boxShadow: "0 24px 60px rgba(122,18,0,0.1)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎧</div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 26, color: "#E4130C", margin: "0 0 10px" }}>
              Connect Spotify first.
            </h2>
            <p style={{ fontSize: 14, color: "#B4740A", margin: "0 0 28px" }}>
              We need access to read your playlists and look up tracks.
            </p>
            <button
              className="zz-spotify-connect"
              onClick={async () => {
                try { await startSpotifyLogin(window.location.pathname); }
                catch (e: any) { toast.error(e?.message ?? "Failed to start Spotify login"); }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Connect Spotify
            </button>
          </div>
        ) : (
          /* Connected — show import form */
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "#FFFCE0", border: "1.5px solid rgba(228,19,12,0.18)", borderRadius: 24, padding: "32px 28px", boxShadow: "0 24px 60px rgba(122,18,0,0.1)" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#7A1200", marginBottom: 8, letterSpacing: 0.3 }}>
                Spotify playlist URL, URI, or ID
              </label>
              <input
                className="zz-import-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
              />
              <p style={{ margin: "8px 0 24px", fontSize: 12, color: "#B4740A" }}>
                Works with any public playlist or private playlist you own.
              </p>
              <button className="zz-import-btn" onClick={handleImport} disabled={!url.trim()}>
                Apply cut-offs &amp; build set →
              </button>
            </div>

            {/* How it works */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#B4740A" }}>What happens next</p>
              {[
                { n: "01", text: "We fetch every track from your playlist." },
                { n: "02", text: "Each track gets a smart cut-off — 90 seconds by default, adjusted by energy arc across the set." },
                { n: "03", text: "You land in the set editor where you can adjust any cut-off, reorder tracks, or tweak the energy." },
                { n: "04", text: "Full versions are always there — Save to Spotify saves the full tracks, no cut-offs." },
              ].map(({ n, text }) => (
                <div key={n} className="zz-how-step" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: "#E4130C", flexShrink: 0 }}>{n}</span>
                  <p style={{ margin: 0, fontSize: 14, color: "#7A1200", lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Noise() {
  return (
    <div
      style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        opacity: 0.16, mixBlendMode: "overlay", pointerEvents: "none",
      }}
    />
  );
}
