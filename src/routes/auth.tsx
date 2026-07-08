import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/library" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: import.meta.env.VITE_SITE_URL || window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/library" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF6D8", color: "#7A1200", fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600&display=swap');
        .zz-auth-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid rgba(228,19,12,0.28);
          border-radius: 14px;
          background: #FFF6D8;
          color: #7A1200;
          font-family: 'Poppins', system-ui, sans-serif;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 160ms ease;
        }
        .zz-auth-input:focus { border-color: #E4130C; }
        .zz-auth-input::placeholder { color: rgba(122,18,0,0.4); }
        .zz-auth-submit {
          width: 100%;
          padding: 14px;
          background: #E4130C;
          color: #FFF3B0;
          border: none;
          border-radius: 999px;
          font-family: 'Fredoka', system-ui, sans-serif;
          font-weight: 700;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(228,19,12,0.24);
          transition: opacity 140ms ease;
        }
        .zz-auth-submit:hover:not(:disabled) { opacity: 0.88; }
        .zz-auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .zz-auth-toggle {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #B4740A;
          font-family: 'Poppins', system-ui, sans-serif;
          text-align: center;
          width: 100%;
          padding: 8px;
          transition: color 140ms ease;
        }
        .zz-auth-toggle:hover { color: #E4130C; }
      `}</style>

      <SiteHeader />

      <main style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Gradient badge */}
        <div
          style={{
            borderRadius: 28,
            padding: "32px 32px 28px",
            marginBottom: 32,
            background: "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
            color: "#FFF3B0",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Noise />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🎛️</div>
            <h1
              style={{
                fontFamily: "'Fredoka', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 32,
                margin: "0 0 8px",
              }}
            >
              {mode === "signin" ? "Welcome back." : "Join the booth."}
            </h1>
            <p style={{ margin: 0, color: "#FFE3B0", fontSize: 15 }}>
              {mode === "signin"
                ? "Pick up where you left off."
                : "Save your sets. Build the vibe."}
            </p>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={submit}
          style={{
            background: "#FFFCE0",
            border: "1.5px solid rgba(228,19,12,0.18)",
            borderRadius: 24,
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxShadow: "0 24px 70px rgba(122,18,0,0.12)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#7A1200", letterSpacing: 0.3 }}>
              Email
            </label>
            <input
              className="zz-auth-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#7A1200", letterSpacing: 0.3 }}>
              Password
            </label>
            <input
              className="zz-auth-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 characters or more"
            />
          </div>

          <button type="submit" disabled={loading} className="zz-auth-submit">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button type="button" className="zz-auth-toggle" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "No account? Sign up →" : "Already have one? Sign in →"}
          </button>
        </form>
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
