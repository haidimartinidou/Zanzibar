import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { HoloVisual } from "@/components/HoloVisual";

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
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">About us</p>
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              For the friend who <span className="text-gradient-sunset">always gets handed the aux</span>.
            </h1>
          </div>
          <HoloVisual />
        </div>

        <section className="mt-16 grid gap-8 text-lg leading-relaxed text-muted-foreground md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">You know that feeling</h2>
            <p>
              Someone hands you the cable. "You've got good taste — you're DJ tonight." Suddenly your brain,
              the same brain that grew up on Jimi Hendrix and knows every B-side worth knowing, can only
              produce one song: Macarena. At a charity event. That's not a good look. You can do better than that.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">We're here for you</h2>
            <p>
              Don't think of this as outsourcing because you're a bad DJ. You're not. You're under stage fright —
              and well, we're not. Zanzibar reads the room so you don't have to second-guess every transition while
              your aunt asks for "something we can dance to."
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">Who we are</h2>
            <p>
              A small team in Greece who love good music a little too much and throw a few too many parties.
              We built Zanzibar because every single one of us has been the friend with the aux at the wrong moment,
              and we got tired of pretending we had a plan.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">Go have a drink</h2>
            <p>
              Seriously. Pour yourself something nice. Later, you won't need it — the music will do the magic,
              and you'll get the credit. That's the deal.
            </p>
          </div>
        </section>

        <div className="mt-16 rounded-3xl border border-border/60 bg-card/40 p-10 text-center shadow-card backdrop-blur">
          <h2 className="text-3xl font-bold">Try it at your next thing.</h2>
          <p className="mt-3 text-muted-foreground">Free to start. No credit card. No vibe killers.</p>
          <Link to="/vibe">
            <Button size="lg" className="mt-6 bg-gradient-sunset px-10 shadow-glow">
              Start a vibe check
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
