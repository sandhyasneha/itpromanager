// ============================================================
// src/components/NexPlanLogo.tsx
// NEW FILE — Reusable NexPlan logo component
// Usage:
//   <NexPlanLogo />                    — default medium
//   <NexPlanLogo size="sm" />          — small (topbar/nav)
//   <NexPlanLogo size="lg" />          — large (marketing hero)
//   <NexPlanLogo dark />               — light text for dark bg
//   <NexPlanLogo showTagline />        — with "IT Project Intelligence"
// ============================================================

interface NexPlanLogoProps {
  size?:        'sm' | 'md' | 'lg'
  dark?:        boolean   // light text for dark backgrounds
  showTagline?: boolean
  className?:   string
}

export default function NexPlanLogo({
  size        = 'md',
  dark        = false,
  showTagline = false,
  className   = '',
}: NexPlanLogoProps) {

  const sizes = {
    sm: { wrap: 'w-7 h-7 rounded-[8px]',  bolt: 14, text: 'text-base',  gap: 'gap-2'   },
    md: { wrap: 'w-8 h-8 rounded-[9px]',  bolt: 17, text: 'text-lg',   gap: 'gap-2.5' },
    lg: { wrap: 'w-11 h-11 rounded-[12px]', bolt: 22, text: 'text-2xl', gap: 'gap-3'   },
  }

  const s = sizes[size]

  return (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>

      {/* ── Icon ────────────────────────────────────────── */}
      <div className={`${s.wrap} bg-cyan-500 flex items-center justify-center shrink-0`}
        style={{ boxShadow: '0 2px 10px rgba(6,182,212,0.4)' }}>
        <svg
          width={s.bolt}
          height={s.bolt}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true">
          {/* Lightning bolt — main shape */}
          <path
            d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
            fill="white"
            stroke="white"
            strokeWidth="0.4"
            strokeLinejoin="round"
          />
          {/* Network nodes — connectivity dots */}
          <circle cx="3.5"  cy="5"  r="1.5" fill="white" opacity="0.55"/>
          <circle cx="20.5" cy="5"  r="1.5" fill="white" opacity="0.55"/>
          <circle cx="20.5" cy="19" r="1.5" fill="white" opacity="0.55"/>
          {/* Connector lines */}
          <line x1="3.5"  y1="5" x2="13" y2="2" stroke="white" strokeWidth="1" opacity="0.35"/>
          <line x1="20.5" y1="5" x2="13" y2="2" stroke="white" strokeWidth="1" opacity="0.35"/>
        </svg>
      </div>

      {/* ── Text ────────────────────────────────────────── */}
      <div>
        <div className={`font-syne font-black ${s.text} leading-none tracking-tight
          ${dark ? 'text-white' : 'text-slate-900'}`}>
          Nex<span className="text-cyan-500">Plan</span>
        </div>
        {showTagline && (
          <p className={`text-[10px] leading-none mt-1 font-mono-code tracking-wide
            ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            IT Project Intelligence
          </p>
        )}
      </div>

    </div>
  )
}
