import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HoloLogo } from "@/components/HoloLogo";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 font-sans">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <HoloLogo />
          <span className="text-gradient-sunset">Zanzibar</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/about"><Button variant="ghost" size="sm">About</Button></Link>
          {email ? (
            <>
              <Link to="/library"><Button variant="ghost" size="sm">My sets</Button></Link>
              <Link to="/vibe"><Button size="sm" className="bg-gradient-sunset shadow-glow text-primary-foreground">New set</Button></Link>
              <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
            </>
          ) : (
            <Link to="/auth"><Button size="sm" className="bg-gradient-sunset shadow-glow text-primary-foreground">Sign in</Button></Link>
          )}
        </nav>
      </div>
    </header>
  );
}

