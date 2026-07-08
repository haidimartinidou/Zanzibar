import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DJLoading } from "@/components/DJLoading";
import { supabase } from "@/integrations/supabase/client";
import { generatePlaylist } from "@/lib/generate-playlist";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react";
import type { VibeBrief, Track, TimelinePhase, EnergyLevel } from "@/lib/types";

export const Route = createFileRoute("/vibe")({ component: VibePage });

const eventOptions = [
  "House party",
  "Wedding",
  "Corporate event",
  "Birthday",
  "Club night",
  "Cocktail / dinner",
  "Festival",
  "Workout / sports",
];

const vibeOptions = [
  "Chill & smooth",
  "Feel-good pop",
  "High-energy dance",
  "Indie / alternative",
  "Hip-hop / R&B",
  "Latin / afrobeat",
  "Throwbacks",
  "Underground",
  "Jazz",
  "Folk / acoustic",
  "House",
  "Techno",
  "Disco / funk",
  "Rock",
];

const energyLabels: Record<EnergyLevel, string> = {
  chill: "Chill (1 to 3)",
  warmup: "Warm-up (3 to 5)",
  groove: "Groove (5 to 6)",
  upbeat: "Upbeat (6 to 8)",
  peak: "Peak hour (8 to 10)",
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
    { title: "Pick your styles", valid: brief.vibes.length > 0 },
    { title: "Energy & formality", valid: true },
    {
      title: "Who's there & how long?",
      valid: !!brief.crowd && (useTimeline ? timelineTotal >= 15 : brief.durationMinutes > 0),
    },
    { title: "Global Ear", valid: true },
    { title: "Anything else?", valid: true },
  ];

  const toggleVibe = (v: string) => {
    setBrief((b) => {
      const has = b.vibes.includes(v);
      if (has) return { ...b, vibes: b.vibes.filter((x) => x !== v) };
      if (b.vibes.length >= 3) {
        toast.error("Max 3 styles to blend");
        return b;
      }
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

      const data = await generatePlaylist({ data: { brief: finalBrief } });

      const tracks: Track[] = data.tracks;
      const name: string = data.name;

      const { data: session } = await supabase.auth.getSession();
      let id: string | undefined;

      if (session.session) {
        const { data: row, error: insErr } = await supabase
          .from("playlists")
          .insert({
            user_id: session.session.user.id,
            name,
            brief: finalBrief as any,
            tracks: tracks as any,
          })
          .select("id")
          .single();

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
    <div
      className="min-h-screen"
      style={{
        background: "#FFF6D8",
        color: "#7A1200",
        fontFamily: "'Poppins', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap');

        .zz-vibe-shell input,
        .zz-vibe-shell textarea,
        .zz-vibe-shell button,
        .zz-vibe-shell [role="combobox"] {
          font-family: 'Poppins', system-ui, sans-serif;
        }

        .zz-vibe-card {
          background: #FFFCE0;
          border: 1.5px solid rgba(228, 19, 12, 0.18);
          box-shadow: 0 24px 70px rgba(122, 18, 0, 0.14);
        }

        .zz-vibe-label {
          color: #7A1200;
          font-weight: 700;
        }

        .zz-vibe-input {
          background: #FFF6D8 !important;
          border-color: rgba(228, 19, 12, 0.28) !important;
          color: #7A1200 !important;
        }

        .zz-vibe-input::placeholder {
          color: rgba(122, 18, 0, 0.48);
        }

        .zz-vibe-primary {
          background: #E4130C !important;
          color: #FFF3B0 !important;
          border-radius: 999px !important;
          font-family: 'Fredoka', system-ui, sans-serif !important;
          font-weight: 700 !important;
          box-shadow: 0 12px 28px rgba(228, 19, 12, 0.24);
        }

        .zz-vibe-secondary {
          color: #E4130C !important;
          border-radius: 999px !important;
          font-family: 'Fredoka', system-ui, sans-serif !important;
          font-weight: 700 !important;
        }

        @media (max-width: 800px) {
          .zz-vibe-main {
            padding: 28px 18px 72px !important;
          }

          .zz-vibe-grid {
            grid-template-columns: 1fr !important;
          }

          .zz-vibe-title {
            font-size: 38px !important;
          }

          .zz-vibe-card {
            padding: 24px !important;
          }
        }
      `}</style>

      <SiteHeader />

      <main className="zz-vibe-main zz-vibe-shell mx-auto max-w-3xl px-4 py-12">
        <div
          style={{
            marginBottom: 28,
            borderRadius: 28,
            padding: "28px 32px",
            background:
              "radial-gradient(120% 90% at 18% 8%, #FFC24D 0%, #FF6A1F 32%, #FF2B12 62%, #E4130C 100%)",
            color: "#FFF3B0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Noise />
          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#FFD98A",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              § Vibe check · Step {step + 1} of {steps.length}
            </div>

            <h1
              className="zz-vibe-title"
              style={{
                fontFamily: "'Fredoka', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 54,
                lineHeight: 1,
                margin: "0 0 14px",
              }}
            >
              Build the room before the first track.
            </h1>

            <p style={{ maxWidth: 560, margin: 0, color: "#FFE3B0", fontSize: 16, lineHeight: 1.6 }}>
              Answer a few fast questions. Zanzibar turns your brief into a set with momentum, taste,
              and smarter cut-offs.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 8,
                  flex: 1,
                  borderRadius: 999,
                  background: i <= step ? "#E4130C" : "#F0DFA0",
                  transition: "all 160ms ease",
                }}
              />
            ))}
          </div>
        </div>

        <div className="zz-vibe-card rounded-3xl p-8">
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#B4740A",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Question {step + 1}
            </div>

            <h2
              style={{
                fontFamily: "'Fredoka', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 36,
                color: "#E4130C",
                lineHeight: 1.08,
                margin: 0,
              }}
            >
              {steps[step].title}
            </h2>
          </div>

          {step === 0 && (
            <div className="zz-vibe-grid grid grid-cols-2 gap-3">
              {eventOptions.map((o) => (
                <Pill key={o} active={brief.eventType === o} onClick={() => setBrief((b) => ({ ...b, eventType: o }))}>
                  {o}
                </Pill>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p style={{ fontSize: 14, color: "#B4740A", margin: 0 }}>
                Pick one or blend up to three. For example, Indie + Jazz for a warm, oddball dinner set.
              </p>

              <div className="zz-vibe-grid grid grid-cols-2 gap-3">
                {vibeOptions.map((o) => (
                  <Pill key={o} active={brief.vibes.includes(o)} onClick={() => toggleVibe(o)}>
                    {o}
                  </Pill>
                ))}
              </div>

              {brief.vibes.length > 0 && (
                <p style={{ fontSize: 13, color: "#B4740A" }}>
                  Blending:{" "}
                  <span style={{ color: "#E4130C", fontWeight: 800 }}>{brief.vibes.join(" + ")}</span>
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <Label className="zz-vibe-label">Overall energy level</Label>
                  <span
                    style={{
                      fontFamily: "'Fredoka', system-ui, sans-serif",
                      color: "#E4130C",
                      fontSize: 34,
                      fontWeight: 700,
                    }}
                  >
                    {brief.energy}/10
                  </span>
                </div>

                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[brief.energy]}
                  onValueChange={([v]) => setBrief((b) => ({ ...b, energy: v }))}
                />

                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#B4740A" }}>
                  <span>Background</span>
                  <span>Peak hour</span>
                </div>

                <p style={{ marginTop: 10, fontSize: 13, color: "#B4740A" }}>
                  Tip: you can map energy to exact time windows in the next step.
                </p>
              </div>

              <div>
                <Label className="zz-vibe-label mb-3 block">Formality</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["casual", "semi-formal", "formal"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setBrief((b) => ({ ...b, formality: f }))}
                      style={{
                        cursor: "pointer",
                        borderRadius: 18,
                        border: brief.formality === f ? "1.5px solid #E4130C" : "1.5px solid rgba(228, 19, 12, 0.22)",
                        padding: 14,
                        textAlign: "center",
                        fontSize: 14,
                        textTransform: "capitalize",
                        background: brief.formality === f ? "#E4130C" : "#FFF6D8",
                        color: brief.formality === f ? "#FFF3B0" : "#7A1200",
                        fontWeight: 700,
                      }}
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
                <Label htmlFor="crowd" className="zz-vibe-label">
                  Who&apos;s in the room?
                </Label>
                <Input
                  id="crowd"
                  className="zz-vibe-input mt-2"
                  placeholder="e.g. 30 friends in their 20s, mixed taste"
                  value={brief.crowd}
                  onChange={(e) => setBrief({ ...brief, crowd: e.target.value })}
                />
              </div>

              <div
                style={{
                  borderRadius: 24,
                  border: "1.5px solid rgba(228, 19, 12, 0.18)",
                  background: "#FFF6D8",
                  padding: 18,
                }}
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <Label className="zz-vibe-label text-base">Plan the course of the night</Label>
                    <p style={{ marginTop: 4, fontSize: 12, color: "#B4740A" }}>
                      Map energy and optional style to time windows.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseTimeline(!useTimeline)}
                    style={{
                      borderRadius: 999,
                      border: "1.5px solid #E4130C",
                      padding: "7px 16px",
                      fontSize: 12,
                      fontWeight: 800,
                      color: useTimeline ? "#FFF3B0" : "#E4130C",
                      background: useTimeline ? "#E4130C" : "transparent",
                    }}
                  >
                    {useTimeline ? "On" : "Off"}
                  </button>
                </div>

                {useTimeline ? (
                  <div className="space-y-2">
                    {timeline.map((p, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center gap-2"
                        style={{
                          borderRadius: 18,
                          border: "1px solid rgba(228, 19, 12, 0.18)",
                          background: "#FFFCE0",
                          padding: 10,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={5}
                            max={240}
                            step={5}
                            value={p.minutes}
                            onChange={(e) => updatePhase(i, { minutes: Math.max(5, Number(e.target.value) || 0) })}
                            className="zz-vibe-input h-9 w-20"
                          />
                          <span style={{ fontSize: 12, color: "#B4740A" }}>min</span>
                        </div>

                        <Select value={p.energy} onValueChange={(v) => updatePhase(i, { energy: v as EnergyLevel })}>
                          <SelectTrigger className="zz-vibe-input h-9 w-[160px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(energyLabels) as EnergyLevel[]).map((k) => (
                              <SelectItem key={k} value={k}>
                                {energyLabels[k]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Style, optional"
                          value={p.vibe ?? ""}
                          onChange={(e) => updatePhase(i, { vibe: e.target.value })}
                          className="zz-vibe-input h-9 min-w-[140px] flex-1 text-xs"
                        />

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removePhase(i)}
                          disabled={timeline.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" onClick={addPhase} className="zz-vibe-secondary w-full">
                      <Plus className="mr-1 h-3 w-3" /> Add window
                    </Button>

                    <p style={{ textAlign: "right", fontSize: 13, color: "#B4740A" }}>
                      Total:{" "}
                      <span style={{ color: "#E4130C", fontWeight: 800 }}>
                        {Math.floor(timelineTotal / 60)}h {timelineTotal % 60}m
                      </span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex items-baseline justify-between">
                      <Label className="zz-vibe-label">Duration</Label>
                      <span
                        style={{
                          fontFamily: "'Fredoka', system-ui, sans-serif",
                          color: "#E4130C",
                          fontSize: 30,
                          fontWeight: 700,
                        }}
                      >
                        {Math.floor(brief.durationMinutes / 60)}h {brief.durationMinutes % 60}m
                      </span>
                    </div>

                    <Slider
                      min={15}
                      max={300}
                      step={15}
                      value={[brief.durationMinutes]}
                      onValueChange={([v]) => setBrief({ ...brief, durationMinutes: v })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div
                style={{
                  borderRadius: 24,
                  border: "1.5px solid rgba(228, 19, 12, 0.18)",
                  background: "#FFF6D8",
                  padding: 22,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="zz-vibe-label text-base">Global Ear</Label>
                    <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#B4740A" }}>
                      When on, Zanzibar weaves in songs from around the world, including at least one
                      non-English track that fits the room. When off, it sticks to English or to any
                      language you specify in the final notes.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <Switch checked={globalEar} onCheckedChange={setGlobalEar} aria-label="Toggle Global Ear" />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        color: globalEar ? "#E4130C" : "#B4740A",
                      }}
                    >
                      {globalEar ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <Label htmlFor="notes" className="zz-vibe-label">
                Anything specific? Optional.
              </Label>
              <Textarea
                id="notes"
                rows={5}
                className="zz-vibe-input mt-2"
                placeholder="Artists to include or avoid, must-play tracks, language preferences..."
                value={brief.notes}
                onChange={(e) => setBrief({ ...brief, notes: e.target.value })}
              />
            </div>
          )}

          {loading ? (
            <DJLoading />
          ) : (
            <div className="mt-8 flex justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="zz-vibe-secondary"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>

              <Button onClick={next} className="zz-vibe-primary">
                {step === steps.length - 1 ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Build my set
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Pill({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 22,
        border: active ? "1.5px solid #E4130C" : "1.5px solid rgba(228, 19, 12, 0.2)",
        padding: 16,
        textAlign: "left",
        fontSize: 14,
        fontWeight: 700,
        transition: "all 160ms ease",
        background: active ? "#E4130C" : "#FFF6D8",
        color: active ? "#FFF3B0" : "#7A1200",
        boxShadow: active ? "0 12px 28px rgba(228, 19, 12, 0.18)" : "none",
      }}
    >
      {children}
    </button>
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