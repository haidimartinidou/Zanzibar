import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ZanzibarPlant } from "@/components/ZanzibarPlant";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Zanzibar" },
      { name: "description", content: "Zanzibar is an AI co-DJ that reads the room and builds sets that actually move people." },
      { property: "og:title", content: "About Zanzibar" },
      { property: "og:description", content: "Meet the team behind the AI co-DJ that builds sets tuned to your crowd." },
    ],
  }),
});

function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFF6D8", color: "#7A1200", fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600&display=swap');
        @media (max-width: 700px) {
          .zz-about-hero { flex-direction: column !important; }
          .zz-about-grid { grid-template-columns: 1fr !important; }
          .zz-about-h1 { font-size: 42px !important; }
        }
      `}</style>

      <SiteHeader />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px 100px" }}>

        {/* Hero */}
        <div
          className="zz-about-hero"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
            marginBottom: 72,
            borderRadius: 32,
            background: "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
            padding: "48px 56px",
            color: "#FFF3B0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Noise />
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#FFD98A", marginBottom: 14 }}>
              § About us
            </div>
            <h1
              className="zz-about-h1"
              style={{
                fontFamily: "'Fredoka', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 58,
                lineHeight: 1.02,
                margin: "0 0 18px",
              }}
            >
              For the friend who always gets handed the aux.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "#FFE3B0", maxWidth: 520, margin: 0 }}>
              We built Zanzibar because every single one of us has been the friend with the aux at the wrong moment
              — and we got tired of pretending we had a plan.
            </p>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ZanzibarPlant energy={8} style={{ width: 180, height: "auto" }} />
          </div>
        </div>

        {/* Story cards */}
        <div
          className="zz-about-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 60 }}
        >
          {[
            {
              title: "You know that feeling",
              body: "Someone hands you the cable. \"You've got good taste — you're DJ tonight.\" Suddenly your brain, the same brain that grew up on Jimi Hendrix and knows every B-side worth knowing, can only produce one song: Macarena. At a charity event. That's not a good look.",
            },
            {
              title: "We're here for you",
              body: "Don't think of this as outsourcing because you're a bad DJ. You're not. You're under stage fright — and well, we're not. Zanzibar reads the room so you don't have to second-guess every transition while your aunt asks for \"something we can dance to.\"",
            },
            {
              title: "Who we are",
              body: "A small team in Greece who love good music a little too much and throw a few too many parties. We built Zanzibar because every single one of us has been the friend with the aux at the wrong moment, and we got tired of pretending we had a plan.",
            },
            {
              title: "Go have a drink",
              body: "Seriously. Pour yourself something nice. Later, you won't need it — the music will do the magic, and you'll get the credit. That's the deal.",
            },
          ].map(({ title, body }) => (
            <div
              key={title}
              style={{
                background: "#FFFCE0",
                border: "1.5px solid rgba(228,19,12,0.16)",
                borderRadius: 24,
                padding: "28px 28px 32px",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Fredoka', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: 24,
                  color: "#E4130C",
                  margin: "0 0 12px",
                }}
              >
                {title}
              </h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#7A1200" }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Manifesto */}
        <div
          style={{
            textAlign: "center",
            padding: "52px 32px",
            marginBottom: 24,
            borderRadius: 28,
            background: "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
            color: "#FFF3B0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Noise />
          <p
            style={{
              position: "relative",
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(22px, 4vw, 36px)",
              lineHeight: 1.35,
              margin: 0,
              letterSpacing: 0.2,
            }}
          >
            Zanzibar is a bar.<br />
            Have a drink.<br />
            We will play that funky music you imagine.
          </p>
        </div>

        {/* CTA */}
        <div
          style={{
            background: "#FFFCE0",
            border: "1.5px solid rgba(228,19,12,0.18)",
            borderRadius: 28,
            padding: "48px 40px",
            textAlign: "center",
            boxShadow: "0 24px 70px rgba(122,18,0,0.1)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 38,
              color: "#E4130C",
              margin: "0 0 12px",
            }}
          >
            Try it at your next thing.
          </h2>
          <p style={{ fontSize: 16, color: "#B4740A", margin: "0 0 32px" }}>
            Free to start. No credit card. No vibe killers.
          </p>
          <Link
            to="/vibe"
            style={{
              display: "inline-block",
              background: "#E4130C",
              color: "#FFF3B0",
              borderRadius: 999,
              padding: "14px 40px",
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 18,
              textDecoration: "none",
              boxShadow: "0 12px 32px rgba(228,19,12,0.28)",
            }}
          >
            Start a vibe check
          </Link>
        </div>
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
