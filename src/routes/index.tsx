import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Scissors, Sliders, Headphones, Sunset, Zap, Wine, Gem, Palmtree, Disc3, Mic2, Brain, Waves } from "lucide-react";
import { HoloVisual } from "@/components/HoloVisual";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Zanzibar — AI DJ Playlists With Smart Cut-Offs" },
      { name: "description", content: "Answer 5 questions. Get a curated DJ set with intelligent cut-off times that keep the dancefloor packed." },
    ],
  }),
});

const VIBES = [
  { name: "Sunset rooftop", Icon: Sunset, desc: "Golden-hour house, downtempo grooves, easy BPM lift." },
  { name: "Warehouse 2AM", Icon: Zap, desc: "Hard techno, acid lines, no-mercy four-on-the-floor." },
  { name: "Dinner party", Icon: Wine, desc: "Bossa, jazz-funk, neo-soul. Conversation-friendly." },
  { name: "Wedding floor", Icon: Gem, desc: "Crowd-pleasers across decades, tuned for all generations." },
  { name: "Beach club", Icon: Palmtree, desc: "Melodic house, afro-beats, breezy summer anthems." },
  { name: "Indie disco", Icon: Disc3, desc: "Nu-disco, post-punk, glittery dance-rock singalongs." },
  { name: "Hip-hop lounge", Icon: Mic2, desc: "Boom-bap classics into modern trap, smooth rotations." },
  { name: "Focus & flow", Icon: Brain, desc: "Lo-fi, ambient electronica, deep work without lyrics." },
  { name: "Garage rave", Icon: Waves, desc: "UKG, bassline, 2-step. Fast feet, faster grins." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:py-32">
            <div className="flex flex-col justify-center">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> AI-curated DJ sets
              </span>
              <h1 className="text-5xl font-bold leading-[1.05] md:text-7xl">
                Read the room.<br />
                <span className="text-gradient-sunset">Drop the right track.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Tell Zanzibar the vibe — event, crowd, energy, length — and get a setlist with
                <span className="text-foreground"> smart cut-off times</span> that skip the boring
                parts and keep the floor moving.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/vibe">
                  <Button size="lg" className="bg-gradient-sunset px-8 text-base font-semibold shadow-glow text-primary-foreground">
                    Start a vibe check
                  </Button>
                </Link>
              </div>
            </div>
            <HoloVisual />
          </div>
        </section>


        {/* Vibes collection */}
        <section className="container mx-auto px-4 pb-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">The vibe library</p>
              <h2 className="text-3xl font-bold md:text-4xl">Pick a mood. We'll handle the rest.</h2>
            </div>
            <Link to="/vibe" className="hidden text-sm font-semibold text-primary hover:underline md:block">
              Build your own →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VIBES.map((v) => (
              <Link
                key={v.name}
                to="/vibe"
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm shadow-card transition hover:border-primary/60 hover:-translate-y-0.5"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-sunset opacity-0 blur-2xl transition group-hover:opacity-30" />
                <div className="relative">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary"><v.Icon className="h-5 w-5" /></div>
                  <h3 className="text-lg font-semibold">{v.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto grid gap-6 px-4 pb-24 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "Vibe-aware curation", desc: "5-question brief feeds an AI that knows what plays in a corporate mixer vs a 2am warehouse." },
            { icon: Scissors, title: "Smart cut-offs", desc: "Each track gets a play length tuned to crowd attention — peak hits get 90s, deep cuts get more." },
            { icon: Sliders, title: "Live DJ controls", desc: "Reorder, skip, edit cut-off times, pause the set. The booth is yours." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm shadow-card">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-sunset shadow-glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        

        <section className="container mx-auto px-4 pb-24 text-center">
          <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-card/40 p-10 shadow-card backdrop-blur">
            <Headphones className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-3xl font-bold">Ready to read the room?</h2>
            <p className="mt-3 text-muted-foreground">
              Build your first set in under a minute.
            </p>
            <Link to="/vibe">
              <Button size="lg" className="mt-6 bg-gradient-sunset px-10 shadow-glow text-primary-foreground">
                Start vibe check
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
