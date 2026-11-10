import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Loader2,
  Table,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BagsealItem, GoogleSheetsSyncResult, TripId } from '../types';
import {
  exportDraftToCSV,
  getSavedSpreadsheetId,
  saveSpreadsheetId,
  syncDraftToGoogleSheets,
} from '../services/googleSheets';
import { googleSignIn, logout } from '../services/auth';
import { User } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: BagsealItem[];
  currentTrip: TripId;
  currentStaging: string;
  user: User | null;
  onAuthSuccess: (user: User, token: string) => void;
  onSyncSuccess: () => void;
}

export const GoogleSheetsSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  currentTrip,
  currentStaging,
  user,
  onAuthSuccess,
  onSyncSuccess,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [customSheetId, setCustomSheetId] = useState(getSavedSpreadsheetId() || '');
  const [syncResult, setSyncResult] = useState<GoogleSheetsSyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  if (!isOpen) return null;

  const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleTriggerSync = async () => {
    if (items.length === 0) {
      setErrorMessage('No scanned items to sync.');
      return;
    }

    if (!user) {
      setErrorMessage('Please sign in with Google first.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);

    try {
      if (customSheetId) {
        saveSpreadsheetId(customSheetId);
      }

      const result = await syncDraftToGoogleSheets(
        items,
        currentTrip,
        currentStaging,
        user.email || 'warehouse-operator',
        customSheetId || undefined
      );

      setSyncResult(result);
      setShowConfirmStep(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }

      // CRITICAL REQUIREMENT: Clear the draft only upon a successful sync
      onSyncSuccess();
    } catch (err: any) {
      console.error('Sync failed:', err);
      setErrorMessage(err?.message || 'Failed to sync to Google Sheets. Check connection or sheet permissions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCSV = () => {
    exportDraftToCSV(items, currentTrip, currentStaging);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-sheets-sync-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="google-sheets-sync-title" className="text-base font-bold text-slate-900">
                Sync to Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Export scanned bagseals, trips, stagings, quantities, and category tags
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Close sync dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Success State */}
          {syncResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-md">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>

              <h3 className="text-base font-bold text-emerald-950 mb-1">
                Synced Successfully to Google Sheets!
              </h3>
              <p className="text-xs text-emerald-800 mb-4 max-w-sm mx-auto">
                <strong>{syncResult.rowsAdded} Bagseals</strong> ({totalQty} Total Qty) from{' '}
                <strong>{currentTrip}</strong> ({currentStaging}) were appended. The local draft has been cleared safely.
              </p>

              {syncResult.spreadsheetUrl && (
                <a
                  href={syncResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Google Sheets</span>
                </a>
              )}

              <div className="mt-4 pt-4 border-t border-emerald-200/80 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSyncResult(null);
                    onClose();
                  }}
                  className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Close &amp; Return to Scanner
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Manifest Export Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Export Batch Summary:</span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Draft will clear upon successful sync
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Trip</span>
                    <span className="font-bold text-blue-700">{currentTrip}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Staging</span>
                    <span className="font-bold text-amber-700">{currentStaging}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Bagseals</span>
                    <span className="font-bold text-slate-900">{items.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Qty</span>
                    <span className="font-bold text-emerald-700">{totalQty}</span>
                  </div>
                </div>

                {/* Columns Preview */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                    <Table className="w-3.5 h-3.5 text-slate-500" />
                    <span>Columns Exported:</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 truncate">
                    [Timestamp, Trip, Staging, Bagseal Barcode, Qty, Category Tag, Operator]
                  </div>
                </div>
              </div>

              {/* Step 1: Google Account Authentication */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  1. Google Account Connection:
                </label>

                {user ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {user.displayName || 'Authorized Google User'}
                        </div>
                        <div className="text-[11px] text-slate-600">{user.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Official Sign in with Google Button Styling */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-4 shadow-xs text-xs font-bold text-slate-700 transition-colors"
                    >
                      {isSigningIn ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      )}
                      <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                    </button>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sign in with Google to grant permission to append logs to Google Sheets.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2: Target Spreadsheet Option */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-800 block">
                  2. Destination Spreadsheet:
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-create new sheet, or paste Google Sheet ID..."
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Optional: If left blank, a formatted &apos;Outbound Staging Logs&apos; sheet will be automatically created in your Google Drive.
                </p>
              </div>

              {/* Confirmation Alert Dialog required for workspace mutation */}
              {showConfirmStep && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-start gap-2 text-xs text-amber-900 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Confirm Sync &amp; Draft Clearance:</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        This will append {items.length} bagseal records to your Google Sheet with permission.
                        Upon successful export, the active draft will be cleared. Proceed?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConfirmStep(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerSync}
                      disabled={isSyncing}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1"
                    >
                      {isSyncing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Yes, Export &amp; Clear</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!syncResult && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>

              {!showConfirmStep && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      handleGoogleLogin();
                    } else {
                      setShowConfirmStep(true);
                    }
                  }}
                  disabled={items.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{!user ? 'Sign in & Sync' : 'Sync to Google Sheets'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
