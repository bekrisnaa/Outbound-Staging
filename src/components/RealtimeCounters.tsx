import React from 'react';
import { Package, Hash, FileText, ShieldAlert, Star, Layers, AlertCircle } from 'lucide-react';
import { BagsealItem } from '../types';
import { calculateCategoryBreakdown, calculateTotals } from '../utils/bagsealLogic';

interface Props {
  items: BagsealItem[];
  currentTrip: string;
  currentStaging: string;
}

export const RealtimeCounters: React.FC<Props> = ({ items, currentTrip, currentStaging }) => {
  const { totalBagseals, totalQty } = calculateTotals(items);
  const breakdown = calculateCategoryBreakdown(items);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
      {/* Active Trip & Staging Banner */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {currentTrip}
          </span>
          <span className="text-slate-400">/</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Staging: {currentStaging}
          </span>
        </div>
        <div className="text-slate-500 font-medium">
          {items.length === 0 ? 'Ready to scan' : `${items.length} in draft`}
        </div>
      </div>

      {/* Two Real-time Primary Counters */}
      <div className="grid grid-cols-2 gap-3">
        {/* Counter A: Total Bagseals */}
        <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl p-3.5 text-white shadow-md shadow-blue-500/20">
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase">Total Bagseals</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums" data-testid="counter-total-bagseals">
              {totalBagseals}
            </span>
            <span className="text-xs text-blue-100 font-medium">bags</span>
          </div>
          <p className="text-[11px] text-blue-100/80 mt-1">Total barcodes scanned</p>
        </div>

        {/* Counter B: Total Qty */}
        <div className="bg-linear-to-br from-emerald-500 to-teal-700 rounded-xl p-3.5 text-white shadow-md shadow-emerald-500/20">
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase">Total Qty</span>
            <Hash className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums" data-testid="counter-total-qty">
              {totalQty}
            </span>
            <span className="text-xs text-emerald-100 font-medium">items</span>
          </div>
          <p className="text-[11px] text-emerald-100/80 mt-1">Sum inside bagseals</p>
        </div>
      </div>

      {/* Category Tagging Summary Chips */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Category Tagged Breakdown
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="bg-blue-50/80 border border-blue-100 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-700">
              <FileText className="w-3 h-3" />
              <span>Doc</span>
            </div>
            <div className="text-sm font-bold text-blue-900 mt-0.5 tabular-nums">
              {breakdown.Document}
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-amber-700">
              <ShieldAlert className="w-3 h-3" />
              <span>HV</span>
            </div>
            <div className="text-sm font-bold text-amber-900 mt-0.5 tabular-nums">
              {breakdown.HV}
            </div>
          </div>

          <div className="bg-purple-50/80 border border-purple-100 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-purple-700">
              <Star className="w-3 h-3" />
              <span>VIP</span>
            </div>
            <div className="text-sm font-bold text-purple-900 mt-0.5 tabular-nums">
              {breakdown.VIP}
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-700">
              <Layers className="w-3 h-3" />
              <span>BP</span>
            </div>
            <div className="text-sm font-bold text-emerald-900 mt-0.5 tabular-nums">
              {breakdown.BP}
            </div>
          </div>

          <div className={`border rounded-lg p-1.5 ${breakdown.Unassigned > 0 ? 'bg-rose-50/80 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Untag</span>
            </div>
            <div className="text-sm font-bold mt-0.5 tabular-nums">
              {breakdown.Unassigned}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
