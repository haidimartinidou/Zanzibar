import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { exchangeCode, consumeReturnPath } from "@/lib/spotify";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/spotify-callback")({ component: Callback });

function Callback() {
  const [msg, setMsg] = useState("Connecting to Spotify...");
  const handledRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const err = params.get("error");
    if (err) {
      setMsg(`Spotify error: ${err}`);
      return;
    }
    if (!code) {
      setMsg("Missing authorization code");
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;

    void (async () => {
      try {
        await exchangeCode(code);
        const back = consumeReturnPath() ?? "/library";
        const safe = back.startsWith("/") && !back.startsWith("//") ? back : "/library";
        // Full navigation remounts the app so Spotify state + Web Playback SDK re-initialize.
        window.location.replace(safe);
      } catch (e: any) {
        handledRef.current = false;
        setMsg(e.message ?? "Failed to connect");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted-foreground">{msg}</p>
      </main>
    </div>
  );
}