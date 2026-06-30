interface SavingsJarProps {
  /** 0-100, persentase isi pot */
  fillPercent?: number;
  className?: string;
}

/**
 * Ilustrasi pot kaca berisi koin & uang lipat, levelnya naik sesuai
 * fillPercent. Ini adalah signature visual element aplikasi —
 * representasi konkret dari "tabungan bersama" yang lebih personal
 * dibanding progress bar generik.
 */
export default function SavingsJar({
  fillPercent = 35,
  className = "",
}: SavingsJarProps) {
  const clamped = Math.max(0, Math.min(100, fillPercent));
  // Tinggi area isi pot (dari y=78 dasar ke y=30 leher), makin besar % makin tinggi cairan
  const jarBottom = 168;
  const jarTop = 56;
  const fillY = jarBottom - (clamped / 100) * (jarBottom - jarTop);

  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Pot tabungan terisi ${clamped} persen`}
    >
      <defs>
        <clipPath id="jarClip">
          <path d="M58 60 C58 50, 62 44, 72 44 L128 44 C138 44, 142 50, 142 60 L150 170 C150 186, 138 196, 122 196 L78 196 C62 196, 50 186, 50 170 Z" />
        </clipPath>
        <linearGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE3A8" />
          <stop offset="100%" stopColor="#F0B94B" />
        </linearGradient>
      </defs>

      {/* Tutup pot */}
      <rect x="70" y="28" width="60" height="16" rx="5" fill="#E0476A" />
      <rect x="64" y="38" width="72" height="12" rx="6" fill="#FF6B8A" />

      {/* Badan pot (outline) */}
      <path
        d="M58 60 C58 50, 62 44, 72 44 L128 44 C138 44, 142 50, 142 60 L150 170 C150 186, 138 196, 122 196 L78 196 C62 196, 50 186, 50 170 Z"
        fill="#FBFDFB"
        stroke="#FFD9E0"
        strokeWidth="3"
      />

      {/* Isi: cairan/uang naik sesuai persentase, clipped di bentuk pot */}
      <g clipPath="url(#jarClip)">
        <rect
          x="40"
          y={fillY}
          width="120"
          height="140"
          fill="#FFEDE4"
        />
        {/* Koin-koin */}
        <circle cx="85" cy={fillY + 14} r="11" fill="url(#coinGrad)" />
        <circle cx="115" cy={fillY + 8} r="13" fill="url(#coinGrad)" />
        <circle cx="100" cy={fillY + 30} r="10" fill="url(#coinGrad)" />
        <circle cx="70" cy={fillY + 34} r="9" fill="url(#coinGrad)" />
        <circle cx="128" cy={fillY + 32} r="9" fill="url(#coinGrad)" />
        {/* Uang lipat */}
        <rect
          x="66"
          y={fillY + 46}
          width="68"
          height="22"
          rx="3"
          fill="#A7E3C4"
          stroke="#3FAE7A"
          strokeWidth="1.5"
        />
        <circle cx="100" cy={fillY + 57} r="6" fill="#3FAE7A" opacity="0.5" />
      </g>

      {/* Highlight kaca */}
      <path
        d="M64 56 C64 52, 66 50, 70 50"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M60 70 L56 168 C56 178, 64 186, 76 188"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />
    </svg>
  );
}
