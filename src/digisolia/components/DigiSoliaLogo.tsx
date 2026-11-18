import React from 'react';

interface DigiSoliaLogoProps {
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  logoUrl?: string;
}

export const DigiSoliaLogo: React.FC<DigiSoliaLogoProps> = ({
  subtitle,
  size = 'md',
  inverted = false,
  logoUrl,
}) => {
  const boxSize =
    size === 'lg' ? 'h-12 w-12 rounded-2xl' : size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';
  const titleSize =
    size === 'lg' ? 'text-xl sm:text-2xl' : size === 'sm' ? 'text-sm' : 'text-base sm:text-lg';

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="DIGISOLIA"
          className={`${boxSize} object-contain shrink-0`}
        />
      ) : (
        <div
          className={`${boxSize} flex items-center justify-center shrink-0 shadow-xs`}
          style={{
            background: 'linear-gradient(135deg, #163B65 0%, #2783C7 100%)',
          }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className={size === 'lg' ? 'h-7 w-7' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}
          >
            <path
              d="M7 8.5C7 7.67 7.67 7 8.5 7H15.5C20.75 7 25 11.03 25 16C25 20.97 20.75 25 15.5 25H8.5C7.67 25 7 24.33 7 23.5V8.5Z"
              stroke="white"
              strokeWidth="2.4"
            />
            <path
              d="M12.5 12.2H15.4C17.8 12.2 19.7 13.9 19.7 16C19.7 18.1 17.8 19.8 15.4 19.8H12.5V12.2Z"
              fill="white"
            />
          </svg>
        </div>
      )}

      <div className="min-w-0 leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-extrabold tracking-tight ${titleSize} ${
              inverted ? 'text-white' : 'text-[#163B65] dark:text-white'
            }`}
          >
            DIGI<span className={inverted ? 'text-sky-300' : 'text-[#2783C7] dark:text-sky-400'}>SOLIA</span>
          </span>
          {subtitle && (
            <span
              className={`text-xs font-semibold truncate ${
                inverted ? 'text-sky-200' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              · {subtitle}
            </span>
          )}
        </div>
        {size !== 'sm' && (
          <p
            className={`text-[11px] font-medium truncate ${
              inverted ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            La technologie au service de vos activités.
          </p>
        )}
      </div>
    </div>
  );
};
