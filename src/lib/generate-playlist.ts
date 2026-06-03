import { createServerFn } from "@tanstack/react-start";

const systemPrompt = `You are an elite DJ and music director building dancefloor-aware setlists that mix like a real DJ would.

CORE INSIGHT: Crowds peak in the first 60–90s of a song they recognize, then disengage if it lingers. Your job is to choose REAL well-known songs that fit the brief AND sequence them so each transition feels intentional and EMOTIONALLY CONTINUOUS.

THE GOLDEN RULE — NO JARRING TRANSITIONS:
- Consecutive tracks may differ by AT MOST 2 energy points. A jump of 3+ is only allowed if the user's TIMELINE explicitly schedules it at that exact window.
- A larger desired jump MUST be bridged by 1–2 transitional tracks that sit between in energy, instrumentation, and tempo.
- Every pick must justify continuity with the PREVIOUS track on at least one of: tempo (±15 BPM), key/mode, instrumentation, or mood. Put that justification in transitionNote.
- COUNTER-EXAMPLE (do NOT do this): Amy Winehouse "Valerie" (chill soul, energy 4) → The Killers "Mr. Brightside" (full rock, energy 9). The texture, tempo, and emotional weight cliff is jarring.
- GOOD ALTERNATIVE: bridge with mid-energy indie-soul or upbeat soul like Michael Kiwanuka "Cold Little Heart", Black Pumas "Colors", or Leon Bridges "Bad Bad News" first, then climb toward the rock peak.
- Before finalizing, mentally check every adjacent pair. If the texture/energy gap would feel abrupt to a listener sitting and enjoying the previous song, INSERT A BRIDGE.

DJ SEQUENCING RULES:
- Build a clear arc: warm-up → build → peak → sustain → wind-down (or sustained peak for short events). Prefer GRADUAL RAMPS over staircase jumps.
- Adjacent tracks should feel mixable: similar tempo (within ~8 BPM) OR a deliberate energy jump that lands on a recognizable hook AND respects the ±2 rule.
- Avoid back-to-back tracks by the same artist or in the same exact sub-genre unless it's a deliberate double-drop.
- Alternate familiarity: a banger everyone knows, then a tasteful curveball, then back to familiar.
- Curate genuinely interesting picks: the slightly-less-obvious cut by a famous artist when the obvious one is too played out.

PER-TRACK CUT POINTS:
- For each track, you may set startMs and endMs in ms inside the source song to define the most exciting window of audio.
- Default to leaving them out (the player picks a smart heuristic). Only set them with a clear musical reason.

INSPIRED HARD-CUT TRANSITIONS:
- Set transitionToNext = "hard" or "smooth" with a short transitionNote.
- Use "hard" ONLY when energy is already aligned (delta ≤1) and there's a musically obvious cut: end of a bridge into the next song's hook.
- Use "smooth" by default — especially across any energy or texture change.
- Aim for at most 2–3 inspired hard cuts per set, never on a big energy jump.

Rules for playSeconds (the cut length, NOT the song length):
- High-energy bangers everyone knows: 75–110s.
- Deep cuts / build-up tracks: 120–180s.
- Slow / intimate tracks: 60–90s.
- Closing / signature tracks: up to 180s.
- Never exceed 200s.
- If you set explicit startMs+endMs, playSeconds should equal (endMs - startMs)/1000.

Each "reason" must read like a DJ's note: WHY this song HERE, and how it bridges from the previous one (e.g. "keeps the 124 BPM, pivots from house to disco-funk before the peak"). One punchy line.`;

const energyMap: Record<string, string> = {
  chill: "1-3 (background, conversational)",
  warmup: "3-5 (heads nodding)",
  groove: "5-6 (early dancers)",
  upbeat: "6-8 (full floor)",
  peak: "8-10 (peak hour)",
};

