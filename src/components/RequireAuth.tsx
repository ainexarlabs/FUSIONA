import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/i18n';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  const { t } = useLocale();
  const location = useLocation();

  if (loading) {
    return <p className="py-24 text-center text-sm font-medium text-neutral-500">{t.common.loading}</p>;
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
