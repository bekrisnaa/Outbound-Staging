import React, { useState } from 'react';
import { TripHistoryRecord, StagingSummary } from '../types';
import { BarcodeDisplay } from './BarcodeDisplay';
import { Maximize2, QrCode, Eye, EyeOff } from 'lucide-react';

interface TripHistoryViewProps {
  historyRecords: TripHistoryRecord[];
  onDeleteRecord: (id: string) => void;
  onSyncRecordToSheets?: (record: TripHistoryRecord) => void;
  onBackToScan: () => void;
}

export const TripHistoryView: React.FC<TripHistoryViewProps> = ({
  historyRecords,
  onDeleteRecord,
  onSyncRecordToSheets,
  onBackToScan,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    historyRecords.length > 0 ? historyRecords[0].id : null
  );
  const [copiedBatchId, setCopiedBatchId] = useState<string | null>(null);
  // Default to expanding all stagings so barcodes are directly visible for immediate scanning!
  const [collapsedStagings, setCollapsedStagings] = useState<Record<string, boolean>>({});
  const [barcodeSize, setBarcodeSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeRecord = historyRecords.find((r) => r.id === selectedRecordId) || null;

  const toggleStaging = (stagingCode: string) => {
    setCollapsedStagings((prev) => ({
      ...prev,
      [stagingCode]: !prev[stagingCode],
    }));
  };

  const handleExpandAll = (expand: boolean) => {
    if (!activeRecord) return;
    const newMap: Record<string, boolean> = {};
    activeRecord.stagings.forEach((s) => {
      newMap[s.stagingCode] = !expand;
    });
    setCollapsedStagings(newMap);
  };

  // Dimensions based on user request ("perbesar gambar sedikit agar bisa di scan ya")
  const barcodeDimensions = {
    normal: { height: 55, width: 2.0 },
    large: { height: 72, width: 2.3 }, // Default enlarged
    xlarge: { height: 95, width: 2.6 }, // Extra large for long distance / tablet scanning
  }[barcodeSize];

  const handleCopySummary = (record: TripHistoryRecord) => {
    // Generate clean text format matching user specs
    const lines = [
      record.batchTitle,
      ...record.stagings.map((s) => `${s.stagingCode}, BAGSEAL ${s.totalBagseals}, QTY ${s.totalQty}`),
      `TOTAL: ${record.totalBagseals} BAGSEAL, QTY ${record.totalQty}`,
    ];
    const text = lines.join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopiedBatchId(record.id);
      setTimeout(() => setCopiedBatchId(null), 2500);
    });
  };

  const handleDownloadCsv = (record: TripHistoryRecord) => {
    const headers = ['Trip', 'Batch', 'Staging', 'Bagseal Barcode', 'Qty', 'Category Tag', 'Waktu Scan'];
    const rows = record.rawItems.map((item) => [
      record.trip,
      record.batchTitle,
      item.staging,
      `="${item.barcode}"`,
      item.qty,
      item.categoryTag || 'Reguler',
      new Date(item.scannedAt).toLocaleString('id-ID'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${record.batchTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Riwayat Penembakan Trip
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data tersimpan aman di HP/Browser. Klik batch untuk melihat rincian per Staging (SKMJ, BAGSEAL, QTY).
          </p>
        </div>

        <button
          onClick={onBackToScan}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Scan
        </button>
      </div>

      {historyRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">Belum Ada Riwayat Penembakan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Setelah selesai scan bagseal di suatu trip, tekan tombol <strong>"Selesaikan Trip"</strong>. 
              Batch akan otomatis tersimpan di sini (cth: <code>Trip 1-10112026</code>) beserta rekap per staging tanpa perlu repot sync excel setiap saat!
            </p>
          </div>
          <button
            onClick={onBackToScan}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Mulai Scan Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Batch Records */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daftar Batch ({historyRecords.length})
              </span>
              <span className="text-[11px] text-slate-400">Pilih untuk melihat rincian</span>
            </div>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {historyRecords.map((record) => {
                const isSelected = selectedRecordId === record.id;
                const formattedTime = new Date(record.finalizedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const formattedDate = new Date(record.finalizedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={record.id}
                    onClick={() => {
                      setSelectedRecordId(record.id);
                      setCollapsedStagings({});
                    }}
                    role="button"
                    tabIndex={0}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {/* Requested Batch Title: e.g. Trip 1-10112026 */}
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-slate-900 tracking-tight font-mono">
                            {record.batchTitle}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                            {record.trip}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formattedDate} • {formattedTime} WIB
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg shadow-2xs">
                          {record.stagings.length} Staging
                        </span>
                      </div>
                    </div>

                    {/* Summary Counters */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 font-medium">
                          Bagseal: <strong className="text-slate-900 font-bold">{record.totalBagseals}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-medium">
                          Total Qty: <strong className="text-emerald-700 font-bold">{record.totalQty.toLocaleString('id-ID')}</strong>
                        </span>
                      </div>

                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isSelected ? 'transform translate-x-1 text-indigo-600' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Staging Breakdown */}
          <div className="lg:col-span-7">
            {activeRecord ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                          {activeRecord.trip}
                        </span>
                        <span className="text-xs text-slate-300">
                          {new Date(activeRecord.finalizedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black tracking-tight font-mono mt-1 text-white">
                        {activeRecord.batchTitle}
                      </h3>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopySummary(activeRecord)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-white/20"
                        title="Salin rekap teks ke WhatsApp / Clipboard"
                      >
                        {copiedBatchId === activeRecord.id ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-300">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Salin Rekap
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownloadCsv(activeRecord)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-white/20"
                        title="Download file CSV / Excel"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        CSV
                      </button>

                      {onSyncRecordToSheets && (
                        <button
                          onClick={() => onSyncRecordToSheets(activeRecord)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          title="Sync ke Google Sheets"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Sheets
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/80">
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">Total Bagseals</span>
                      <span className="text-2xl font-black font-mono text-white mt-0.5 block">{activeRecord.totalBagseals}</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block">Total Qty (Pcs)</span>
                      <span className="text-2xl font-black font-mono text-emerald-300 mt-0.5 block">
                        {activeRecord.totalQty.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Staging Breakdown List (Exact Format as requested by user) */}
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Rincian Hasil Penembakan per Staging
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Format: <strong>STAGING, BAGSEAL [JML], QTY [TOTAL]</strong> • Barcode siap discan perangkat lain
                      </p>
                    </div>

                    {/* Barcode Size & Expand Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                        <span className="px-2 text-slate-500 font-semibold hidden sm:inline">Ukuran:</span>
                        <button
                          type="button"
                          onClick={() => setBarcodeSize('normal')}
                          className={`px-2 py-1 rounded-md font-bold transition-all ${
                            barcodeSize === 'normal'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Sedang
                        </button>
                        <button
                          type="button"
                          onClick={() => setBarcodeSize('large')}
                          className={`px-2 py-1 rounded-md font-bold transition-all ${
                            barcodeSize === 'large'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Besar
                        </button>
                        <button
                          type="button"
                          onClick={() => setBarcodeSize('xlarge')}
                          className={`px-2 py-1 rounded-md font-bold transition-all ${
                            barcodeSize === 'xlarge'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Ekstra
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExpandAll(Object.values(collapsedStagings).some((c) => c))}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 inline-flex items-center gap-1 cursor-pointer"
                        title="Buka atau tutup semua barcode"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Toggle Semua</span>
                      </button>
                    </div>
                  </div>

                  {/* The List of Stagings with the exact requested format */}
                  <div className="space-y-4">
                    {activeRecord.stagings.map((stg: StagingSummary, index: number) => {
                      const isCollapsed = !!collapsedStagings[stg.stagingCode];
                      // Requested exact format: SKMJ, BAGSEAL 30, QTY 1100
                      const exactFormatLine = `${stg.stagingCode}, BAGSEAL ${stg.totalBagseals}, QTY ${stg.totalQty}`;

                      return (
                        <div
                          key={stg.stagingCode}
                          className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-colors bg-white shadow-2xs"
                        >
                          {/* Staging Summary Header Banner */}
                          <div
                            onClick={() => toggleStaging(stg.stagingCode)}
                            role="button"
                            tabIndex={0}
                            className="p-4 flex items-center justify-between gap-3 cursor-pointer bg-slate-50/60 hover:bg-slate-100/70 border-b border-slate-200/80 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {index + 1}
                              </span>

                              <div>
                                {/* Highlighted User-Requested Line */}
                                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono">
                                  {exactFormatLine}
                                </div>
                                {stg.stagingName && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {stg.stagingName}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                                {stg.items.length} Barcode
                              </span>
                              <svg
                                className={`w-5 h-5 text-slate-400 transition-transform ${
                                  !isCollapsed ? 'transform rotate-180 text-indigo-600' : ''
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* Bagseal Items List: Enlarged Scannable Barcodes */}
                          {!isCollapsed && (
                            <div className="p-4 bg-slate-50/40 space-y-3">
                              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                                <span>Daftar Bagseal di {stg.stagingCode} ({stg.items.length} seal)</span>
                                <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                                  <Maximize2 className="w-3 h-3" />
                                  Klik barcode untuk layar penuh
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {stg.items.map((item, idx) => (
                                  <div
                                    key={item.id}
                                    className="p-3.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl shadow-xs transition-all space-y-2 flex flex-col justify-between"
                                  >
                                    {/* Bagseal meta header */}
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                                          {idx + 1}
                                        </span>
                                        <span className="font-mono font-black text-sm text-slate-900 tracking-tight">
                                          {item.barcode}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                          Qty: {item.qty}
                                        </span>
                                        {item.categoryTag ? (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {item.categoryTag}
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                                            Reguler
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Enlarged Scannable Barcode Canvas / SVG */}
                                    <div className="pt-1 flex flex-col items-center">
                                      <BarcodeDisplay
                                        value={item.barcode}
                                        height={barcodeDimensions.height}
                                        width={barcodeDimensions.width}
                                        allowZoom={true}
                                        className="w-full bg-white py-2"
                                      />
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                                      <span>{new Date(item.scannedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                      <span className="text-indigo-600 font-medium">Bisa discan langsung</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer actions: Delete with confirmation */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    {deleteConfirmId === activeRecord.id ? (
                      <div className="flex items-center gap-2 w-full justify-between bg-rose-50 p-3 rounded-xl border border-rose-200">
                        <span className="text-xs text-rose-700 font-medium">
                          Yakin ingin menghapus riwayat {activeRecord.batchTitle}?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onDeleteRecord(activeRecord.id);
                              setDeleteConfirmId(null);
                              const remaining = historyRecords.filter((r) => r.id !== activeRecord.id);
                              if (remaining.length > 0) {
                                setSelectedRecordId(remaining[0].id);
                              } else {
                                setSelectedRecordId(null);
                              }
                            }}
                            className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(activeRecord.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus Riwayat Ini
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
