import logoSrc from "@/assets/zz-logo.png";

export function HoloLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={logoSrc}
        alt="Zanzibar"
        className="h-full w-full object-contain"
        loading="lazy"
        width={64}
        height={64}
      />
    </span>
  );
}
