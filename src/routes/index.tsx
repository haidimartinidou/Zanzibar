import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ZanzibarPlant } from "@/components/ZanzibarPlant";
import { HoloVisual } from "@/components/HoloVisual";
import {
  ArrowRight, Sunset, Zap, Wine, Gem, Palmtree, Disc3,
  Mic2, Brain, Waves,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Zanzibar — Read the room. Drop the right track." },
      { name: "description", content: "Answer 5 questions. Get a curated DJ set with intelligent cut-off times that keep the dancefloor packed." },
    ],
  }),
});

// ─── Data ────────────────────────────────────────────────────────────────────

const VIBES = [
  { name: "Sunset rooftop",  Icon: Sunset,  desc: "Golden-hour house, downtempo grooves, easy BPM lift.",         bpm: "96–118",  tint: "orange" },
  { name: "Warehouse 2AM",   Icon: Zap,     desc: "Hard techno, acid lines, no-mercy four-on-the-floor.",        bpm: "128–144", tint: "magenta" },
  { name: "Dinner party",    Icon: Wine,    desc: "Bossa, jazz-funk, neo-soul. Conversation-friendly.",          bpm: "82–104",  tint: "orange" },
  { name: "Wedding floor",   Icon: Gem,     desc: "Crowd-pleasers across decades, tuned for all generations.",   bpm: "104–128", tint: "lime" },
  { name: "Beach club",      Icon: Palmtree,desc: "Melodic house, afro-beats, breezy summer anthems.",           bpm: "112–124", tint: "orange" },
  { name: "Indie disco",     Icon: Disc3,   desc: "Nu-disco, post-punk, glittery dance-rock singalongs.",        bpm: "108–122", tint: "magenta" },
  { name: "Hip-hop lounge",  Icon: Mic2,    desc: "Boom-bap classics into modern trap, smooth rotations.",       bpm: "85–100",  tint: "lime" },
  { name: "Focus & flow",    Icon: Brain,   desc: "Lo-fi, ambient electronica, deep work without lyrics.",       bpm: "70–92",   tint: "blue" },
  { name: "Garage rave",     Icon: Waves,   desc: "UKG, bassline, 2-step. Fast feet, faster grins.",             bpm: "130–140", tint: "magenta" },
];

const EXAMPLE_SETS = [
  {
    vibe: "Sunset rooftop", bpm: "102 — 118", duration: "94 min", energy: 6, accent: "orange",
    tracks: [
      { t: "Tiny Tropics",        a: "Yumeko",        full: "5:42", cut: "2:08" },
      { t: "Salt Water",          a: "Lia Beach",      full: "4:18", cut: "3:01" },
      { t: "Verano Holográfico",  a: "Cielo Roto",     full: "6:55", cut: "2:20" },
      { t: "Goldlight",           a: "Marais & Co.",   full: "5:01", cut: "4:12" },
      { t: "Pier 7 (Edit)",       a: "Other Brother",  full: "7:30", cut: "3:05" },
      { t: "Slow Citrus",         a: "Andros",         full: "4:48", cut: "4:48" },
    ],
  },
  {
    vibe: "Warehouse 2AM", bpm: "132 — 142", duration: "78 min", energy: 10, accent: "magenta",
    tracks: [
      { t: "Acid Choir",      a: "Rotor 8",          full: "6:12", cut: "1:48" },
      { t: "Concrete Bloom",  a: "Vela & Kessel",    full: "7:22", cut: "2:38" },
      { t: "No Sleep Athens", a: "NIKHTA",           full: "5:48", cut: "3:50" },
      { t: "Hammered Glass",  a: "Drift Order",      full: "6:01", cut: "2:14" },
      { t: "Iron Pulse",      a: "Lampros / Frame",  full: "5:35", cut: "2:55" },
      { t: "Last Train Out",  a: "KORA",             full: "4:48", cut: "4:48" },
    ],
  },
];

