/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  AppDraftState,
  BagsealItem,
  CategoryTag,
  StagingItem,
  TripHistoryRecord,
  TripId,
} from './types';
import { calculateTotals } from './utils/bagsealLogic';
import { finalizeTripRecord } from './utils/historyLogic';
import {
  clearActiveDraft,
  loadActiveDraft,
  loadStagings,
  loadTripHistory,
  appendTripHistory,
  deleteTripHistory,
  saveActiveDraft,
  saveStagings,
} from './services/storage';
import { initAuth } from './services/auth';
import { Navbar } from './components/Navbar';
import { TripSelector } from './components/TripSelector';
import { StagingSelector } from './components/StagingSelector';
import { RealtimeCounters } from './components/RealtimeCounters';
import { BarcodeScanner } from './components/BarcodeScanner';
import { DraftListView } from './components/DraftListView';
import { CategoryTagModal } from './components/CategoryTagModal';
import { StagingManagerModal } from './components/StagingManagerModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { TripHistoryView } from './components/TripHistoryView';
import {
  CheckCircle,
  FileSpreadsheet,
  AlertOctagon,
  Scan,
  Archive,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // 1. Initial State from LocalStorage (persists across midnight rollovers)
  const initialDraft = useMemo(() => loadActiveDraft(), []);
  const initialStagings = useMemo(() => loadStagings(), []);
  const initialHistory = useMemo(() => loadTripHistory(), []);

  const [currentTrip, setCurrentTrip] = useState<TripId>(initialDraft.currentTrip);
  const [currentStaging, setCurrentStaging] = useState<string>(initialDraft.currentStaging);
  const [items, setItems] = useState<BagsealItem[]>(initialDraft.items);
  const [stagings, setStagings] = useState<StagingItem[]>(initialStagings);
  const [historyRecords, setHistoryRecords] = useState<TripHistoryRecord[]>(initialHistory);

  // Active View Tab: 'scan' or 'history'
  const [activeView, setActiveView] = useState<'scan' | 'history'>('scan');

  // UI state
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [selectedItemForTagging, setSelectedItemForTagging] = useState<BagsealItem | null>(null);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [justFinalizedBatch, setJustFinalizedBatch] = useState<TripHistoryRecord | null>(null);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  // Selected history record items to sync if user triggers from History view
  const [historyItemsToSync, setHistoryItemsToSync] = useState<BagsealItem[] | null>(null);

  // Google Auth User
  const [user, setUser] = useState<User | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Auto-Save Draft to LocalStorage whenever items, trip, or staging change
  // Cross-Day Continuity: ensures midnight rollover never resets the draft
  useEffect(() => {
    const draftState: AppDraftState = {
      currentTrip,
      currentStaging,
      items,
      lastSavedAt: new Date().toISOString(),
    };
    saveActiveDraft(draftState);

    // Minor feedback pulse
    setLastSavedMessage('Draft saved');
    const timer = setTimeout(() => setLastSavedMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [items, currentTrip, currentStaging]);

  // Save Stagings to LocalStorage
  const handleSaveStagings = useCallback((updated: StagingItem[]) => {
    setStagings(updated);
    saveStagings(updated);
  }, []);

  // Automatic No-Click Barcode Scanning Handler
  const handleBarcodeScanned = useCallback(
    (barcode: string, qty: number) => {
      const newItem: BagsealItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        barcode,
        qty,
        categoryTag: undefined, // Untagged by default until user taps to assign
        scannedAt: new Date().toISOString(),
        trip: currentTrip,
        staging: currentStaging,
      };

      setItems((prev) => [newItem, ...prev]);
    },
    [currentTrip, currentStaging]
  );

  // Assign Category Tag (Document, HV, VIP, BP, or undefined for Reguler)
  const handleAssignCategoryTag = useCallback((itemId: string, tag?: CategoryTag, updatedQty?: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              categoryTag: tag,
              qty: updatedQty !== undefined ? updatedQty : item.qty,
            }
          : item
      )
    );
  }, []);

  // Update item quantity
  const handleUpdateItemQty = useCallback((itemId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, qty: Math.max(1, newQty) } : item))
    );
  }, []);

  // Delete single item from draft
  const handleDeleteItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // Clear all items from draft (upon confirmed action or sync success)
  const handleClearAllItems = useCallback(() => {
    setItems([]);
    clearActiveDraft();
    setShowClearConfirmModal(false);
  }, []);

  // Items for current trip
  const currentTripItems = useMemo(
    () => items.filter((item) => item.trip === currentTrip),
    [items, currentTrip]
  );

  // Finalize current trip into a permanent History batch (e.g. Trip 1-10112026)
  const handleConfirmFinalizeTrip = useCallback(() => {
    if (currentTripItems.length === 0) return;

    const stagingMap = new Map(stagings.map((s) => [s.code, s.name]));
    const record = finalizeTripRecord(currentTrip, currentTripItems, new Date(), stagingMap);

    const updated = appendTripHistory(record);
    setHistoryRecords(updated);

    // Remove finalized items from active draft so operator is ready for next batch
    setItems((prev) => prev.filter((item) => item.trip !== currentTrip));
    setShowFinalizeModal(false);
    setJustFinalizedBatch(record);
  }, [currentTrip, currentTripItems, stagings]);

  // Delete history record
  const handleDeleteHistoryRecord = useCallback((id: string) => {
    const updated = deleteTripHistory(id);
    setHistoryRecords(updated);
  }, []);

  // Calculate totals and trip counts
  const { totalBagseals, totalQty } = useMemo(() => calculateTotals(items), [items]);

  const tripCounts = useMemo(() => {
    const counts: Record<TripId, { bagseals: number; qty: number }> = {
      'Trip 1': { bagseals: 0, qty: 0 },
      'Trip 2': { bagseals: 0, qty: 0 },
      'Trip 3': { bagseals: 0, qty: 0 },
      'Trip 4': { bagseals: 0, qty: 0 },
    };

    for (const item of items) {
      if (item.trip in counts) {
        counts[item.trip as TripId].bagseals++;
        counts[item.trip as TripId].qty += item.qty;
      }
    }
    return counts;
  }, [items]);

  const stagingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.staging] = (counts[item.staging] || 0) + 1;
    }
    return counts;
  }, [items]);

  const recentBarcodes = useMemo(() => items.map((i) => i.barcode), [items]);

  // Handle sync from history
  const handleSyncRecordFromHistory = useCallback((record: TripHistoryRecord) => {
    setHistoryItemsToSync(record.rawItems);
    setIsSyncModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation with Scan / History View Switcher */}
      <Navbar
        currentTrip={currentTrip}
        currentStaging={currentStaging}
        totalBagseals={totalBagseals}
        totalQty={totalQty}
        user={user}
        activeView={activeView}
        historyCount={historyRecords.length}
        onViewChange={setActiveView}
        onOpenSync={() => {
          setHistoryItemsToSync(null);
          setIsSyncModalOpen(true);
        }}
        onOpenStagings={() => setIsStagingModalOpen(true)}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Success Alert when a Trip has just been finalized */}
        {justFinalizedBatch && (
          <div className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold font-mono">
                    {justFinalizedBatch.batchTitle} BERHASIL DISIMPAN!
                  </h4>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                    {justFinalizedBatch.stagings.length} Staging
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Tersimpan di Riwayat: {justFinalizedBatch.totalBagseals} bagseal, total {justFinalizedBatch.totalQty} qty. Draft {justFinalizedBatch.trip} sudah bersih!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveView('history');
                  setJustFinalizedBatch(null);
                }}
                className="px-3.5 py-1.5 bg-white text-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka Riwayat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setJustFinalizedBatch(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                aria-label="Tutup notifikasi"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* View Routing: History View vs Scan View */}
        {activeView === 'history' ? (
          <TripHistoryView
            historyRecords={historyRecords}
            onDeleteRecord={handleDeleteHistoryRecord}
            onSyncRecordToSheets={handleSyncRecordFromHistory}
            onBackToScan={() => setActiveView('scan')}
          />
        ) : (
          <>
            {/* Step Flow Breadcrumb Header & Finalize Shortcut */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Trip</span>
                <span className="text-slate-400">→</span>
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Staging</span>
                <span className="text-slate-400">→</span>
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Auto-Scan &amp; Tag</span>
              </div>

              <div className="flex items-center gap-2">
                {lastSavedMessage && (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    <span>{lastSavedMessage}</span>
                  </span>
                )}
                {/* Finalize Trip Button: The fast, direct way to record batch without syncing Excel! */}
                {currentTripItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFinalizeModal(true)}
                    className="text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ring-2 ring-indigo-300"
                    title="Jadikan Riwayat Batch (cth: Trip 1-10112026)"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Selesaikan {currentTrip} ({currentTripItems.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* 1. Trip Navigation Menu */}
            <TripSelector
              selectedTrip={currentTrip}
              onSelectTrip={(trip) => setCurrentTrip(trip)}
              tripCounts={tripCounts}
            />

            {/* 2. Staging Selection & Management */}
            <StagingSelector
              stagings={stagings}
              selectedStagingCode={currentStaging}
              onSelectStaging={(code) => setCurrentStaging(code)}
              onOpenManager={() => setIsStagingModalOpen(true)}
              stagingCounts={stagingCounts}
            />

            {/* 3. Real-time Counters (Total Bagseals & Total Qty) */}
            <RealtimeCounters
              items={items}
              currentTrip={currentTrip}
              currentStaging={currentStaging}
            />

            {/* 4. Scanning Section (Camera Viewfinder with Auto No-Click Processing) */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 3: Barcode Scanner
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                No button click required on scan
              </span>
            </div>

            <BarcodeScanner
              onBarcodeScanned={handleBarcodeScanned}
              isActive={isScannerActive}
              onToggleActive={setIsScannerActive}
              recentBarcodes={recentBarcodes}
            />

            {/* 5. Draft View & Bagseal Categorization Tagging List */}
            <DraftListView
              items={items}
              onItemClick={(item) => setSelectedItemForTagging(item)}
              onQuickTag={(itemId, tag) => handleAssignCategoryTag(itemId, tag)}
              onUpdateQty={handleUpdateItemQty}
              onDeleteItem={handleDeleteItem}
              onClearAll={() => setShowClearConfirmModal(true)}
            />
          </>
        )}
      </main>

      {/* Category Tagging Modal (Prompt on Bagseal Tap) */}
      <CategoryTagModal
        item={selectedItemForTagging}
        isOpen={!!selectedItemForTagging}
        onClose={() => setSelectedItemForTagging(null)}
        onSelectTag={handleAssignCategoryTag}
        onUpdateQty={handleUpdateItemQty}
        onDeleteItem={handleDeleteItem}
      />

      {/* Staging Manager Modal (Up to 34 custom stagings) */}
      <StagingManagerModal
        isOpen={isStagingModalOpen}
        onClose={() => setIsStagingModalOpen(false)}
        stagings={stagings}
        currentStagingCode={currentStaging}
        onSelectStaging={(code) => setCurrentStaging(code)}
        onSaveStagings={handleSaveStagings}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => {
          setIsSyncModalOpen(false);
          setHistoryItemsToSync(null);
        }}
        items={historyItemsToSync || items}
        currentTrip={currentTrip}
        currentStaging={currentStaging}
        user={user}
        onAuthSuccess={(authUser) => setUser(authUser)}
        onSyncSuccess={handleClearAllItems}
      />

      {/* Finalize Trip Modal (Jadikan Batch & Simpan ke Riwayat) */}
      {showFinalizeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Selesaikan {currentTrip}?
                </h4>
                <p className="text-xs text-slate-500">
                  Jadikan riwayat batch penembakan resmi
                </p>
              </div>
            </div>

            {/* Batch Title Preview */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5 mb-4 font-mono">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans font-semibold">
                Judul Batch Riwayat
              </div>
              <div className="text-xl font-black text-indigo-300 mt-0.5">
                {currentTrip}-{new Date().getDate().toString().padStart(2, '0')}
                {(new Date().getMonth() + 1).toString().padStart(2, '0')}
                {new Date().getFullYear()}
              </div>
              <div className="text-xs text-slate-300 mt-1 font-sans">
                {currentTripItems.length} Bagseal • Total Qty:{' '}
                {currentTripItems.reduce((s, i) => s + (Number(i.qty) || 0), 0).toLocaleString('id-ID')} Pcs
              </div>
            </div>

            {/* Staging Breakdown Preview */}
            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rincian Rekap per Staging:
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {Array.from(
                  currentTripItems.reduce((map, item) => {
                    const existing = map.get(item.staging) || { count: 0, qty: 0 };
                    map.set(item.staging, {
                      count: existing.count + 1,
                      qty: existing.qty + (Number(item.qty) || 0),
                    });
                    return map;
                  }, new Map<string, { count: number; qty: number }>())
                ).map(([stagingCode, data]) => (
                  <div
                    key={stagingCode}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-mono font-bold text-slate-900"
                  >
                    <span>{stagingCode}, BAGSEAL {data.count}, QTY {data.qty}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">Tersimpan</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200">
              💡 <strong>Tanpa repot sync Excel:</strong> Data langsung tersimpan di HP/browser. Draft {currentTrip} akan di-reset bersih sehingga Anda bisa langsung nembak trip berikutnya.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalizeTrip}
                className="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-colors shadow-md shadow-indigo-600/20 cursor-pointer inline-flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Ya, Selesaikan &amp; Jadikan Riwayat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Draft Confirmation Modal */}
      {showClearConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Clear Active Draft?</h4>
            <p className="text-xs text-slate-500 mt-1">
              This will remove all {items.length} scanned bagseals and their quantities from the current draft. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllItems}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Yes, Clear Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
