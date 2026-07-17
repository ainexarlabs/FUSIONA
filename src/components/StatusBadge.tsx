import type { PropertyStatus, VisitStatus } from '@/types/database';
import { useLocale } from '@/i18n';

const PROPERTY_STYLES: Record<PropertyStatus, string> = {
  activa: 'bg-[#EAF6EC] text-[#217A3C]',
  pausada: 'bg-[#FBF3E2] text-[#9A6B12]',
  vendida: 'bg-[#F6EAEA] text-[#A32B22]',
  rentada: 'bg-[#F6EAEA] text-[#A32B22]',
};

const VISIT_STYLES: Record<VisitStatus, string> = {
  pendiente: 'bg-[#FBF3E2] text-[#9A6B12]',
  confirmada: 'bg-[#EAF6EC] text-[#217A3C]',
  cancelada: 'bg-[#F6EAEA] text-[#A32B22]',
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const { t } = useLocale();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold ${PROPERTY_STYLES[status]}`}
    >
      {t.status[status]}
    </span>
  );
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const { t } = useLocale();
  const labels: Record<VisitStatus, string> = {
    pendiente: t.admin.visits.statusPending,
    confirmada: t.admin.visits.statusConfirmed,
    cancelada: t.admin.visits.statusCancelled,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold ${VISIT_STYLES[status]}`}
    >
      {labels[status]}
    </span>
  );
}