const FAQ_ITEMS = [
  { q: 'What exactly is a "smart cut-off"?',
    a: "Every track in your set gets its own play length tuned to crowd attention. Bangers might run 90 seconds; deep cuts get four minutes. The set always feels in motion." },
  { q: "Do I need a Spotify account?",
    a: "Yes — we use Spotify for playback and library access. The vibe check works without it, but you'll need to connect Spotify to actually play." },
  { q: "Can I edit the set after Zanzibar builds it?",
    a: "Of course. You can reorder tracks, swap out songs, change cut-off times, pause the floor — the booth is yours." },
  { q: "Will it just pick songs I already know?",
    a: "Zanzibar mixes your tastes with the vibe brief. Expect 60–70% in your wheelhouse and a steady drip of discoveries that fit the room." },
  { q: "Is this for actual DJs?",
    a: "It's for anyone holding the aux. Real DJs use it for fast warm-up sets; everyone else uses it to look like a real DJ." },
  { q: "What does it cost?",
    a: "Free to build your first sets. We'll roll out a host plan later for residencies and bigger events." },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSec(m: string) {
  const [mm, ss] = m.split(":").map(Number);
  return mm * 60 + ss;
}

function tintClass(t: string) {
  if (t === "magenta") return { icon: "text-[oklch(0.66_0.24_340)]", border: "border-[oklch(0.66_0.24_340/0.4)]", bg: "bg-[oklch(0.66_0.24_340/0.12)]" };
  if (t === "lime")    return { icon: "text-lime",                   border: "border-lime/40",                    bg: "bg-lime/10" };
  if (t === "blue")    return { icon: "text-accent",                 border: "border-accent/40",                  bg: "bg-accent/10" };
  return                       { icon: "text-primary",               border: "border-primary/40",                 bg: "bg-primary/10" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-jetbrains text-[11px] uppercase tracking-[0.12em] text-muted-foreground ${className}`}>
      {children}
    </span>
  );
}

function LiveDot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_10px_var(--lime)] animate-dot-pulse" />;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-0 pt-16 md:pt-24">
      {/* Vertical label */}
      <div className="absolute left-4 top-24 hidden flex-col items-center gap-3 md:flex">
        <span className="font-jetbrains text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60 [writing-mode:vertical-rl] [transform:rotate(180deg)]">
          No. 01 — The Aux Issue
        </span>
        <div className="h-24 w-px bg-border" />
      </div>

      <div className="container mx-auto px-4 md:px-8">
        {/* Meta bar */}
        <div className="mb-10 flex items-center justify-between gap-4">
          <Chip><LiveDot /> AI co-DJ is live · Summer 2026</Chip>
          <span className="hidden font-jetbrains text-[11px] uppercase tracking-[0.18em] text-muted-foreground/50 md:block">
            Made by people with taste · Issue 01
          </span>
        </div>

        {/* Mega headline */}
        <div className="relative">
          <h1
            className="font-display font-black leading-[0.88] tracking-[-0.045em]"
            style={{ fontSize: "clamp(52px, 11vw, 164px)" }}
          >
            <span className="block">Aux</span>
            <span className="block pl-[6vw] text-gradient-sunset">master,</span>
            <span className="block">
              {/* inline holo dot */}
              <span
                className="mr-[2vw] inline-block rounded-full bg-gradient-sunset align-middle shadow-[0_0_0_8px_oklch(0.78_0.18_55/0.12)]"
                style={{ width: "0.9em", height: "0.9em", position: "relative" }}
              >
                <span className="absolute inset-[25%] rounded-full bg-background shadow-[0_0_0_2px_var(--lime)_inset]" />
              </span>
              au-
            </span>
            <span className="block text-lime">ficially.</span>
          </h1>

          {/* Right rail — hidden on mobile */}
          <div className="absolute right-0 top-0 hidden max-w-[260px] flex-col items-end gap-4 md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/45 bg-lime/14 px-2.5 py-1 font-jetbrains text-[11px] uppercase tracking-[0.08em] text-lime">
              ★ Built in Thessaloniki
            </span>
            <p className="text-right text-sm leading-relaxed text-muted-foreground">
              Five questions. One brutally good setlist. Cut-offs that keep the floor on its feet, not on its phone.
            </p>
            <Link to="/vibe">
              <button className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 font-display text-[13px] font-bold tracking-tight text-background shadow-lime transition hover:-translate-y-px hover:shadow-lime-hover">
                Start vibe check <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Stats footer */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr_1fr] md:items-end">
          <p className="max-w-xl text-lg leading-relaxed">
            Zanzibar is an <span className="font-semibold text-lime">AI co-DJ</span> for everyone with good taste and stage fright. Brief us on the room. We'll hand you a set that lands.
          </p>
          <div>
            <p className="mb-1 font-jetbrains text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">Sets built this week</p>
            <p className="font-display text-[clamp(40px,6vw,80px)] font-black leading-none tracking-tight text-gradient-sunset">14,212</p>
          </div>
          <div>
            <p className="mb-1 font-jetbrains text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">Avg. floor retention</p>
            <p className="font-display text-[clamp(40px,6vw,80px)] font-black leading-none tracking-tight text-lime">92%</p>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 md:hidden">
          <Link to="/vibe">
            <button className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 font-display text-sm font-bold text-background shadow-lime">
              Start vibe check <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Holo disc — desktop right panel uses it via HoloVisual */}
        <div className="mt-12 md:hidden">
          <HoloVisual />
        </div>
      </div>
    </section>
  );
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

function MarqueeStrip() {
  const words = ["Read the room", "Drop the right track", "Smart cut-offs", "No 7-minute album cuts at peak", "Built in Thessaloniki", "For the friend with taste"];
  const items = words.flatMap((w, i) => [
    <span key={`w-${i}`}>{w}</span>,
    <span key={`s-${i}`} className="mx-6 text-lime">✺</span>,
  ]);
  return (
    <div className="mt-16 overflow-hidden border-b border-t border-border py-4">
      <div className="flex animate-marquee whitespace-nowrap font-display text-[clamp(24px,4vw,48px)] font-extrabold tracking-tight">
        {items}{items}
      </div>
    </div>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function BriefArt() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between font-jetbrains text-[11px] text-muted-foreground">
        <span className="text-lime">›  prompt</span><span>Q 03 / 05</span>
      </div>
      <p className="mb-3 font-display text-[17px] font-bold leading-snug">Where does the energy peak?</p>
      {["Early — slow climb", "Mid-set — long plateau", "Late — knockout finale", "All-killer"].map((o, i) => (
        <div key={i} className={`mb-1.5 rounded-xl px-3 py-2 text-[12px] border ${i === 2 ? "bg-lime/16 text-lime border-lime/50" : "bg-muted/40 text-muted-foreground border-border/40"}`}>
          {i === 2 ? "✓ " : ""}{o}
        </div>
      ))}
    </div>
  );
}

function BuildArt() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">
      <p className="mb-3 font-jetbrains text-[11px] text-muted-foreground/60">BUILDING SET ····</p>
      <div className="flex h-24 items-end gap-[3px]">
        {Array.from({ length: 36 }).map((_, i) => {
          const h = 12 + Math.abs(Math.sin(i * 0.7) * 56) + Math.abs(Math.cos(i * 0.3) * 28);
          const col = i % 7 === 0 ? "bg-lime" : i < 14 ? "bg-primary" : i < 26 ? "bg-[oklch(0.66_0.24_340)]" : "bg-accent";
          return <div key={i} className={`flex-1 rounded-sm opacity-85 ${col}`} style={{ height: h }} />;
        })}
      </div>
      <div className="mt-3 flex justify-between font-jetbrains text-[11px]">
        <span className="text-muted-foreground">BPM trajectory</span>
        <span className="text-lime">32 tracks · 94 min</span>
      </div>
    </div>
  );
}

function PlayArt() {
  const rows = [
    { t: "Acid Choir",     a: "Rotor 8",       pct: 38, playing: true },
    { t: "Concrete Bloom", a: "Vela & Kessel",  pct: 0,  next: true },
    { t: "No Sleep Athens",a: "NIKHTA",         pct: 0 },
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">
      <p className="mb-3 font-jetbrains text-[11px] text-muted-foreground/60">LIVE — TAP TO REROUTE</p>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-border/40 py-2.5 first:border-t-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm border ${r.next ? "bg-lime/18 text-lime border-lime" : "bg-muted/60 text-muted-foreground border-border/40"}`}>
            {i === 0 ? "▶" : i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold">{r.t}</p>
            <p className="text-xs text-muted-foreground">{r.a}</p>
          </div>
          {r.playing && (
            <div className="relative h-1 w-14 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 bg-gradient-sunset" style={{ width: `${r.pct}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", label: "Brief", title: "Tell us the room.", body: "Five questions: event, crowd, energy, length, your taste. Takes a minute. We listen carefully.", Art: BriefArt },
    { n: "02", label: "Build", title: "We construct the set.", body: "An AI trained on the way rooms actually move stitches tracks across your library, with smart cut-offs baked in.", Art: BuildArt },
    { n: "03", label: "Play", title: "Read the floor. Adjust live.", body: "Reorder, skip, drag a cut-off later, pause the set when speeches happen. The booth is yours.", Art: PlayArt },
  ];
  return (
    <section className="border-b border-t border-border py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12">
          <div className="mb-3 flex items-baseline gap-4">
            <span className="font-jetbrains text-[12px] tracking-[0.22em] text-lime">§ 02</span>
            <span className="font-jetbrains text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60">The method</span>
          </div>
          <h2 className="font-display text-[clamp(32px,5vw,72px)] font-extrabold leading-[0.96] tracking-tight">
            From brief to <span className="text-gradient-sunset">banger</span> in <span className="text-lime">three moves</span>.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between border-t border-lime pt-4">
                <span className="font-display text-[clamp(52px,8vw,112px)] font-black leading-none tracking-tighter">{s.n}</span>
                <span className="font-jetbrains text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60">{s.label}</span>
              </div>
              <s.Art />
              <h3 className="font-display text-[22px] font-bold leading-tight tracking-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Example sets ─────────────────────────────────────────────────────────────

function TrackRow({ idx, t, a, full, cut }: { idx: number; t: string; a: string; full: string; cut: string }) {
  const pct = Math.min(100, (toSec(cut) / toSec(full)) * 100);
  return (
    <div className="grid items-center gap-3.5 border-t border-border/40 py-2.5 first:border-t-0" style={{ gridTemplateColumns: "28px 1fr 64px" }}>
      <span className="font-jetbrains text-[11px] text-muted-foreground/60">{String(idx).padStart(2, "0")}</span>
      <div>
        <p className="text-sm font-semibold leading-tight">{t}</p>
        <p className="text-xs text-muted-foreground">{a}</p>
        <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="absolute inset-y-0 left-0 bg-gradient-sunset" style={{ width: `${pct}%` }} />
          {pct < 99 && (
            <div className="absolute inset-y-0 w-0.5 bg-lime shadow-[0_0_8px_var(--lime)]" style={{ left: `${pct}%` }} />
          )}
        </div>
      </div>
      <div className="text-right font-jetbrains text-[11px]">
        <span className="text-lime">{cut}</span>
        <span className="text-muted-foreground/50"> / {full}</span>
      </div>
    </div>
  );
}

function SetCard({ set, idx }: { set: typeof EXAMPLE_SETS[0]; idx: number }) {
  const glow = set.accent === "magenta"
    ? "bg-[oklch(0.66_0.24_340)]"
    : "bg-primary";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur shadow-card">
      <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20 blur-3xl ${glow}`} />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1.5 font-jetbrains text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
              Set {String(idx + 1).padStart(2, "0")} · {set.duration}
            </p>
            <h3 className="font-display text-[28px] font-bold leading-tight tracking-tight">{set.vibe}</h3>
            <div className="mt-1.5 flex items-center gap-2 font-jetbrains text-[12px]">
              <span className="text-muted-foreground">{set.bpm} BPM</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-lime">Energy {set.energy}/10</span>
            </div>
          </div>
          <Link to="/vibe">
            <button className="rounded-full border border-border px-4 py-2 text-sm transition hover:border-lime hover:text-lime">
              ▶ Hear it
            </button>
          </Link>
        </div>
        <div>
          {set.tracks.map((t, i) => <TrackRow key={i} idx={i + 1} {...t} />)}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <p className="font-jetbrains text-[11px] text-muted-foreground/50">
            <span className="text-lime">—</span> marks the cut-off
          </p>
          <Link to="/vibe" className="font-jetbrains text-[12px] uppercase tracking-[0.16em] text-lime hover:underline">
            Build this vibe →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ExampleSets() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <div className="mb-3 flex items-baseline gap-4">
              <span className="font-jetbrains text-[12px] tracking-[0.22em] text-lime">§ 03</span>
              <span className="font-jetbrains text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60">The receipts</span>
            </div>
            <h2 className="font-display text-[clamp(32px,5vw,72px)] font-extrabold leading-[0.96] tracking-tight">
              Real sets, <span className="text-lime">real cut-offs</span>, real floors.
            </h2>
          </div>
          <p className="text-[17px] leading-relaxed text-muted-foreground md:justify-self-end md:max-w-sm">
            The green tick is where Zanzibar cuts the track. Less album-cut indulgence, more dancefloor momentum.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {EXAMPLE_SETS.map((set, i) => <SetCard key={set.vibe} set={set} idx={i} />)}
        </div>
      </div>
    </section>
  );
}

// ─── Vibe library ─────────────────────────────────────────────────────────────

function VibeCard({ name, desc, Icon, bpm, tint, feature }: {
  name: string; desc: string; Icon: React.ComponentType<{ className?: string }>;
  bpm: string; tint: string; feature?: boolean;
}) {
  const { icon, border, bg } = tintClass(tint);
  return (
    <Link to="/vibe" className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur transition hover:-translate-y-0.5 hover:border-lime shadow-card ${feature ? "row-span-2 p-6" : "p-5"}`}>
      {feature && <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-sunset opacity-25 blur-3xl" />}
      <div className="relative flex items-start justify-between">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${border} ${bg} ${icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-jetbrains text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">{bpm}</span>
      </div>
      <div className={`relative ${feature ? "mt-14" : "mt-4"}`}>
        <h3 className={`font-display font-bold leading-tight tracking-tight ${feature ? "text-3xl" : "text-[18px]"}`}>{name}</h3>
        <p className={`mt-1.5 leading-snug text-muted-foreground ${feature ? "text-[15px]" : "text-[13px]"}`}>{desc}</p>
      </div>
    </Link>
  );
}

function VibeLibrary() {
  return (
    <section className="border-t border-border py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12">
          <div className="mb-3 flex items-baseline gap-4">
            <span className="font-jetbrains text-[12px] tracking-[0.22em] text-lime">§ 04</span>
            <span className="font-jetbrains text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60">The vibe library</span>
          </div>
          <h2 className="font-display text-[clamp(32px,5vw,72px)] font-extrabold leading-[0.96] tracking-tight">
            Pick a mood. <span className="text-lime">We'll handle the rest.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Nine starting points, each tuned by hand. Or write your own — the brief is just five questions away.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3" style={{ gridAutoRows: "minmax(180px, auto)" }}>
          <VibeCard {...VIBES[0]} feature />
          {VIBES.slice(1).map((v) => <VibeCard key={v.name} {...v} />)}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/vibe">
            <button className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:border-lime hover:text-lime">
              Build your own vibe <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section className="border-t border-border py-20">
      <div className="container mx-auto grid gap-16 px-4 md:grid-cols-2 md:items-center md:px-8">
        <div>
          <div className="mb-3 flex items-baseline gap-4">
            <span className="font-jetbrains text-[12px] tracking-[0.22em] text-lime">§ 05</span>
            <span className="font-jetbrains text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60">About us</span>
          </div>
          <h2 className="font-display text-[clamp(36px,5.5vw,80px)] font-extrabold leading-[0.95] tracking-tight">
            For the friend who always gets handed <span className="text-gradient-sunset">the aux</span>.
          </h2>
          <div className="mt-8 grid gap-5">
            <p className="max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              You've got the taste. You grew up on Hendrix and you know every B-side worth knowing. The cable lands in your hand, the room turns, and your brain produces… Macarena. At a charity event. We get it.
            </p>
            <p className="max-w-lg text-[17px] leading-relaxed">
              Zanzibar reads the room so your taste lands on time. We're a small team in Thessaloniki, and we've all been the friend with the aux at the wrong moment one too many times.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/vibe">
                <button className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 font-display text-[13px] font-bold text-background shadow-lime transition hover:-translate-y-px hover:shadow-lime-hover">
                  Start a vibe check <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link to="/about">
                <button className="rounded-full border border-border px-5 py-3 font-display text-[13px] font-bold transition hover:border-lime hover:text-lime">
                  Meet the team
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[420px] items-center justify-center">
          {/* Big pull-quote shadow */}
          <div
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display font-black leading-[0.8] tracking-tighter opacity-20"
            style={{ fontSize: "clamp(100px,18vw,260px)", color: "oklch(0.30 0.07 270)" }}
          >
            ""
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <ZanzibarPlant energy={9} className="w-64" />
            <p className="font-jetbrains text-[10px] uppercase tracking-[0.22em] text-muted-foreground/50">
              Energy meter — Zamioculcas zamiifolia
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQSection() {
  return (
    <section className="border-t border-border py-20">
      <div className="container mx-auto grid gap-16 px-4 md:grid-cols-[1fr_1.4fr] md:px-8">
        <div>
          <div className="mb-3 flex items-baseline gap-4">
            <span className="font-jetbrains text-[12px] tracking-[0.22em] text-lime">§ 06</span>
            <span className="font-jetbrains text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60">FAQ</span>
          </div>
          <h2 className="font-display text-[clamp(32px,4.5vw,60px)] font-extrabold leading-[0.95] tracking-tight">
            Six questions, <span className="text-lime">six answers.</span>
          </h2>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
            More? Drop us a line. We respond between sets.
          </p>
          <a
            href="mailto:hello@zanzibar.fm"
            className="mt-5 inline-block border-b border-lime pb-0.5 font-jetbrains text-[12px] uppercase tracking-[0.18em] text-lime hover:opacity-80"
          >
            hello@zanzibar.fm →
          </a>
        </div>

        <div>
          {FAQ_ITEMS.map((f, i) => (
            <details key={i} className="faq-item border-t border-border py-5 first:border-t-0">
              <summary className="flex items-baseline justify-between gap-6">
                <span className="flex items-baseline gap-4">
                  <span className="font-jetbrains text-[13px] text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[clamp(18px,2vw,26px)] font-bold leading-snug tracking-tight">{f.q}</span>
                </span>
                <span className="faq-toggle flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-border font-jetbrains text-base text-muted-foreground transition-all duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Closer ───────────────────────────────────────────────────────────────────

function Closer() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-16 text-center backdrop-blur shadow-card">
          <div className="absolute inset-0 bg-gradient-sunset opacity-[0.15]" />
          <div className="absolute left-1/2 -top-24 h-64 w-[500px] -translate-x-1/2 rounded-full bg-lime opacity-[0.14] blur-3xl" />
          <div className="relative">
            <Chip className="mx-auto"><LiveDot /> Free to start · No card · No vibe killers</Chip>
            <h2 className="mt-6 font-display text-[clamp(44px,8vw,116px)] font-black leading-[0.92] tracking-[-0.035em]">
              Your turn at the booth.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              Five questions. One brutally good set. Less than a minute to start.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/vibe">
                <button className="inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 font-display text-[15px] font-bold text-background shadow-lime transition hover:-translate-y-px hover:shadow-lime-hover">
                  Start vibe check <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link to="/library">
                <button className="rounded-full border border-border px-7 py-4 font-display text-[15px] font-bold transition hover:border-lime hover:text-lime">
                  Hear an example set
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="border-t border-border pb-16 pt-12">
      <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <p className="mb-3 font-display text-xl font-extrabold text-gradient-sunset">Zanzibar</p>
          <p className="max-w-[260px] text-sm leading-relaxed text-muted-foreground">
            AI co-DJ for everyone with good taste and a bit of stage fright. Built in Thessaloniki with love and too much retsina.
          </p>
        </div>
        {[
          { h: "Product", links: ["Vibe library", "Example sets", "How it works", "Pricing"] },
          { h: "Company", links: ["About", "Team", "Thessaloniki", "Contact"] },
          { h: "Legal",   links: ["Terms", "Privacy", "Cookies", "DMCA"] },
        ].map((col) => (
          <div key={col.h}>
            <p className="mb-3 font-jetbrains text-[11px] uppercase tracking-[0.22em] text-muted-foreground/50">{col.h}</p>
            <ul className="grid gap-2.5">
              {col.links.map((l) => <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-foreground">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="container mx-auto mt-12 flex flex-wrap items-center justify-between gap-2 px-4 font-jetbrains text-[12px] text-muted-foreground/40 md:px-8">
        <span>© 2026 Zanzibar Audio · Thessaloniki, Greece</span>
        <span>★ Made for the friend with taste</span>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <HeroSection />
        <MarqueeStrip />
        <HowItWorks />
        <ExampleSets />
        <VibeLibrary />
        <AboutSection />
        <FAQSection />
        <Closer />
      </main>
      <LandingFooter />
    </div>
  );
}
