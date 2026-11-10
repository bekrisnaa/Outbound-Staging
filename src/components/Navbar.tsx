import React from 'react';
import {
  Barcode,
  FileSpreadsheet,
  Settings2,
  HardDrive,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { TripId } from '../types';
import { logout } from '../services/auth';

interface Props {
  currentTrip: TripId;
  currentStaging: string;
  totalBagseals: number;
  totalQty: number;
  user: User | null;
  onOpenSync: () => void;
  onOpenStagings: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTrip,
  currentStaging,
  totalBagseals,
  totalQty,
  user,
  onOpenSync,
  onOpenStagings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Barcode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                LogiScan
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Outbound Staging
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>{currentTrip}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">{currentStaging}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-emerald-400">
                <HardDrive className="w-3 h-3" />
                <span>Auto-Saved Locally</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Staging Manager Button */}
          <button
            type="button"
            onClick={onOpenStagings}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Manage custom stagings"
            aria-label="Manage custom stagings"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Stagings</span>
          </button>

          {/* Sync to Google Sheets Button with Draft Count */}
          <button
            type="button"
            onClick={onOpenSync}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/25 transition-all"
            aria-label="Open Google Sheets Sync dialog"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Sync to Sheets</span>
            <span className="sm:hidden">Sync</span>
            {totalBagseals > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-emerald-200 text-[11px] font-bold tabular-nums">
                {totalBagseals} ({totalQty} Qty)
              </span>
            )}
          </button>

          {/* Google User Avatar / Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <div
                className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200"
                title={`Signed in as ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.displayName?.[0]?.toUpperCase() || <UserCheck className="w-3.5 h-3.5" />
                )}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign out of Google"
                aria-label="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSync}
              className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors hidden sm:block"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
