export function HoloVisual() {
  return (
    <div className="relative aspect-square w-full">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-sunset opacity-30 blur-3xl" />
      <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border/50 bg-card/40 shadow-card backdrop-blur-sm">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.75 0.18 55 / 0.25) 1px, transparent 1px), linear-gradient(90deg, oklch(0.60 0.18 250 / 0.25) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(circle at center, black 40%, transparent 75%)",
          }}
        />
        {/* Holographic disc */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 h-full w-full animate-holo-float"
          aria-hidden
        >
          <defs>
            <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.75 0.18 55)" />
              <stop offset="50%" stopColor="oklch(0.62 0.22 320)" />
              <stop offset="100%" stopColor="oklch(0.60 0.18 250)" />
            </linearGradient>
            <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="oklch(0.92 0.18 70)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.75 0.18 55)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="origin-center" style={{ transformOrigin: "200px 200px" }}>
            <g style={{ animation: "holo-spin 24s linear infinite", transformOrigin: "200px 200px" }}>
              {[160, 140, 120, 100, 80, 60].map((r, i) => (
                <circle
                  key={r}
                  cx="200"
                  cy="200"
                  r={r}
                  fill="none"
                  stroke="url(#holo)"
                  strokeWidth={i % 2 === 0 ? 1.5 : 0.8}
                  strokeDasharray={i % 2 === 0 ? "6 8" : "2 6"}
                  opacity={0.85 - i * 0.08}
                />
              ))}
            </g>

            {/* Equalizer bars */}
            <g transform="translate(200 200)">
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const len = 18 + Math.abs(Math.sin(i * 1.7)) * 28;
                const x1 = Math.cos(angle) * 42;
                const y1 = Math.sin(angle) * 42;
                const x2 = Math.cos(angle) * (42 + len);
                const y2 = Math.sin(angle) * (42 + len);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="url(#holo)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            <circle cx="200" cy="200" r="80" fill="url(#core)" />
            <circle cx="200" cy="200" r="8" fill="oklch(0.18 0.06 270)" stroke="oklch(0.75 0.18 55)" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Scanlines */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 2px, oklch(0.75 0.18 55 / 0.4) 2px 3px)",
          }}
        />
      </div>
    </div>
  );
}
