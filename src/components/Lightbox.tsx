import { useEffect } from 'react';
import { useLocale } from '@/i18n';

interface LightboxProps {
  photos: { url: string; alt: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  caption?: string;
}

export function Lightbox({ photos, index, onClose, onPrev, onNext, caption }: LightboxProps) {
  const { t } = useLocale();
  const current = photos[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrev();
      if (event.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={onClose}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t.detail.closeGallery}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white transition-colors hover:bg-white/20"
      >
        ×
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label={t.detail.previousPhoto}
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white transition-colors hover:bg-white/20 sm:h-14 sm:w-14"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label={t.detail.nextPhoto}
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white transition-colors hover:bg-white/20 sm:h-14 sm:w-14"
          >
            ›
          </button>
        </>
      )}

      <div className="flex max-h-full max-w-full flex-col items-center gap-3 px-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.url}
          alt={current.alt}
          className="max-h-[80vh] max-w-full rounded-lg object-contain"
        />
        <div className="flex items-center gap-3 text-xs font-medium text-white/70">
          <span>
            {index + 1} {t.detail.of} {photos.length}
          </span>
          {caption && <span className="hidden sm:inline">— {caption}</span>}
        </div>
      </div>
    </div>
  );
}
