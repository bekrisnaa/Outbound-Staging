import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { TripId, TRIPS } from '../types';

interface Props {
  selectedTrip: TripId;
  onSelectTrip: (trip: TripId) => void;
  tripCounts: Record<TripId, { bagseals: number; qty: number }>;
}

export const TripSelector: React.FC<Props> = ({ selectedTrip, onSelectTrip, tripCounts }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Step 1: Select Active Trip
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Main Dispatch Schedule</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TRIPS.map((trip) => {
          const isSelected = selectedTrip === trip;
          const stats = tripCounts[trip] || { bagseals: 0, qty: 0 };

          return (
            <button
              key={trip}
              type="button"
              onClick={() => onSelectTrip(trip)}
              className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-sm font-extrabold ${
                    isSelected ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-600'
                  }`}
                >
                  {trip}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">In Draft:</span>
                <span
                  className={`font-bold tabular-nums ${
                    stats.bagseals > 0 ? 'text-blue-700 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {stats.bagseals} bags ({stats.qty} Qty)
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
