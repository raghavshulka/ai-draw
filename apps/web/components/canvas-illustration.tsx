/** Decorative sketch of a shared canvas with two live cursors. Pure SVG, no images. */
export function CanvasIllustration() {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="ml-3 truncate font-mono text-xs text-muted-foreground">room / design-review</span>
      </div>
      <svg viewBox="0 0 560 300" className="block h-auto w-full text-foreground">
        <defs>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" className="fill-muted-foreground/25" />
          </pattern>
        </defs>
        <rect width="560" height="300" fill="url(#dots)" />

        {/* sketched boxes and an arrow */}
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M62 78 L196 74 L199 146 L60 150 Z" />
          <path d="M330 70 L478 72 L476 140 L332 142 Z" />
          <path d="M204 112 C 240 104, 280 104, 322 108" />
          <path d="M310 98 L324 108 L309 118" />
          <path d="M150 214 C 180 190, 210 238, 244 212 S 300 196, 330 222" stroke="#2563eb" />
        </g>
        <g className="fill-muted-foreground font-mono" fontSize="13">
          <text x="92" y="117">client</text>
          <text x="370" y="111">ws relay</text>
        </g>

        {/* cursor 1 */}
        <g transform="translate(330 222)">
          <path d="M0 0 L0 18 L5 13.5 L9 22 L12.5 20.5 L8.5 12 L15 12 Z" fill="#2563eb" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="14" y="22" width="44" height="20" rx="5" fill="#2563eb" />
          <text x="36" y="36" textAnchor="middle" fill="#fff" fontSize="11" className="font-sans" fontWeight="600">You</text>
        </g>
        {/* cursor 2 */}
        <g transform="translate(452 168)">
          <path d="M0 0 L0 18 L5 13.5 L9 22 L12.5 20.5 L8.5 12 L15 12 Z" fill="#c2410c" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="14" y="22" width="70" height="20" rx="5" fill="#c2410c" />
          <text x="49" y="36" textAnchor="middle" fill="#fff" fontSize="11" className="font-sans" fontWeight="600">Teammate</text>
        </g>
        <path d="M402 160 C 420 150, 436 156, 452 168" fill="none" stroke="#c2410c" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
