import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Music } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({ component: Library });

type Row = { id: string; name: string; created_at: string; tracks: any[]; brief: any };

function Library() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) { navigate({ to: "/auth" }); return; }
    const { data, error } = await supabase.from("playlists").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rows ?? []).filter((r) => r.id !== id));
    toast.success("Set deleted");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your sets</h1>
            <p className="text-muted-foreground">All the playlists you've curated.</p>
          </div>
          <Link to="/vibe">
            <Button className="bg-gradient-sunset shadow-glow"><Plus className="mr-1 h-4 w-4" /> New set</Button>
          </Link>
        </div>

        {rows === null ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/30 p-12 text-center">
            <Music className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No sets yet. Build your first one.</p>
            <Link to="/vibe"><Button className="mt-4 bg-gradient-sunset shadow-glow">Start vibe check</Button></Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <div key={r.id} className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-5 shadow-card backdrop-blur transition-all hover:border-primary/50">
                <Link to="/set/$id" params={{ id: r.id }} className="flex-1">
                  <h3 className="text-lg font-semibold group-hover:text-gradient-sunset">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {r.tracks?.length ?? 0} tracks · {r.brief?.eventType} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
