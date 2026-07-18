import { Link, NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { LanguageSwitch } from './LanguageSwitch';
import { useLocale } from '@/i18n';
import { buildWhatsAppContactLink } from '@/lib/whatsapp';

export function ClientHeader({ backLink }: { backLink?: { to: string; label: string } }) {
  const { t } = useLocale();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[13px] font-semibold transition-colors ${
      isActive ? 'text-fusiona-black' : 'text-neutral-500 hover:text-fusiona-black'
    }`;

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
          <nav className="hidden gap-6 sm:flex">
            <NavLink to="/" end className={navLinkClass}>
              {t.nav.properties}
            </NavLink>
            <NavLink to="/nosotros" className={navLinkClass}>
              {t.nav.about}
            </NavLink>
            <a
              href={buildWhatsAppContactLink()}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-semibold text-neutral-500 transition-colors hover:text-fusiona-black"
            >
              {t.nav.contact}
            </a>
          </nav>
        )}
        <LanguageSwitch />
      </div>
    </header>
  );
}
