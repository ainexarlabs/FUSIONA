import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/i18n';
import { supabase } from '@/lib/supabaseClient';

export function Login() {
  const { t } = useLocale();
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/admin';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    if (signInError) {
      setError(t.admin.login.error);
      return;
    }
    navigate('/admin');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fusiona-bg px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[340px] flex-col items-center gap-4">
        <Logo className="items-center" />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
          {t.admin.login.panelTitle}
        </span>

        <div className="flex w-full flex-col gap-2.5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.admin.login.email}
            className="rounded-[11px] border border-black/10 bg-white px-4 py-3.5 text-sm font-medium text-neutral-700 outline-none focus:border-fusiona-black"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.admin.login.password}
            className="rounded-[11px] border border-black/10 bg-white px-4 py-3.5 text-sm font-medium text-neutral-700 outline-none focus:border-fusiona-black"
          />
        </div>

        {error && <p className="text-xs font-semibold text-fusiona-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[11px] bg-fusiona-red py-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-fusiona-red-dark disabled:opacity-60"
        >
          {submitting ? t.common.loading : t.admin.login.enter}
        </button>
        <span className="text-[11.5px] font-medium text-neutral-400">{t.admin.login.forgot}</span>
      </form>
    </div>
  );
}