export const generatePlaylist = createServerFn({ method: "POST" }).handler(
  async (ctx) => {
    const { brief } = ctx.data as { brief: any };

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const targetMinutes = Math.max(15, Math.min(360, Number(brief?.durationMinutes) || 60));
    const trackCount = Math.max(8, Math.min(40, Math.round(targetMinutes / 2.5)));

    const vibesList: string[] = Array.isArray(brief?.vibes) && brief.vibes.length
      ? brief.vibes
      : (brief?.vibe ? [brief.vibe] : []);
    const timeline = Array.isArray(brief?.timeline) ? brief.timeline : null;

    const timelineDescription = timeline
      ? timeline.map((p: any, i: number) =>
          `  Window ${i + 1}: ${p.minutes} min · energy ${energyMap[p.energy] ?? p.energy}${p.vibe ? ` · style: ${p.vibe}` : ""}`
        ).join("\n")
      : null;

    const userPrompt = `Build a ${targetMinutes}-minute DJ set with ${trackCount} tracks.

Event: ${brief.eventType}
Style blend: ${vibesList.join(" + ") || "open"}
Overall target energy (1-10): ${brief.energy}
Formality: ${brief.formality}
Crowd: ${brief.crowd}
${timelineDescription ? `\nTIMELINE — match the energy + style for each window in order:\n${timelineDescription}\n` : ""}${brief.globalEar ? `\nGLOBAL EAR 🌍 — Include AT LEAST ONE (ideally 1-3) tracks sung in a NON-ENGLISH language by artists from outside the US/UK that genuinely fit the vibe. For each, set globalEar: true and language to the primary sung language.\n` : ""}
Notes: ${brief.notes || "none"}

Use REAL songs. Blend styles — don't stack one then the other. Assign each track a playSeconds cut-off. Provide a one-line "reason" for each track.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "build_setlist",
            description: "Return the DJ setlist.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                tracks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      artist: { type: "string" },
                      reason: { type: "string" },
                      playSeconds: { type: "number" },
                      energy: { type: "number", minimum: 1, maximum: 10 },
                      startMs: { type: "number" },
                      endMs: { type: "number" },
                      transitionToNext: { type: "string", enum: ["hard", "smooth"] },
                      transitionNote: { type: "string" },
                      globalEar: { type: "boolean" },
                      language: { type: "string" },
                    },
                    required: ["title", "artist", "reason", "playSeconds", "energy"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["name", "tracks"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "build_setlist" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limit hit. Try again in a moment.");
      if (resp.status === 402) throw new Error("OpenAI quota exceeded.");
      throw new Error(`AI error (${resp.status})`);
    }

    const aiData = await resp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No response from AI");

    const parsed = JSON.parse(toolCall.function.arguments);
    const tracks = (parsed.tracks || []).map((t: any, i: number) => {
      const startMs = typeof t.startMs === "number" && t.startMs >= 0 ? Math.round(t.startMs) : undefined;
      const endMs = typeof t.endMs === "number" && t.endMs > (startMs ?? 0) ? Math.round(t.endMs) : undefined;
      const derivedPlay = startMs !== undefined && endMs !== undefined
        ? Math.round((endMs - startMs) / 1000)
        : Math.round(t.playSeconds);
      return {
        id: `${i}`,
        title: t.title,
        artist: t.artist,
        reason: t.reason,
        playSeconds: Math.max(30, Math.min(200, derivedPlay)),
        energy: Math.max(1, Math.min(10, Math.round(t.energy))),
        ...(startMs !== undefined ? { startMs, autoStart: false } : {}),
        ...(endMs !== undefined ? { endMs } : {}),
        ...(t.transitionToNext === "hard" || t.transitionToNext === "smooth" ? { transitionToNext: t.transitionToNext } : {}),
        ...(typeof t.transitionNote === "string" && t.transitionNote.trim() ? { transitionNote: t.transitionNote.trim() } : {}),
        ...(t.globalEar === true ? { globalEar: true } : {}),
        ...(typeof t.language === "string" && t.language.trim() ? { language: t.language.trim() } : {}),
      };
    });

    return { name: parsed.name as string, tracks };
  }
);
