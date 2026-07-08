export function DJLoading({ label = "mixing and popping...wait for it..." }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: "48px 24px",
        fontFamily: "'Poppins', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Poppins:wght@400;600&display=swap');

        @keyframes dj-body-bounce {
          0%, 100% { transform: translateY(0) rotate(-1.5deg); }
          50%       { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes dj-arm-left {
          0%, 100% { transform: rotate(0deg); }
          50%       { transform: rotate(-22deg); }
        }
        @keyframes dj-arm-right {
          0%, 100% { transform: rotate(0deg); }
          50%       { transform: rotate(22deg); }
        }
        @keyframes dj-disc-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dj-label-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }

        .dj-bounce { animation: dj-body-bounce 0.72s ease-in-out infinite; transform-origin: 60px 130px; }
        .dj-arm-l  { animation: dj-arm-left  0.72s ease-in-out infinite; transform-origin: 38px 78px; }
        .dj-arm-r  { animation: dj-arm-right 0.72s ease-in-out infinite 0.36s; transform-origin: 82px 78px; }
        .dj-spin   { animation: dj-disc-spin 1.2s linear infinite; transform-origin: 60px 105px; }
        .dj-pulse  { animation: dj-label-pulse 1.1s ease-in-out infinite; }
      `}</style>

      {/* DJ character */}
      <svg
        viewBox="0 0 120 155"
        width={120}
        height={155}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Shadow */}
        <ellipse cx="60" cy="148" rx="26" ry="5" fill="rgba(122,18,0,0.12)" />

        {/* ── Bouncing group ── */}
        <g className="dj-bounce">

          {/* Left arm */}
          <g className="dj-arm-l">
            <line x1="38" y1="78" x2="14" y2="96" stroke="#FFF3B0" strokeWidth="7" strokeLinecap="round" />
            {/* Hand disc */}
            <circle cx="12" cy="98" r="6" fill="#FFC24D" stroke="#E4130C" strokeWidth="1.5" />
            <circle cx="12" cy="98" r="2" fill="#E4130C" />
          </g>

          {/* Right arm */}
          <g className="dj-arm-r">
            <line x1="82" y1="78" x2="106" y2="96" stroke="#FFF3B0" strokeWidth="7" strokeLinecap="round" />
            {/* Hand disc */}
            <circle cx="108" cy="98" r="6" fill="#FFC24D" stroke="#E4130C" strokeWidth="1.5" />
            <circle cx="108" cy="98" r="2" fill="#E4130C" />
          </g>

          {/* Body */}
          <rect x="36" y="62" width="48" height="52" rx="16" fill="#E4130C" />

          {/* Spinning turntable disc on body */}
          <g className="dj-spin">
            <circle cx="60" cy="105" r="14" fill="#7A1200" />
            <circle cx="60" cy="105" r="9"  fill="#FFF3B0" opacity="0.18" />
            <circle cx="60" cy="105" r="3"  fill="#FFC24D" />
          </g>

          {/* Body buttons */}
          <circle cx="46" cy="76" r="4" fill="#FFF3B0" opacity="0.85" />
          <circle cx="60" cy="76" r="4" fill="#FFF3B0" opacity="0.85" />
          <circle cx="74" cy="76" r="4" fill="#FFF3B0" opacity="0.85" />

          {/* Neck */}
          <rect x="53" y="56" width="14" height="10" rx="5" fill="#FFF3B0" />

          {/* Head */}
          <circle cx="60" cy="38" r="22" fill="#FFF3B0" />

          {/* Headphones arc */}
          <path d="M38 38 Q38 14 60 14 Q82 14 82 38" stroke="#7A1200" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Left ear cup */}
          <rect x="31" y="32" width="10" height="14" rx="5" fill="#7A1200" />
          {/* Right ear cup */}
          <rect x="79" y="32" width="10" height="14" rx="5" fill="#7A1200" />

          {/* Eyes */}
          <ellipse cx="52" cy="34" rx="4" ry="4.5" fill="#E4130C" />
          <ellipse cx="68" cy="34" rx="4" ry="4.5" fill="#E4130C" />
          {/* Pupils */}
          <circle cx="53" cy="35" r="1.5" fill="#FFF3B0" />
          <circle cx="69" cy="35" r="1.5" fill="#FFF3B0" />

          {/* Smile */}
          <path d="M50 44 Q60 52 70 44" stroke="#E4130C" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Legs */}
          <rect x="46" y="112" width="11" height="22" rx="5.5" fill="#7A1200" />
          <rect x="63" y="112" width="11" height="22" rx="5.5" fill="#7A1200" />
          {/* Shoes */}
          <ellipse cx="51.5" cy="134" rx="10" ry="5.5" fill="#7A1200" />
          <ellipse cx="68.5" cy="134" rx="10" ry="5.5" fill="#7A1200" />

        </g>
        {/* ── End bouncing group ── */}
      </svg>

      <p
        className="dj-pulse"
        style={{
          fontFamily: "'Fredoka', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 18,
          color: "#E4130C",
          margin: 0,
          textAlign: "center",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </p>
    </div>
  );
}
