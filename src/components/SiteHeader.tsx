import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HoloLogo } from "@/components/HoloLogo";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
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
    </>
  );
}
