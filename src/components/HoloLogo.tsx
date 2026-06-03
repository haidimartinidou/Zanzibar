// ZZ-plant SVG logo — four asymmetric colour-coded stems, multi-colour halo.
// Replaces the old PNG asset with a crisp, scalable mark.

export function HoloLogo({ className = "h-9 w-9" }: { className?: string }) {
  const stems = [
    { angle: -32, len: 32, pairs: 3, leaf: 5.4, grad: "zzl-blue",    stem: "zzl-stem-cool" },
    { angle: -10, len: 42, pairs: 4, leaf: 6.2, grad: "zzl-lime",    stem: "zzl-stem-lime" },
    { angle:  14, len: 38, pairs: 4, leaf: 5.8, grad: "zzl-orange",  stem: "zzl-stem-warm" },
    { angle:  34, len: 28, pairs: 3, leaf: 5.0, grad: "zzl-magenta", stem: "zzl-stem-warm" },
  ];

  const jitter = (k: number) => {
    const s = Math.sin(k * 9301 + 49297) * 233280;
    return s - Math.floor(s);
  };

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 80 80" aria-label="Zanzibar" className="h-full w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="zzl-lime" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="oklch(0.94 0.22 130)" />
            <stop offset="55%"  stopColor="oklch(0.80 0.20 138)" />
            <stop offset="100%" stopColor="oklch(0.46 0.14 152)" />
          </linearGradient>
          <linearGradient id="zzl-orange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="oklch(0.90 0.16 70)" />
            <stop offset="55%"  stopColor="oklch(0.78 0.18 55)" />
            <stop offset="100%" stopColor="oklch(0.48 0.16 40)" />
          </linearGradient>
          <linearGradient id="zzl-magenta" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="oklch(0.82 0.20 340)" />
            <stop offset="55%"  stopColor="oklch(0.66 0.24 340)" />
            <stop offset="100%" stopColor="oklch(0.40 0.18 330)" />
          </linearGradient>
          <linearGradient id="zzl-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="oklch(0.78 0.14 250)" />
            <stop offset="55%"  stopColor="oklch(0.62 0.18 250)" />
            <stop offset="100%" stopColor="oklch(0.38 0.14 258)" />
          </linearGradient>
          <linearGradient id="zzl-stem-lime" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="oklch(0.42 0.10 152)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 138)" />
          </linearGradient>
          <linearGradient id="zzl-stem-warm" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="oklch(0.40 0.10 60)" />
            <stop offset="100%" stopColor="oklch(0.68 0.14 65)" />
          </linearGradient>
          <linearGradient id="zzl-stem-cool" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="oklch(0.38 0.08 268)" />
            <stop offset="100%" stopColor="oklch(0.60 0.14 252)" />
          </linearGradient>
          <radialGradient id="zzl-halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stopColor="oklch(0.88 0.20 132)" stopOpacity="0.45" />
            <stop offset="40%"  stopColor="oklch(0.66 0.24 340)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="oklch(0.62 0.18 250)" stopOpacity="0" />
          </radialGradient>
          <clipPath id="zzl-clip">
            <rect x="0" y="0" width="80" height="80" rx="20" ry="20" />
          </clipPath>
        </defs>

        <g clipPath="url(#zzl-clip)">
          <circle cx="40" cy="46" r="40" fill="url(#zzl-halo)" />
        </g>
        <circle cx="40" cy="60" r="8"   fill="none" stroke="oklch(0.88 0.20 132 / 0.4)" strokeWidth="1" />
        <circle cx="40" cy="60" r="3.5" fill="oklch(0.88 0.20 132 / 0.18)" />

        <g transform="translate(40 60)">
          {stems.map((s, idx) => {
            const rad = s.angle * Math.PI / 180;
            const tipX = Math.sin(rad) * s.len;
            const tipY = -Math.cos(rad) * s.len;
            const ctrlX = tipX * 0.5 + Math.sin(rad) * 8 + (jitter(idx) - 0.5) * 4;
            const ctrlY = tipY * 0.55 - 4;

            const pt = (u: number) => {
              const x = 2*(1-u)*u*ctrlX + u*u*tipX;
              const y = 2*(1-u)*u*ctrlY + u*u*tipY;
              const dx = 2*(1-u)*ctrlX + 2*u*(tipX - ctrlX);
              const dy = 2*(1-u)*ctrlY + 2*u*(tipY - ctrlY);
              return { x, y, ang: Math.atan2(dy, dx) * 180 / Math.PI };
            };

            const leaves: { x: number; y: number; rotate: number; sz: number; key: string }[] = [];
            for (let j = 0; j < s.pairs; j++) {
              const u = 0.30 + ((j + 1) / (s.pairs + 1)) * 0.62;
              const p = pt(u);
              const base = s.leaf * (1 - u * 0.18);
              for (const side of [1, -1] as const) {
                const r = jitter(idx * 31 + j * 7 + (side > 0 ? 0 : 3));
                const sz = base * (0.78 + r * 0.42);
                const tilt = (r - 0.5) * 22;
                leaves.push({
                  x: p.x, y: p.y, sz, key: `${idx}-${j}-${side}`,
                  rotate: p.ang + 90 + (side > 0 ? 0 : 180) + side * tilt,
                });
              }
            }
            const tip = pt(0.97);
            const tipSide = idx % 2 === 0 ? 1 : -1;
            leaves.push({
              x: tip.x, y: tip.y, sz: s.leaf * 0.72, key: `${idx}-tip`,
              rotate: tip.ang + 90 + (tipSide > 0 ? 0 : 180),
            });

            return (
              <g key={idx}>
                <path
                  d={`M 0 0 Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`}
                  fill="none" stroke={`url(#${s.stem})`}
                  strokeWidth="1.5" strokeLinecap="round" opacity="0.9"
                />
                {leaves.map((l) => (
                  <g key={l.key} transform={`translate(${l.x} ${l.y}) rotate(${l.rotate})`}>
                    <path
                      d={`M 0 0 Q ${l.sz*0.5} ${-l.sz*0.82} ${l.sz*1.85} 0 Q ${l.sz*0.5} ${l.sz*0.78} 0 0 Z`}
                      fill={`url(#${s.grad})`}
                      stroke="oklch(0.22 0.06 280 / 0.5)" strokeWidth="0.45"
                    />
                    <path
                      d={`M ${l.sz*0.25} ${-l.sz*0.12} Q ${l.sz*0.6} ${-l.sz*0.48} ${l.sz*1.3} ${-l.sz*0.04}`}
                      fill="none" stroke="oklch(0.96 0.10 130 / 0.55)"
                      strokeWidth="0.5" strokeLinecap="round"
                    />
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </span>
  );
}
