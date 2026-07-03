import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const marqueeItems = [
  "Read the room",
  "Drop the right track",
  "Smart cut-offs",
  "No 7-minute album cuts at peak",
  "Built in Thessaloniki",
  "For the friend with taste",
];

const methodSteps = [
  {
    tag: "01 · Brief",
    title: "Tell us the room.",
    body: "Five questions: event, crowd, energy, length, your taste. Takes a minute. We listen carefully.",
    placeholder: "brief screen",
  },
  {
    tag: "02 · Build",
    title: "We construct the set.",
    body: "An AI trained on the way rooms actually move stitches tracks across your library, with smart cut-offs baked in.",
    placeholder: "build screen",
  },
  {
    tag: "03 · Play",
    title: "Read the floor. Adjust live.",
    body: "Reorder, skip, drag a cut-off later, pause the set when speeches happen. The booth is yours.",
    placeholder: "live screen",
  },
];

const sets = [
  {
    label: "Set 01 · 94 min",
    name: "Sunset rooftop",
    meta: "102 to 118 BPM · Energy 6/10",
    tracks: [
      { cutoff: "", title: "Tiny Tropics", artist: "Yumeko", time: "2:08 / 5:42" },
      { cutoff: "", title: "Salt Water", artist: "Lia Beach", time: "3:01 / 4:18" },
      { cutoff: "", title: "Verano Holográfico", artist: "Cielo Roto", time: "2:20 / 6:55" },
      { cutoff: "✓", title: "Goldlight", artist: "Marais & Co.", time: "4:12 / 5:01" },
    ],
  },
  {
    label: "Set 02 · 78 min",
    name: "Warehouse 2AM",
    meta: "132 to 142 BPM · Energy 10/10",
    tracks: [
      { cutoff: "", title: "Acid Choir", artist: "Rotor 8", time: "1:48 / 6:12" },
      { cutoff: "", title: "Concrete Bloom", artist: "Vela & Kessel", time: "2:38 / 7:22" },
      { cutoff: "✓", title: "No Sleep Athens", artist: "NIKHTA", time: "3:50 / 5:48" },
      { cutoff: "", title: "Hammered Glass", artist: "Drift Order", time: "2:14 / 6:01" },
    ],
  },
];

const vibes = [
  { bpm: "96 to 118", name: "Sunset rooftop", desc: "Golden-hour house, downtempo grooves, easy BPM lift." },
  { bpm: "128 to 144", name: "Warehouse 2AM", desc: "Hard techno, acid lines, no-mercy four-on-the-floor." },
  { bpm: "82 to 104", name: "Dinner party", desc: "Bossa, jazz-funk, neo-soul. Conversation-friendly." },
  { bpm: "104 to 128", name: "Wedding floor", desc: "Crowd-pleasers across decades, tuned for all generations." },
  { bpm: "112 to 124", name: "Beach club", desc: "Melodic house, afro-beats, breezy summer anthems." },
  { bpm: "108 to 122", name: "Indie disco", desc: "Nu-disco, post-punk, glittery dance-rock singalongs." },
  { bpm: "85 to 100", name: "Hip-hop lounge", desc: "Boom-bap classics into modern trap, smooth rotations." },
  { bpm: "70 to 92", name: "Focus & flow", desc: "Lo-fi, ambient electronica, deep work without lyrics." },
  { bpm: "130 to 140", name: "Garage rave", desc: "UKG, bassline, 2-step. Fast feet, faster grins." },
];

const faqs = [
  {
    q: 'What exactly is a "smart cut-off"?',
    a: "Every track in your set gets its own play length tuned to crowd attention. Bangers might run 90 seconds; deep cuts get four minutes. The set always feels in motion.",
  },
  {
    q: "Do I need a Spotify account?",
    a: "Yes. We use Spotify for playback and library access. The vibe check works without it, but you will need to connect Spotify to actually play.",
  },
  {
    q: "Can I edit the set after Zanzibar builds it?",
    a: "Of course. You can reorder tracks, swap out songs, change cut-off times, pause the floor. The booth is yours.",
  },
  {
    q: "Will it just pick songs I already know?",
    a: "Zanzibar mixes your tastes with the vibe brief. Expect mostly familiar territory with a steady drip of discoveries that fit the room.",
  },
  {
    q: "Is this for actual DJs?",
    a: "It is for anyone holding the aux. Real DJs can use it for fast warm-up sets. Everyone else can use it to look like a real DJ.",
  },
  {
    q: "What does it cost?",
    a: "Free to build your first sets. A host plan can come later for residencies and bigger events.",
  },
];

