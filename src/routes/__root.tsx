import { useEffect } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { resumeSpotifyPkceLoginIfNeeded } from "@/lib/spotify";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-sunset">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This track isn't in the crate.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Back to the booth
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zanzibar — AI DJ Playlists Tuned to Your Crowd" },
      { name: "description", content: "Tell Zanzibar the vibe and it builds the playlist — with smart cut-offs that drop tracks before the room loses momentum." },
      { name: "author", content: "Zanzibar" },
      { property: "og:title", content: "Zanzibar — AI DJ Playlists" },
      { property: "og:description", content: "AI-built playlists with smart cut-offs that keep the dancefloor moving." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    void resumeSpotifyPkceLoginIfNeeded().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : "Spotify login failed";
      toast.error(msg);
    });
  }, []);
  return <Outlet />;
}
