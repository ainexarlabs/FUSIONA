import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { LanguageSwitch } from './LanguageSwitch';
import { useLocale } from '@/i18n';

export function ClientHeader({ backLink }: { backLink?: { to: string; label: string } }) {
  const { t } = useLocale();

  return (
    <header className="flex items-center justify-between border-b border-black/[.06] bg-white px-5 py-3.5 sm:px-10 sm:py-[18px]">
      <Link to="/">
        <Logo />
      </Link>
      <div className="flex items-center gap-5">
        {backLink ? (
          <Link to={backLink.to} className="hidden text-[12.5px] font-semibold text-neutral-500 sm:block">
            {backLink.label}
          </Link>
        ) : (
          <nav className="hidden gap-6 text-[13px] font-semibold text-fusiona-black sm:flex">
            <span>{t.nav.properties}</span>
            <span className="text-neutral-400">{t.nav.about}</span>
            <span className="text-neutral-400">{t.nav.contact}</span>
          </nav>
        )}
        <LanguageSwitch />
      </div>
    </header>
  );
}
