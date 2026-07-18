import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useLocale } from '@/i18n';

interface PropertyQRProps {
  url: string;
  folio: string;
  size?: number;
}

export function PropertyQR({ url, folio, size = 180 }: PropertyQRProps) {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: { dark: '#101010', light: '#FFFFFF' },
    }).catch(() => undefined);
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#101010', light: '#FFFFFF' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [url, size]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/[.07] bg-white p-4">
      <canvas ref={canvasRef} width={size} height={size} className="rounded-md" />
      <span className="font-mono text-[11px] font-semibold text-neutral-500">{folio}</span>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`fusiona-${folio}.png`}
          className="text-[11px] font-bold uppercase tracking-wide text-fusiona-red hover:text-fusiona-red-dark"
        >
          {t.detail.downloadQR}
        </a>
      )}
    </div>
  );
}
