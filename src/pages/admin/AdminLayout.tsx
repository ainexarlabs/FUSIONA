import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/i18n';
import { supabase } from '@/lib/supabaseClient';

export function AdminLayout() {
  const { t } = useLocale();
  const { session } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-[9px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${
      isActive ? 'bg-fusiona-black text-white' : 'text-neutral-500 hover:bg-black/[.03]'
    }`;

  return (
    <div className="grid min-h-screen grid-cols-1 bg-fusiona-bg lg:grid-cols-[210px_1fr]">
      <aside className="flex flex-col gap-6 border-r border-black/[.07] bg-white p-4 lg:min-h-screen">
        <Logo className="px-2" />
        <nav className="flex flex-col gap-1">
          <NavLink to="/admin" end className={navItemClass}>
            {t.admin.nav.inventory}
          </NavLink>
          <NavLink to="/admin/visitas" className={navItemClass}>
            {t.admin.nav.visits}
          </NavLink>
          <NavLink to="/admin/ajustes" className={navItemClass}>
            {t.admin.nav.settings}
          </NavLink>
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-2 text-[11.5px] font-medium text-neutral-400">
          <div className="flex items-center justify-between">
            <span className="truncate">{session?.user.email}</span>
            <LanguageSwitch size="sm" />
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="text-left text-neutral-300 hover:text-fusiona-red"
          >
            {t.admin.nav.logout}
          </button>
        </div>
      </aside>
      <main className="p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
