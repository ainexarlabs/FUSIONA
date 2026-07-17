interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} aria-label="Fusiona Real Estate">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-fusiona-black text-sm font-extrabold text-white">
          F
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col leading-none ${className}`} aria-label="Fusiona Real Estate">
      <span className="font-sans text-lg font-extrabold uppercase tracking-wide text-fusiona-black">
        Fusiona<span className="text-fusiona-red">.</span>
      </span>
      <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
        Real Estate
      </span>
    </div>
  );
}
