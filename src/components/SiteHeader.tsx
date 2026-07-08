import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HoloLogo } from "@/components/HoloLogo";
import { needsSpotifyReconnect, startSpotifyLogin } from "@/lib/spotify";
import { toast } from "sonner";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    setShowReconnectBanner(needsSpotifyReconnect());
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600&display=swap');
        .zz-nav-link {
          padding: 7px 14px;
          font-size: 14px;
          font-weight: 600;
          color: #7A1200;
          text-decoration: none;
          border-radius: 999px;
          transition: background 140ms ease;
        }
        .zz-nav-link:hover { background: rgba(228,19,12,0.08); }
        .zz-nav-cta {
          background: #E4130C;
          color: #FFF3B0;
          border-radius: 999px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          font-family: 'Fredoka', system-ui, sans-serif;
          transition: opacity 140ms ease;
        }
        .zz-nav-cta:hover { opacity: 0.88; }
        .zz-nav-ghost {
          padding: 7px 14px;
          font-size: 14px;
          font-weight: 600;
          color: #7A1200;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 999px;
          transition: background 140ms ease;
        }
        .zz-nav-ghost:hover { background: rgba(228,19,12,0.08); }
      `}</style>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#FFF6D8",
          borderBottom: "1.5px solid rgba(228,19,12,0.15)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            height: 64,
            fontFamily: "'Poppins', system-ui, sans-serif",
          }}
        >
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <HoloLogo />
            <span
              style={{
                fontFamily: "'Fredoka', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: "#E4130C",
              }}
            >
              Zanzibar
            </span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link to="/about" className="zz-nav-link">About</Link>
            {email ? (
              <>
                <Link to="/library" className="zz-nav-link">My sets</Link>
                <Link to="/import" className="zz-nav-link">Import playlist</Link>
                <Link to="/vibe" className="zz-nav-cta">New set</Link>
                <button className="zz-nav-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
              </>
            ) : (
              <Link to="/auth" className="zz-nav-cta">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      {showReconnectBanner && (
        <div
          role="alert"
          style={{
            background: "#FFC24D",
            borderBottom: "1.5px solid rgba(122,18,0,0.18)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            fontFamily: "'Poppins', system-ui, sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#7A1200" }}>
                Spotify needs a quick reconnect — this is not a bug.
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#7A1200", lineHeight: 1.5 }}>
                We added new features (Save to Spotify &amp; Import playlist) that require two extra permissions from Spotify.
                Your old connection only has the original ones. Reconnecting takes one click and keeps everything else intact.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={async () => {
                try { await startSpotifyLogin(window.location.pathname); }
                catch (e: any) { toast.error(e?.message ?? "Failed to start Spotify login"); }
              }}
              style={{
                background: "#7A1200", color: "#FFF3B0", border: "none", borderRadius: 999,
                padding: "8px 18px", fontFamily: "'Fredoka', system-ui, sans-serif",
                fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Reconnect Spotify
            </button>
            <button
              onClick={() => setShowReconnectBanner(false)}
              aria-label="Dismiss"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#7A1200", fontSize: 18, lineHeight: 1, padding: "4px 6px", opacity: 0.6,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
