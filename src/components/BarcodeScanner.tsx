import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Flashlight,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Keyboard,
  Barcode,
  Hash,
  ExternalLink,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { determineBarcodeQty } from '../utils/bagsealLogic';
import { playScanSuccessBeep, playDuplicateAlertBeep } from '../utils/audio';

interface Props {
  onBarcodeScanned: (barcode: string, qty: number) => void;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  recentBarcodes: string[];
}

export const BarcodeScanner: React.FC<Props> = ({
  onBarcodeScanned,
  isActive,
  onToggleActive,
  recentBarcodes,
}) => {
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'device' | 'iframe' | 'other' | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{
    barcode: string;
    qty: number;
    time: number;
  } | null>(null);

  // Dedicated manual input fields (Barcode + Kolom Qty)
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [showManualBox, setShowManualBox] = useState(true);

  // Camera scan Qty mode
  const [activeScanQtySetting, setActiveScanQtySetting] = useState<string>('1');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});
  const containerId = 'html5-barcode-scanner-view';

  // Handle scanned code with automatic no-click submission
  const handleScannedCode = useCallback(
    (decodedText: string, forcedQty?: number) => {
      const cleanBarcode = decodedText.trim();
      if (!cleanBarcode) return;

      const now = Date.now();
      const lastTime = lastScannedTimeRef.current[cleanBarcode] || 0;

      // Duplicate debounce threshold: 2 seconds
      if (now - lastTime < 2000) {
        return;
      }
      lastScannedTimeRef.current[cleanBarcode] = now;

      // Determine quantity: use forcedQty if provided, or activeScanQtySetting, or auto-detect
      let finalQty = 1;
      if (forcedQty !== undefined && forcedQty > 0) {
        finalQty = forcedQty;
      } else if (activeScanQtySetting !== 'auto' && parseInt(activeScanQtySetting, 10) > 0) {
        finalQty = parseInt(activeScanQtySetting, 10);
      } else {
        finalQty = determineBarcodeQty(cleanBarcode);
      }

      // Audio & haptic feedback
      if (recentBarcodes.includes(cleanBarcode)) {
        playDuplicateAlertBeep();
      } else {
        playScanSuccessBeep();
      }

      // Visual feedback HUD
      setLastScannedFeedback({ barcode: cleanBarcode, qty: finalQty, time: now });

      // Automatically dispatch to parent WITHOUT requiring user to click submit
      onBarcodeScanned(cleanBarcode, finalQty);

      // Auto-clear HUD after 2.5s
      setTimeout(() => {
        setLastScannedFeedback((curr) => (curr?.time === now ? null : curr));
      }, 2500);
    },
    [onBarcodeScanned, recentBarcodes, activeScanQtySetting]
  );

  // Initialize camera scanner directly using facingMode for maximal browser compatibility
  useEffect(() => {
    let isMounted = true;

    if (!isActive) {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .then(() => {
            scannerRef.current = null;
            setScannerReady(false);
          });
      }
      return;
    }

    const startCamera = async () => {
      try {
        setCameraError(null);
        setErrorType(null);

        // Check if mediaDevices exists
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError(
            'Browser Anda tidak mendukung WebRTC camera API atau halaman tidak diakses melalui koneksi aman (HTTPS).'
          );
          setErrorType('device');
          return;
        }

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minDim * 0.85),
              height: Math.floor(minDim * 0.55),
            };
          },
          aspectRatio: 1.333333,
        };

        // Try facingMode: environment first (Back camera)
        try {
          await html5QrCode.start(
            { facingMode: facingMode },
            config,
            (decodedText) => {
              handleScannedCode(decodedText);
            },
            () => {
              // Frame tick
            }
          );
        } catch (firstErr: any) {
          console.warn('Failed with primary facingMode, trying fallback...', firstErr);
          // If environment failed (e.g. laptop webcam without back camera), fallback to 'user'
          if (facingMode === 'environment') {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              (decodedText) => {
                handleScannedCode(decodedText);
              },
              () => {}
            );
            setFacingMode('user');
          } else {
            throw firstErr;
          }
        }

        if (!isMounted) return;
        setScannerReady(true);

        // Check torch capability
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          if (capabilities && (capabilities as any).torch) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Camera scanner initialization error:', err);

        const errMsg = String(err?.message || err || '');
        if (
          errMsg.includes('NotAllowedError') ||
          errMsg.includes('Permission denied') ||
          errMsg.includes('Permission dismissed')
        ) {
          setErrorType('permission');
          setCameraError(
            'Izin kamera diblokir oleh browser atau iframe. Silakan izinkan akses kamera pada ikon gembok di browser Anda.'
          );
        } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
          setErrorType('device');
          setCameraError('Tidak ada perangkat kamera yang terdeteksi pada perangkat ini.');
        } else if (errMsg.includes('NotReadableError') || errMsg.includes('TrackStartError')) {
          setErrorType('device');
          setCameraError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang memakai kamera.');
        } else {
          setErrorType('other');
          setCameraError(
            errMsg || 'Gagal memulai kamera. Coba buka aplikasi langsung di tab baru atau gunakan tombol foto di bawah.'
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isActive, facingMode, handleScannedCode]);

  // Toggle Torch
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Failed to toggle torch', e);
    }
  };

  // Flip Camera (environment <-> user)
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Direct Photo Capture Scan fallback (works on all mobile browsers via native camera!)
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(containerId, { verbose: false });
      }

      const decodedText = await scanner.scanFile(file, true);
      handleScannedCode(decodedText);
    } catch (err) {
      console.warn('Failed to decode barcode from image', err);
      alert('Tidak dapat mendeteksi barcode pada foto tersebut. Pastikan barcode terlihat jelas dan fokus.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle manual submit with explicit barcode and QTY columns
  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const barcode = manualBarcode.trim();
    if (!barcode) return;

    const parsedQty = Math.max(1, parseInt(manualQty, 10) || 1);
    handleScannedCode(barcode, parsedQty);
    setManualBarcode('');
  };

  // Keyboard wedge listener for laser scanners
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleScannedCode(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScannedCode]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
      {/* Scanner Control Bar */}
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isActive && scannerReady ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          ></div>
          <span className="text-xs font-bold tracking-wide uppercase">
            Auto-Scan Viewport (No Click Required)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && isActive && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                torchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Flashlight / Senter"
              aria-label="Toggle flashlight"
            >
              <Flashlight className="w-3.5 h-3.5" />
            </button>
          )}

          {isActive && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              title={`Ganti Kamera (${facingMode === 'environment' ? 'Belakang' : 'Depan'})`}
              aria-label="Switch camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleActive(!isActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              isActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold shadow-sm'
            }`}
            aria-label={isActive ? 'Pause camera scanner' : 'Start camera scanner'}
          >
            {isActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>Matikan Kamera</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Nyalakan Kamera</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Camera Scan Qty Selector Bar */}
      <div className="px-3.5 py-2 bg-slate-800 border-b border-slate-700 text-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-[11px] text-slate-300">
            Kolom Qty Default per Scan:
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {['1', '5', '10', '15', '20'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setActiveScanQtySetting(val)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                activeScanQtySetting === val
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {val}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveScanQtySetting('auto')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
              activeScanQtySetting === 'auto'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Auto-detect or manifest lookup"
          >
            Auto
          </button>
          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-600">
            <span className="text-[10px] text-slate-400">Custom:</span>
            <input
              type="number"
              min="1"
              value={activeScanQtySetting === 'auto' ? '' : activeScanQtySetting}
              onChange={(e) => setActiveScanQtySetting(e.target.value || '1')}
              placeholder="Qty"
              className="w-12 px-1.5 py-0.5 text-[11px] font-bold text-center bg-slate-900 border border-slate-600 rounded text-emerald-400 focus:outline-hidden focus:border-emerald-400 tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Camera Viewfinder Area */}
      <div className="relative bg-slate-950 min-h-[220px] sm:min-h-[270px] flex items-center justify-center overflow-hidden">
        {/* html5-qrcode video container */}
        <div
          id={containerId}
          className={`w-full transition-opacity duration-300 ${isActive && !cameraError ? 'opacity-100' : 'hidden'}`}
          style={{ minHeight: '220px' }}
        />

        {/* Inactive / Camera Error Fallback UI */}
        {(!isActive || cameraError) && (
          <div className="p-6 text-center text-slate-400 max-w-md mx-auto">
            {cameraError ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Kendala Akses Kamera</h4>
                <p className="text-xs text-amber-200/90 leading-relaxed bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-xl">
                  {cameraError}
                </p>

                {/* Helpful troubleshooting options */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  {/* Buka di Tab Baru / Standalone Link */}
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Tab Baru / Layar Penuh</span>
                  </a>

                  {/* Native Mobile Camera Photo Snapper */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ambil Foto Barcode</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 text-left bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-1">💡 Tips Mengaktifkan Kamera:</span>
                  1. <strong>Izin Browser:</strong> Klik ikon gembok / pengaturan di samping URL browser, ubah izin <strong>Camera</strong> ke <strong>Allow / Izinkan</strong>.<br />
                  2. <strong>Akses Langsung:</strong> Jika dibuka di dalam preview frame AI Studio, klik &apos;Buka di Tab Baru&apos; agar browser HP meminta izin kamera langsung.<br />
                  3. <strong>Input Manual / Scanner Laser:</strong> Anda tetap bisa memasukkan nomor bagseal dan Qty di kolom bawah tanpa kamera.
                </div>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Kamera Scanner Sedang Nonaktif</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                  Klik tombol di bawah untuk menyalakan kamera hp Anda guna memindai barcode bagseal secara instan.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleActive(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Nyalakan Kamera Scanner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Ambil Foto Barcode</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden native mobile camera photo input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileScan}
          className="hidden"
        />

        {/* Viewfinder Overlay with Animated Laser when active */}
        {isActive && !cameraError && scannerReady && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Guide box */}
            <div className="relative w-64 h-36 border-2 border-emerald-400/70 rounded-xl overflow-hidden shadow-2xl">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-emerald-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-emerald-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-emerald-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-emerald-400"></div>

              {/* Animated laser scan line */}
              <div
                className="w-full h-0.5 bg-linear-to-r from-transparent via-red-500 to-transparent absolute shadow-[0_0_12px_#ef4444]"
                style={{
                  animation: 'scannerLine 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </div>
            <style>{`
              @keyframes scannerLine {
                0% { top: 4%; }
                50% { top: 92%; }
                100% { top: 4%; }
              }
            `}</style>
          </div>
        )}

        {/* Last Scanned Instant Notification Toast / HUD */}
        {lastScannedFeedback && (
          <div className="absolute bottom-3 left-3 right-3 z-30 bg-emerald-600 text-white p-3 rounded-xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-wider text-emerald-100 uppercase">
                  Auto-Added (No-Click)
                </div>
                <div className="font-mono text-xs font-bold truncate max-w-[200px]">
                  {lastScannedFeedback.barcode}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-emerald-200 block uppercase font-medium">Qty Masuk</span>
              <span className="text-base font-extrabold tabular-nums bg-white/20 px-2 py-0.5 rounded-md">
                +{lastScannedFeedback.qty}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED INPUT SECTION: KOLOM NOMOR BAGSEAL + KOLOM QTY */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Barcode className="w-4 h-4 text-blue-600" />
            <span>Kolom Input Bagseal &amp; Qty Langsung</span>
          </div>
          <button
            type="button"
            onClick={() => setShowManualBox(!showManualBox)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{showManualBox ? 'Sembunyikan Form' : 'Tampilkan Form'}</span>
          </button>
        </div>

        {/* Form with dedicated Barcode Column AND Qty Column */}
        {showManualBox && (
          <form onSubmit={handleManualSubmit} className="space-y-2 mb-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Kolom 1: Nomor Bagseal */}
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kolom Nomor Bagseal:
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    data-testid="input-manual-barcode"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Scan / ketik nomor bagseal (misal BS-99120)..."
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Kolom 2: Kolom Qty (Quantity Isi) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kolom Qty (Isi):
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="number"
                    data-testid="input-manual-qty"
                    min="1"
                    max="9999"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    placeholder="Qty"
                    className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white tabular-nums text-center text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Tombol Scan / Tambah */}
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <span>+ Scan/Tambah</span>
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              💡 Masukkan nomor bagseal dan isi kolom Qty, lalu tekan Enter atau klik Scan/Tambah.
            </div>
          </form>
        )}

        {/* Quick Testing Barcode Presets with prefilled Qty */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Preset Cepat (Uji Scan Otomatis):</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { code: 'BS-SKMJ-1024-Q15', label: 'SKMJ Pack', qty: 15 },
              { code: 'DOC-SKMJ-8021-Q8', label: 'Docs Express', qty: 8 },
              { code: 'HV-VAL-9921-Q5', label: 'High Value', qty: 5 },
              { code: 'BP-BULK-092-Q30', label: 'Bulk Freight', qty: 30 },
            ].map((sample) => (
              <button
                key={sample.code}
                type="button"
                onClick={() => handleScannedCode(sample.code, sample.qty)}
                className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 active:bg-blue-100 transition-all shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    {sample.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-200">
                    Qty: {sample.qty}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{sample.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
