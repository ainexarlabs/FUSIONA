import { useLocale } from '@/i18n';

export function LanguageSwitch({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { locale, setLocale } = useLocale();
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-[10px]' : 'px-3 py-1.5 text-[11px]';

  return (
    <div className="flex overflow-hidden rounded-full border border-black/10 font-bold">
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`${pad} transition-colors ${
          locale === 'es' ? 'bg-fusiona-black text-white' : 'text-neutral-500'
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`${pad} transition-colors ${
          locale === 'en' ? 'bg-fusiona-black text-white' : 'text-neutral-500'
        }`}
      >
        EN
      </button>
    </div>
  );
}
