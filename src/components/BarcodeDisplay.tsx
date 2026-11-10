import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Maximize2, Copy, Check } from 'lucide-react';

interface BarcodeDisplayProps {
  value: string;
  height?: number;
  width?: number;
  showText?: boolean;
  className?: string;
  allowZoom?: boolean;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  height = 56,
  width = 2,
  showText = true,
  className = '',
  allowZoom = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomSvgRef = useRef<SVGSVGElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Render normal barcode
  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      setHasError(false);
      JsBarcode(svgRef.current, value.trim(), {
        format: 'CODE128',
        width: width,
        height: height,
        displayValue: showText,
        font: 'monospace',
        fontSize: 13,
        textMargin: 3,
        margin: 8,
        background: '#ffffff',
        lineColor: '#0f172a',
      });
    } catch (err) {
      console.warn('JsBarcode render fallback for:', value, err);
      // Fallback try with generic auto or minimal options
      try {
        JsBarcode(svgRef.current, value.trim(), {
          format: 'CODE39',
          width: width,
          height: height,
          displayValue: showText,
          margin: 8,
          background: '#ffffff',
          lineColor: '#0f172a',
        });
      } catch (e2) {
        setHasError(true);
      }
    }
  }, [value, height, width, showText]);

  // Render zoomed barcode when modal is open
  useEffect(() => {
    if (!isZoomed || !zoomSvgRef.current || !value) return;

    try {
      JsBarcode(zoomSvgRef.current, value.trim(), {
        format: 'CODE128',
        width: 3,
        height: 110,
        displayValue: true,
        font: 'monospace',
        fontSize: 20,
        textMargin: 8,
        margin: 16,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch {
      try {
        JsBarcode(zoomSvgRef.current, value.trim(), {
          format: 'CODE39',
          width: 3,
          height: 110,
          displayValue: true,
          margin: 16,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch {
        // ignore
      }
    }
  }, [isZoomed, value]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (hasError) {
    return (
      <div className="bg-slate-100 rounded-lg p-2 text-center text-xs text-slate-500 font-mono border border-slate-200">
        <span className="font-bold">{value}</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative group bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-1.5 transition-all shadow-2xs flex flex-col items-center justify-center cursor-pointer ${className}`}
        onClick={() => allowZoom && setIsZoomed(true)}
        title="Klik untuk memperbesar barcode layar penuh"
      >
        <svg ref={svgRef} className="max-w-full h-auto rounded" />

        {/* Hover quick action overlay */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-2xs transition-colors"
            title="Salin nomor barcode"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
          {allowZoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(true);
              }}
              className="p-1 rounded-md bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-2xs transition-colors"
              title="Perbesar Barcode"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Magnified Barcode Modal for Easy Scanning from Another Device */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Mode Scan Barcode
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  Arahkan Scanner ke Barcode Ini
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* High-visibility large barcode */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center overflow-x-auto">
              <svg ref={zoomSvgRef} className="max-w-full h-auto" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-left">
                <p className="text-xs text-slate-500">Nomor Bagseal:</p>
                <p className="text-base font-mono font-extrabold text-slate-900">{value}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Nomor</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
