import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { DJLoading } from "@/components/DJLoading";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/library")({ component: Library });

type Row = { id: string; name: string; created_at: string; tracks: any[]; brief: any };

function Library() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) { navigate({ to: "/auth" }); return; }
    const { data, error } = await supabase.from("playlists").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#FFF6D8", color: "#7A1200", fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600&display=swap');
        .zz-set-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-radius: 20px;
          border: 1.5px solid rgba(228,19,12,0.16);
          background: #FFFCE0;
          transition: border-color 160ms ease, box-shadow 160ms ease;
          text-decoration: none;
          gap: 12px;
        }
        .zz-set-row:hover { border-color: #E4130C; box-shadow: 0 8px 28px rgba(228,19,12,0.12); }
        .zz-new-btn {
          background: #E4130C;
          color: #FFF3B0;
          border: none;
          border-radius: 999px;
          padding: 10px 24px;
          font-family: 'Fredoka', system-ui, sans-serif;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(228,19,12,0.22);
          text-decoration: none;
          display: inline-block;
          transition: opacity 140ms ease;
        }
        .zz-new-btn:hover { opacity: 0.88; }
        .zz-import-btn {
          border: 1.5px solid #E4130C;
          color: #E4130C;
          border-radius: 999px;
          padding: 9px 22px;
          font-family: 'Fredoka', system-ui, sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          background: transparent;
          text-decoration: none;
          display: inline-block;
          transition: background 140ms ease;
        }
        .zz-import-btn:hover { background: rgba(228,19,12,0.06); }
        .zz-del-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(122,18,0,0.4);
          padding: 8px;
          border-radius: 10px;
          transition: color 140ms ease, background 140ms ease;
          flex-shrink: 0;
        }
        .zz-del-btn:hover { color: #E4130C; background: rgba(228,19,12,0.08); }
      `}</style>

      <SiteHeader />

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Header banner */}
        <div
          style={{
            borderRadius: 28,
            padding: "28px 32px",
            marginBottom: 36,
            background: "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
            color: "#FFF3B0",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <Noise />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#FFD98A", marginBottom: 8 }}>
              § Your crate
            </div>
            <h1 style={{ fontFamily: "'Fredoka', system-ui, sans-serif", fontWeight: 700, fontSize: 44, margin: 0, lineHeight: 1 }}>
              Your sets.
            </h1>
            <p style={{ margin: "10px 0 0", color: "#FFE3B0", fontSize: 15 }}>
              Everything you've built, ready to play.
            </p>
          </div>
          <div style={{ position: "relative", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/import" style={{ border: "1.5px solid #FFE3B0", color: "#FFF3B0", borderRadius: 999, padding: "10px 20px", fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none", transition: "background 140ms ease" }}>
              Import playlist
            </Link>
            <Link to="/vibe" style={{ background: "#FFF3B0", color: "#E4130C", borderRadius: 999, padding: "10px 22px", fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              + New set
            </Link>
          </div>
        </div>

        {/* Content */}
        {rows === null ? (
          <DJLoading label="loading your crate..." />
        ) : rows.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 32px",
              borderRadius: 24,
              border: "1.5px dashed rgba(228,19,12,0.22)",
              background: "#FFFCE0",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎛️</div>
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>No sets yet.</p>
            <p style={{ fontSize: 14, color: "#B4740A", marginBottom: 28 }}>
              Build a fresh set from a vibe brief, or import one of your existing Spotify playlists.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/vibe" className="zz-new-btn">Start vibe check</Link>
              <Link to="/import" className="zz-import-btn">Import from Spotify</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link to="/set/$id" params={{ id: r.id }} className="zz-set-row" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 20, color: "#E4130C" }}>
                    {r.name}
                  </span>
                  <span style={{ fontSize: 13, color: "#B4740A" }}>
                    {r.tracks?.length ?? 0} tracks · {r.brief?.eventType} · {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </Link>
                <button
                  className="zz-del-btn"
                  onClick={async () => {
                    const { error } = await supabase.from("playlists").delete().eq("id", r.id);
                    if (error) return toast.error(error.message);
                    setRows((rows ?? []).filter((x) => x.id !== r.id));
                    toast.success("Set deleted");
                  }}
                  title="Delete set"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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
        position: "absolute",
        inset: 0,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        opacity: 0.16,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
}
