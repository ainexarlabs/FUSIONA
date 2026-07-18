import { ClientHeader } from '@/components/ClientHeader';
import { useLocale } from '@/i18n';
import { buildWhatsAppContactLink } from '@/lib/whatsapp';

export function About() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-fusiona-bg">
      <ClientHeader />
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-16 sm:px-10 sm:py-24">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-fusiona-red">
          Fusiona Real Estate
        </span>
        <h1 className="font-sans text-4xl font-extrabold uppercase leading-tight text-fusiona-black sm:text-5xl">
          {t.about.title}
        </h1>
        <p className="text-base font-medium leading-relaxed text-neutral-700">{t.about.intro}</p>
        <div className="rounded-2xl border border-black/[.07] bg-white p-6 text-sm font-medium leading-relaxed text-neutral-600">
          {t.about.placeholder}
        </div>
        <a
          href={buildWhatsAppContactLink()}
          target="_blank"
          rel="noreferrer"
          className="w-fit rounded-xl bg-fusiona-red px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-fusiona-red-dark"
        >
          {t.about.contactCta}
        </a>
      </section>
    </div>
  );
}