const footerCols = [
  { title: "Product", links: ["Vibe library", "Example sets", "How it works", "Pricing"] },
  { title: "Company", links: ["About", "Team", "Thessaloniki", "Contact"] },
  { title: "Legal", links: ["Terms", "Privacy", "Cookies", "DMCA"] },
];

function HomePage() {
  return (
    <main
      style={{
        fontFamily: "'Poppins', system-ui, sans-serif",
        background: "#FFF6D8",
        color: "#7A1200",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap');

        @keyframes zz-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (max-width: 800px) {
          .zz-nav {
            padding: 24px !important;
          }

          .zz-hero {
            padding: 44px 24px 88px !important;
          }

          .zz-hero h1 {
            font-size: 58px !important;
          }

          .zz-section {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }

          .zz-grid {
            grid-template-columns: 1fr !important;
          }

          .zz-stats {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 24px !important;
          }

          .zz-final-buttons {
            flex-direction: column !important;
          }
        }
      `}</style>

      <header
        style={{
          position: "relative",
          background:
            "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
          overflow: "hidden",
        }}
      >
        <Noise />

        <nav
          className="zz-nav"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "32px 64px",
          }}
        >
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: "#FFF3B0",
              letterSpacing: 0.5,
            }}
          >
            Zanzibar
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontSize: 15,
              fontWeight: 500,
              color: "#FFEFAE",
            }}
          >
            <a href="#about" style={{ color: "inherit", textDecoration: "none" }}>
              About
            </a>
            <Link
              to="/auth"
              style={{
                border: "1.5px solid #FFEFAE",
                borderRadius: 999,
                padding: "9px 22px",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </div>
        </nav>

        <div className="zz-hero" style={{ position: "relative", padding: "60px 64px 120px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 28,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 1,
              color: "#FFD98A",
              textTransform: "uppercase",
              flexWrap: "wrap",
            }}
          >
            <span>AI co-DJ is live · Summer 2026</span>
            <span style={{ width: 44, height: 1.5, background: "#FFD98A", display: "inline-block" }} />
            <span>Made by people with taste · Issue 01</span>
          </div>

          <h1
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              fontSize: 96,
              lineHeight: 0.98,
              color: "#FFF3B0",
              margin: "0 0 32px",
              maxWidth: 900,
            }}
          >
            Auxmaster, au-ficially.
          </h1>

          <p
            style={{
              fontSize: 19,
              lineHeight: 1.6,
              color: "#FFE3B0",
              maxWidth: 560,
              margin: "0 0 48px",
            }}
          >
            Zanzibar is an AI co-DJ for everyone with good taste and stage fright. Brief us on the room.
            We&apos;ll hand you a set that lands.
          </p>

          <div className="zz-stats" style={{ display: "flex", alignItems: "center", gap: 64, marginBottom: 48 }}>
            <Stat number="14,212" label="Sets built this week" />
            <Stat number="92%" label="Avg. floor retention" />
          </div>

          <Link
            to="/vibe"
            style={{
              display: "inline-block",
              background: "#FFF3B0",
              color: "#E4130C",
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600,
              fontSize: 18,
              padding: "18px 40px",
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            Start vibe check
          </Link>
        </div>
      </header>

      <div style={{ background: "#E4130C", padding: "16px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", animation: "zz-marquee 26s linear infinite" }}>
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span
              key={`${item}-${index}`}
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 600,
                fontSize: 20,
                color: "#FFF3B0",
                padding: "0 22px",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {item} ✺
            </span>
          ))}
        </div>
      </div>

      <section className="zz-section" style={{ background: "#F5EA3D", padding: "110px 64px" }}>
        <SectionKicker>§ 02 · THE METHOD</SectionKicker>
        <SectionTitle>From brief to banger in three moves.</SectionTitle>

        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          {methodSteps.map((step) => (
            <div key={step.title} style={{ flex: 1, minWidth: 280 }}>
              <PreviewCard label={step.placeholder} />
              <div
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#B4740A",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                {step.tag}
              </div>
              <h3
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: 24,
                  color: "#E4130C",
                  margin: "0 0 10px",
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#B4740A", margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="zz-section" style={{ background: "#F5EA3D", padding: "0 64px 110px" }}>
        <SectionKicker>§ 03 · THE RECEIPTS</SectionKicker>
        <SectionTitle>Real sets, real cut-offs, real floors.</SectionTitle>
        <p style={{ fontSize: 16, color: "#B4740A", maxWidth: 620, margin: "0 0 56px" }}>
          The mark is where Zanzibar cuts the track. Less album-cut indulgence, more dancefloor momentum.
        </p>

        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          {sets.map((set) => (
            <div
              key={set.name}
              style={{
                flex: 1,
                minWidth: 320,
                background: "#FFFCE0",
                borderRadius: 8,
                padding: 32,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#B4740A",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                {set.label}
              </div>
              <h3
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: 26,
                  color: "#E4130C",
                  margin: "0 0 6px",
                }}
              >
                {set.name}
              </h3>
              <div style={{ fontSize: 14, color: "#B4740A", marginBottom: 24 }}>{set.meta}</div>

              {set.tracks.map((track) => (
                <div
                  key={`${track.title}-${track.artist}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: "1px solid #F0E4A0",
                    fontSize: 14,
                    color: "#7A1200",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ width: 18, color: "#E4130C" }}>{track.cutoff}</span>
                    <strong>{track.title}</strong>
                    <span style={{ color: "#B4740A" }}>{track.artist}</span>
                  </div>
                  <span style={{ color: "#B4740A", whiteSpace: "nowrap" }}>{track.time}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="zz-section" style={{ background: "#F5EA3D", padding: "0 64px 120px" }}>
        <SectionKicker>§ 04 · THE VIBE LIBRARY</SectionKicker>
        <SectionTitle>Pick a mood. We&apos;ll handle the rest.</SectionTitle>

        <div className="zz-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
          {vibes.map((vibe) => (
            <div key={vibe.name} style={{ background: "#FFFCE0", borderRadius: 8, padding: 26 }}>
              <div
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#B4740A",
                  marginBottom: 10,
                }}
              >
                {vibe.bpm} BPM
              </div>
              <h3
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: 21,
                  color: "#E4130C",
                  margin: "0 0 8px",
                }}
              >
                {vibe.name}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "#B4740A", margin: 0 }}>{vibe.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="about"
        className="zz-section"
        style={{
          position: "relative",
          background:
            "radial-gradient(120% 100% at 75% 0%, #FF7FE0 0%, #E23BD8 30%, #B21FC2 60%, #6E12A8 100%)",
          padding: "130px 64px 110px",
          overflow: "hidden",
        }}
      >
        <Noise />

        <div
          style={{
            position: "absolute",
            top: 44,
            right: 64,
            width: 56,
            height: 56,
            border: "1.5px solid #FFF3B0",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFF3B0",
            fontSize: 22,
          }}
        >
          ✕
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#FFD1F5", letterSpacing: 1, marginBottom: 20 }}>
            § 05 · ABOUT US
          </div>
          <h2
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              fontSize: 48,
              lineHeight: 1.15,
              color: "#FFF3B0",
              margin: "0 0 32px",
              maxWidth: 760,
            }}
          >
            For the friend who always gets handed the aux.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "#FFE0FA", maxWidth: 620, margin: "0 0 20px" }}>
            You&apos;ve got the taste. You grew up on Hendrix and know every B-side worth knowing. The cable
            lands in your hand, the room turns, and your brain produces... Macarena. At a charity event.
            We get it.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "#FFE0FA", maxWidth: 620, margin: "0 0 48px" }}>
            Zanzibar reads the room so your taste lands on time. We&apos;re a small team in Thessaloniki, and
            we&apos;ve all been the friend with the aux at the wrong moment one too many times.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 6,
                background:
                  "repeating-linear-gradient(135deg,#FFE0FA,#FFE0FA 10px,#F7C6F0 10px,#F7C6F0 20px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  color: "#8A1F92",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                ZZ plant
                <br />
                photo
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#FFD1F5", letterSpacing: 0.5 }}>
              Energy meter · <em>Zamioculcas zamiifolia</em>
            </div>
          </div>
        </div>
      </section>

      <section className="zz-section" style={{ background: "#FFFCE0", padding: "110px 64px" }}>
        <SectionKicker>§ 06 · FAQ</SectionKicker>
        <SectionTitle>Six questions, six answers.</SectionTitle>

        <div style={{ maxWidth: 760 }}>
          {faqs.map((faq) => (
            <details key={faq.q} style={{ borderBottom: "1.5px solid #F0DFA0", padding: "24px 0" }}>
              <summary
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: 19,
                  color: "#E4130C",
                  cursor: "pointer",
                }}
              >
                {faq.q}
              </summary>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#B4740A", marginTop: 14, maxWidth: 620 }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="zz-section"
        style={{
          position: "relative",
          background:
            "radial-gradient(120% 100% at 30% 100%, #FF7FE0 0%, #E23BD8 30%, #B21FC2 62%, #6E12A8 100%)",
          padding: "130px 64px 100px",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <Noise />

        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#FFD1F5",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Free to start · No card · No vibe killers
          </div>
          <h2
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              fontSize: 60,
              lineHeight: 1.1,
              color: "#FFF3B0",
              margin: "0 0 24px",
            }}
          >
            Your turn at the booth.
          </h2>
          <p style={{ fontSize: 18, color: "#FFE0FA", margin: "0 0 48px" }}>
            Five questions. One brutally good set. Less than a minute to start.
          </p>
          <div className="zz-final-buttons" style={{ display: "inline-flex", gap: 20 }}>
            <Link
              to="/vibe"
              style={{
                background: "#FFF3B0",
                color: "#B21FC2",
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 600,
                fontSize: 17,
                padding: "16px 36px",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              Start vibe check
            </Link>
            <a
              href="#receipts"
              style={{
                border: "1.5px solid #FFF3B0",
                color: "#FFF3B0",
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 600,
                fontSize: 17,
                padding: "16px 36px",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              Hear an example set
            </a>
          </div>
        </div>
      </section>

      <footer style={{ background: "#4A0E5C", padding: "70px 64px 36px", color: "#F4D6F5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 48, marginBottom: 56 }}>
          <div style={{ maxWidth: 320 }}>
            <div
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700,
                fontSize: 24,
                color: "#FFF3B0",
                marginBottom: 14,
              }}
            >
              Zanzibar
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#D9A8DC", margin: 0 }}>
              AI co-DJ for everyone with good taste and a bit of stage fright. Built in Thessaloniki with
              love and too much retsina.
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#FFF3B0",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 16,
                }}
              >
                {col.title}
              </div>
              {col.links.map((link) => (
                <div key={link} style={{ fontSize: 14, color: "#D9A8DC", marginBottom: 10 }}>
                  {link}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            paddingTop: 28,
            borderTop: "1px solid #6E2D80",
            fontSize: 13,
            color: "#B87CBB",
          }}
        >
          <span>© 2026 Zanzibar Audio · Thessaloniki, Greece</span>
          <span>★ Made for the friend with taste</span>
        </div>
      </footer>
    </main>
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

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 44,
          fontWeight: 700,
          color: "#FFF3B0",
        }}
      >
        {number}
      </div>
      <div style={{ fontSize: 13, color: "#FFD98A", textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </div>
    </div>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 600, color: "#E4130C", letterSpacing: 1, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Fredoka', sans-serif",
        fontWeight: 700,
        fontSize: 52,
        color: "#E4130C",
        margin: "0 0 56px",
        maxWidth: 820,
      }}
    >
      {children}
    </h2>
  );
}

function PreviewCard({ label }: { label: string }) {
  return (
    <div
      style={{
        background: "repeating-linear-gradient(135deg,#FFFCE0,#FFFCE0 10px,#FFF3B0 10px,#FFF3B0 20px)",
        borderRadius: 4,
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 22,
      }}
    >
      <span style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: "#B4740A" }}>{label}</span>
    </div>
  );
}