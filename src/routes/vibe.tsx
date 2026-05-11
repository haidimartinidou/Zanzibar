import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
// RadioGroup removed — replaced with plain buttons for snappier single-tap response.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react";
import type { VibeBrief, Track, TimelinePhase, EnergyLevel } from "@/lib/types";

export const Route = createFileRoute("/vibe")({ component: VibePage });

const eventOptions = ["House party", "Wedding", "Corporate event", "Birthday", "Club night", "Cocktail / dinner", "Festival", "Workout / sports"];
const vibeOptions = [
  "Chill & smooth", "Feel-good pop", "High-energy dance", "Indie / alternative",
  "Hip-hop / R&B", "Latin / afrobeat", "Throwbacks", "Underground",
  "Jazz", "Folk / acoustic", "House", "Techno", "Disco / funk", "Rock",
];

const energyLabels: Record<EnergyLevel, string> = {
  chill: "Chill (1-3)",
  warmup: "Warm-up (3-5)",
  groove: "Groove (5-6)",
  upbeat: "Upbeat (6-8)",
  peak: "Peak hour (8-10)",
};

function VibePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [useTimeline, setUseTimeline] = useState(false);
  const [globalEar, setGlobalEar] = useState(false);
  const [timeline, setTimeline] = useState<TimelinePhase[]>([
    { minutes: 30, energy: "warmup" },
    { minutes: 60, energy: "upbeat" },
    { minutes: 30, energy: "chill" },
  ]);
  const [brief, setBrief] = useState<VibeBrief>({
    eventType: "",
    vibes: [],
    energy: 7,
    formality: "casual",
    crowd: "",
    durationMinutes: 60,
    notes: "",
  });

  const timelineTotal = useMemo(() => timeline.reduce((s, p) => s + p.minutes, 0), [timeline]);

  const steps = [
    { title: "What's the event?", valid: !!brief.eventType },
    { title: "Pick your styles (blend up to 3)", valid: brief.vibes.length > 0 },
    { title: "Energy & formality", valid: true },
    { title: "Who's there & how long?", valid: !!brief.crowd && (useTimeline ? timelineTotal >= 15 : brief.durationMinutes > 0) },
    { title: "Global Ear 🌍", valid: true },
    { title: "Anything else?", valid: true },
  ];

  const toggleVibe = (v: string) => {
    setBrief((b) => {
      const has = b.vibes.includes(v);
      if (has) return { ...b, vibes: b.vibes.filter((x) => x !== v) };
      if (b.vibes.length >= 3) { toast.error("Max 3 styles to blend"); return b; }
      return { ...b, vibes: [...b.vibes, v] };
    });
  };

  const updatePhase = (i: number, patch: Partial<TimelinePhase>) => {
    setTimeline((tl) => tl.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };
  const addPhase = () => setTimeline((tl) => [...tl, { minutes: 30, energy: "groove" }]);
  const removePhase = (i: number) => setTimeline((tl) => tl.filter((_, idx) => idx !== i));

  const generate = async () => {
    setLoading(true);
    try {
      const finalBrief: VibeBrief = {
        ...brief,
        vibe: brief.vibes.join(" + "),
        durationMinutes: useTimeline ? timelineTotal : brief.durationMinutes,
        timeline: useTimeline ? timeline : undefined,
        globalEar,
      };
      const { data, error } = await supabase.functions.invoke("generate-playlist", { body: { brief: finalBrief } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const tracks: Track[] = data.tracks;
      const name: string = data.name;

      const { data: session } = await supabase.auth.getSession();
      let id: string | undefined;
      if (session.session) {
        const { data: row, error: insErr } = await supabase
          .from("playlists")
          .insert({ user_id: session.session.user.id, name, brief: finalBrief as any, tracks: tracks as any })
          .select("id").single();
        if (insErr) throw insErr;
        id = row.id;
      } else {
        sessionStorage.setItem("vibedeck:draft", JSON.stringify({ name, brief: finalBrief, tracks }));
      }
      if (id) {
        await navigate({ to: "/set/$id", params: { id } });
      } else {
        await navigate({ to: "/set/$id", params: { id: "draft" } });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't generate set");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (!steps[step].valid) return toast.error("Pick something to continue");
    if (step === steps.length - 1) generate();
    else setStep(step + 1);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-gradient-sunset" : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Step {step + 1} of {steps.length}</p>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/50 p-8 shadow-card backdrop-blur">
          <h1 className="mb-6 text-3xl font-bold">{steps[step].title}</h1>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {eventOptions.map((o) => (
                <Pill key={o} active={brief.eventType === o} onClick={() => setBrief((b) => ({ ...b, eventType: o }))}>{o}</Pill>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pick one or combine multiple — e.g. "Indie" + "Jazz" for an indie-jazz blend.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {vibeOptions.map((o) => (
                  <Pill key={o} active={brief.vibes.includes(o)} onClick={() => toggleVibe(o)}>{o}</Pill>
                ))}
              </div>
              {brief.vibes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Blending: <span className="text-gradient-sunset font-semibold">{brief.vibes.join(" + ")}</span>
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <Label>Overall energy level</Label>
                  <span className="text-2xl font-bold text-gradient-sunset">{brief.energy}/10</span>
                </div>
                <Slider min={1} max={10} step={1} value={[brief.energy]} onValueChange={([v]) => setBrief((b) => ({ ...b, energy: v }))} />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Background</span><span>Peak hour</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Tip: you can also map energy to specific time windows in the next step.</p>
              </div>
              <div>
                <Label className="mb-3 block">Formality</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["casual", "semi-formal", "formal"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setBrief((b) => ({ ...b, formality: f }))}
                      className={`cursor-pointer rounded-xl border p-3 text-center text-sm capitalize transition-all ${brief.formality === f ? "border-primary bg-primary/10 shadow-glow" : "border-border hover:border-border/80"}`}
                    >
                      {f.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="crowd">Who's in the room?</Label>
                <Input id="crowd" placeholder="e.g. 30 friends in their 20s, mixed taste" value={brief.crowd} onChange={(e) => setBrief({ ...brief, crowd: e.target.value })} />
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <Label className="text-base">Plan the course of the night</Label>
                    <p className="text-xs text-muted-foreground">Map energy (and optional style) to specific time windows.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseTimeline(!useTimeline)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${useTimeline ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {useTimeline ? "On" : "Off"}
                  </button>
                </div>

                {useTimeline ? (
                  <div className="space-y-2">
                    {timeline.map((p, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={5}
                            max={240}
                            step={5}
                            value={p.minutes}
                            onChange={(e) => updatePhase(i, { minutes: Math.max(5, Number(e.target.value) || 0) })}
                            className="h-8 w-20"
                          />
                          <span className="text-xs text-muted-foreground">min</span>
                        </div>
                        <Select value={p.energy} onValueChange={(v) => updatePhase(i, { energy: v as EnergyLevel })}>
                          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(energyLabels) as EnergyLevel[]).map((k) => (
                              <SelectItem key={k} value={k}>{energyLabels[k]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Style (optional, e.g. folk)"
                          value={p.vibe ?? ""}
                          onChange={(e) => updatePhase(i, { vibe: e.target.value })}
                          className="h-8 flex-1 min-w-[140px] text-xs"
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removePhase(i)} disabled={timeline.length <= 1}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addPhase} className="w-full">
                      <Plus className="mr-1 h-3 w-3" /> Add window
                    </Button>
                    <p className="text-right text-xs text-muted-foreground">
                      Total: <span className="text-gradient-sunset font-semibold">{Math.floor(timelineTotal / 60)}h {timelineTotal % 60}m</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex items-baseline justify-between">
                      <Label>Duration</Label>
                      <span className="text-2xl font-bold text-gradient-sunset">{Math.floor(brief.durationMinutes / 60)}h {brief.durationMinutes % 60}m</span>
                    </div>
                    <Slider min={15} max={300} step={15} value={[brief.durationMinutes]} onValueChange={([v]) => setBrief({ ...brief, durationMinutes: v })} />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-base">Global Ear 🌍</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      When <span className="font-semibold">on</span>, we weave in songs from all over
                      the world (at least one non-English track that fits your vibe). When{" "}
                      <span className="font-semibold">off</span>, we stick to English — or to any
                      language you specify in the additional comments step.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Switch
                      checked={globalEar}
                      onCheckedChange={setGlobalEar}
                      aria-label="Toggle Global Ear"
                    />
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${globalEar ? "text-primary" : "text-muted-foreground"}`}>
                      {globalEar ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <Label htmlFor="notes">Anything specific? (optional)</Label>
              <Textarea
                id="notes"
                rows={5}
                placeholder="Artists to include or avoid, must-play tracks, language preferences..."
                value={brief.notes}
                onChange={(e) => setBrief({ ...brief, notes: e.target.value })}
              />
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || loading}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={next} disabled={loading} className="bg-gradient-sunset shadow-glow">
              {loading ? (
                <>Generating...</>
              ) : step === steps.length - 1 ? (
                <><Sparkles className="mr-2 h-4 w-4" /> Build my set</>
              ) : (
                <>Next <ArrowRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left text-sm font-medium transition-all ${
        active
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-border bg-card/30 hover:border-border/80 hover:bg-card/60"
      }`}
    >
      {children}
    </button>
  );
}
