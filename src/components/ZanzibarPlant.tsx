import { useEffect, useRef, useState } from "react";

// Zanzibar Gem (Zamioculcas zamiifolia) — energy indicator.
// Leaves are placed in PAIRS at the same point along the stem, so both
// originate from the exact same anchor on the curve (no floating leaves).
// The viewBox auto-fits the grown plant so nothing clips at the edges.
export function ZanzibarPlant({
  energy,
  className = "",
}: {
  energy: number;
  className?: string;
}) {
  const e = Math.max(1, Math.min(10, Math.round(energy)));
  const stemCount = Math.max(2, Math.round(2 + e * 0.5));      // 2..7
  const pairsPerStem = Math.max(2, Math.round(2 + e * 0.4));   // 2..6 pairs
  const stemHeight = 90 + e * 14;                              // 104..230
  const leafLen = 7 + e * 0.5;                                 // 7.5..12

  const stems = Array.from({ length: stemCount }, (_, i) => {
    const t = stemCount === 1 ? 0.5 : i / (stemCount - 1);
    const angle = (t - 0.5) * (stemCount > 4 ? 70 : 50);
    const len = stemHeight * (0.78 + 0.22 * Math.sin(t * Math.PI));
    return { angle, len, t };
  });

  const maxReach = stems.reduce((m, s) => {
    const rad = (s.angle * Math.PI) / 180;
    const tipX = Math.sin(rad) * s.len;
    return Math.max(m, Math.abs(tipX));
  }, 0);
  const padX = maxReach + leafLen * 2.4 + 20;
  const padTop = stemHeight + leafLen * 2 + 16;
  const cx = padX;
  const cy = padTop;
  const W = padX * 2;
  const H = padTop + 60;

  const [glow, setGlow] = useState(false);
  const lastE = useRef(e);
  useEffect(() => {
    if (lastE.current !== e) {
      lastE.current = e;
      setGlow(true);
      const id = setTimeout(() => setGlow(false), 1400);
      return () => clearTimeout(id);
    }
  }, [e]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`${className} ${glow ? "drop-shadow-[0_0_18px_oklch(0.78_0.18_150/0.7)]" : ""} transition-[filter] duration-700`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="zz-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.16 150)" />
          <stop offset="100%" stopColor="oklch(0.4 0.13 148)" />
        </linearGradient>
        <linearGradient id="zz-leaf-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.13 150)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.6 0.16 150)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="zz-stem" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.45 0.10 150)" />
          <stop offset="100%" stopColor="oklch(0.62 0.14 150)" />
        </linearGradient>
        <linearGradient id="zz-pot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.42 0.13 18)" />
          <stop offset="100%" stopColor="oklch(0.22 0.09 15)" />
        </linearGradient>
      </defs>

      {/* Pot — bordeaux */}
      <g transform={`translate(${cx} ${cy + 30})`}>
        <path
          d={`M ${-32} 0 L 32 0 L 25 30 L ${-25} 30 Z`}
          fill="url(#zz-pot)"
        />
        <ellipse cx="0" cy="0" rx="32" ry="5" fill="oklch(0.16 0.07 15)" opacity="0.7" />
        <rect x={-30} y={3} width={60} height={2} fill="oklch(0.14 0.06 15)" opacity="0.6" />
      </g>

      {/* Stems & leaves */}
      <g transform={`translate(${cx} ${cy + 30})`}>
        {stems.map((s, idx) => {
          const rad = (s.angle * Math.PI) / 180;
          const tipX = Math.sin(rad) * s.len;
          const tipY = -Math.cos(rad) * s.len;
          const ctrlX = tipX * 0.55 + Math.sin(rad) * 14;
          const ctrlY = tipY * 0.55 - 6;

          const pointAt = (u: number) => {
            const x = 2 * (1 - u) * u * ctrlX + u * u * tipX;
            const y = 2 * (1 - u) * u * ctrlY + u * u * tipY;
            const dx = 2 * (1 - u) * (ctrlX - 0) + 2 * u * (tipX - ctrlX);
            const dy = 2 * (1 - u) * (ctrlY - 0) + 2 * u * (tipY - ctrlY);
            const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
            return { x, y, ang };
          };

          const stemPath = `M 0 0 Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`;

          // Leaf pairs along the stem — same anchor, mirrored sides.
          const pairs = Array.from({ length: pairsPerStem }, (_, j) => {
            const u = 0.22 + ((j + 1) / (pairsPerStem + 1)) * 0.74;
            const p = pointAt(u);
            const perp = p.ang + 90;
            const sz = leafLen * (1 - u * 0.22);
            return { ...p, perp, sz, key: `${idx}-${j}` };
          });

          // Final tip pair — joins the crown naturally.
          const tipPoint = pointAt(0.98);
          const tipPair = {
            x: tipPoint.x,
            y: tipPoint.y,
            perp: tipPoint.ang + 90,
            sz: leafLen * 0.85,
            key: `${idx}-tip`,
          };
          const allPairs = [...pairs, tipPair];

          return (
            <g key={idx}>
              <path
                d={stemPath}
                fill="none"
                stroke="url(#zz-stem)"
                strokeWidth={Math.max(1.6, 3 - s.t * 0.6)}
                strokeLinecap="round"
              />
              {allPairs.map((l) =>
                ([1, -1] as const).map((side) => (
                  <g
                    key={`${l.key}-${side}`}
                    transform={`translate(${l.x} ${l.y}) rotate(${l.perp + (side > 0 ? 0 : 180)})`}
                  >
                    <path
                      d={`M 0 0 Q ${l.sz * 0.6} ${-l.sz * 0.7} ${l.sz * 1.7} 0 Q ${l.sz * 0.6} ${l.sz * 0.7} 0 0 Z`}
                      fill="url(#zz-leaf)"
                    />
                    <path
                      d={`M 0 0 Q ${l.sz * 0.6} ${-l.sz * 0.5} ${l.sz * 1.5} ${-l.sz * 0.05}`}
                      stroke="url(#zz-leaf-shine)"
                      strokeWidth={l.sz * 0.25}
                      fill="none"
                      strokeLinecap="round"
                    />
                    <line
                      x1={0}
                      y1={0}
                      x2={l.sz * 1.6}
                      y2={0}
                      stroke="oklch(0.3 0.08 150)"
                      strokeWidth={0.5}
                      opacity={0.6}
                    />
                  </g>
                ))
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
