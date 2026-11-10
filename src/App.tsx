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
  TripId,
} from './types';
import { calculateTotals } from './utils/bagsealLogic';
import {
  clearActiveDraft,
  loadActiveDraft,
  loadStagings,
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
import {
  CheckCircle,
  FileSpreadsheet,
  AlertOctagon,
  Scan,
} from 'lucide-react';

export default function App() {
  // 1. Initial State from LocalStorage (persists across midnight rollovers)
  const initialDraft = useMemo(() => loadActiveDraft(), []);
  const initialStagings = useMemo(() => loadStagings(), []);

  const [currentTrip, setCurrentTrip] = useState<TripId>(initialDraft.currentTrip);
  const [currentStaging, setCurrentStaging] = useState<string>(initialDraft.currentStaging);
  const [items, setItems] = useState<BagsealItem[]>(initialDraft.items);
  const [stagings, setStagings] = useState<StagingItem[]>(initialStagings);

  // UI state
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [selectedItemForTagging, setSelectedItemForTagging] = useState<BagsealItem | null>(null);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTrip={currentTrip}
        currentStaging={currentStaging}
        totalBagseals={totalBagseals}
        totalQty={totalQty}
        user={user}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenStagings={() => setIsStagingModalOpen(true)}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Step Flow Breadcrumb Header */}
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
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sync Draft ({totalBagseals})</span>
            </button>
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
        onClose={() => setIsSyncModalOpen(false)}
        items={items}
        currentTrip={currentTrip}
        currentStaging={currentStaging}
        user={user}
        onAuthSuccess={(authUser) => setUser(authUser)}
        onSyncSuccess={handleClearAllItems}
      />

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
