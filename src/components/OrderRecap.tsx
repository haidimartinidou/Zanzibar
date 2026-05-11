import { X } from "lucide-react";
import type { VibeBrief } from "@/lib/types";

const energyLabel: Record<string, string> = {
  chill: "Chill",
  warmup: "Warm-up",
  groove: "Groove",
  upbeat: "Upbeat",
  peak: "Peak",
};

export function OrderRecap({
  brief,
  onClose,
}: {
  brief: VibeBrief;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/55 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="m-4 mt-20 w-full max-w-sm rounded-3xl border border-primary/40 bg-card/95 p-6 shadow-glow animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Order Recap</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close recap"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <Row label="Event">{brief.eventType || "—"}</Row>
          <Row label="Style blend">
            {brief.vibes?.length ? brief.vibes.join(" + ") : (brief.vibe ?? "—")}
          </Row>
          <Row label="Energy">{brief.energy}/10</Row>
          <Row label="Formality" className="capitalize">
            {brief.formality?.replace("-", " ")}
          </Row>
          <Row label="Crowd">{brief.crowd || "—"}</Row>
          <Row label="Duration">
            {Math.floor(brief.durationMinutes / 60)}h {brief.durationMinutes % 60}m
          </Row>
          <Row label="Global Ear 🌍">{brief.globalEar ? "On" : "Off"}</Row>

          {brief.timeline && brief.timeline.length > 0 && (
            <div>
              <dt className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Timeline</dt>
              <dd className="space-y-1">
                {brief.timeline.map((p, i) => (
                  <div key={i} className="flex justify-between rounded-lg bg-muted/40 px-2 py-1 text-xs">
                    <span>{p.minutes} min · {energyLabel[p.energy] ?? p.energy}</span>
                    {p.vibe && <span className="text-muted-foreground">{p.vibe}</span>}
                  </div>
                ))}
              </dd>
            </div>
          )}

          {brief.notes && (
            <div>
              <dt className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Notes</dt>
              <dd className="rounded-lg bg-muted/40 px-2 py-1 text-xs italic">{brief.notes}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function Row({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium ${className}`}>{children}</dd>
    </div>
  );
}
