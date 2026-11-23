interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'hero';
  onClick?: () => void;
}

export function BrandLogo({ variant = 'full', onClick }: BrandLogoProps) {
  const iconSize = variant === 'hero' ? 'h-12 w-12' : variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10';

  const content = (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Custom Vector Studio Emblem: Indigo-Obsidian Soundwave + Emerald Microphone */}
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="studio-badge-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="11" fill="url(#studio-badge-grad)" />
        <rect
          x="1.25"
          y="1.25"
          width="41.5"
          height="41.5"
          rx="9.75"
          stroke="#6366F1"
          strokeOpacity="0.65"
          strokeWidth="1.25"
        />
        {/* Acoustic waveform bars */}
        <rect x="9" y="18" width="3" height="8" rx="1.5" fill="#818CF8" />
        <rect x="14.5" y="13" width="3" height="18" rx="1.5" fill="#C7D2FE" />
        {/* Center microphone capsule */}
        <rect x="20" y="9" width="4.5" height="15" rx="2.25" fill="#FFFFFF" />
        <path
          d="M17.25 21.5C17.25 24.2614 19.4886 26.5 22.25 26.5C25.0114 26.5 27.25 24.2614 27.25 21.5"
          stroke="#10B981"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <line
          x1="22.25"
          y1="26.5"
          x2="22.25"
          y2="32.5"
          stroke="#10B981"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <line
          x1="18.75"
          y1="32.5"
          x2="25.75"
          y2="32.5"
          stroke="#E0E7FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Right waveform bars */}
        <rect x="29.5" y="13" width="3" height="18" rx="1.5" fill="#C7D2FE" />
        <rect x="35" y="18" width="3" height="8" rx="1.5" fill="#818CF8" />
      </svg>

      {/* Arabic Brand Wordmark */}
      <div className="min-w-0 text-right leading-tight">
        <span
          className={`block font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap ${
            variant === 'hero'
              ? 'text-base sm:text-lg'
              : variant === 'compact'
                ? 'text-xs sm:text-sm'
                : 'text-[13px]'
          }`}
        >
          توليد كلام من نص مجاناً
        </span>
        <span
          className={`block font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap ${
            variant === 'hero' ? 'mt-0.5 text-xs' : 'mt-0.5 text-[10px]'
          }`}
        >
          صوت ستوديو · بالذكاء الاصطناعي
        </span>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-right transition-opacity hover:opacity-85 focus:outline-none"
        aria-label="توليد كلام من نص مجاناً — صوت ستوديو"
      >
        {content}
      </button>
    );
  }

  return content;
}
