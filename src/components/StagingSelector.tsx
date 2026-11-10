import React, { useState } from 'react';
import { MapPin, Settings2, Search, Check, Plus } from 'lucide-react';
import { StagingItem } from '../types';
import { MAX_STAGINGS } from '../utils/bagsealLogic';

interface Props {
  stagings: StagingItem[];
  selectedStagingCode: string;
  onSelectStaging: (code: string) => void;
  onOpenManager: () => void;
  stagingCounts: Record<string, number>;
}

export const StagingSelector: React.FC<Props> = ({
  stagings,
  selectedStagingCode,
  onSelectStaging,
  onOpenManager,
  stagingCounts,
}) => {
  const [filter, setFilter] = useState('');

  const currentStaging = stagings.find((s) => s.code === selectedStagingCode) || {
    id: 'default',
    code: selectedStagingCode || 'SKMJ',
    name: 'Outbound Hub',
  };

  const filtered = stagings.filter(
    (s) =>
      s.code.toLowerCase().includes(filter.toLowerCase()) ||
      s.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-4">
      {/* Header and Manage Stagings Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Step 2: Select Staging (Destination Code)
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenManager}
          className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          title="Add or manage up to 34 custom stagings"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Manage Stagings ({stagings.length}/{MAX_STAGINGS})</span>
        </button>
      </div>

      {/* Active Staging Highlight Hero */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-50 to-orange-50/40 border border-amber-200 rounded-xl p-3 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-black px-2.5 py-1 rounded-lg bg-amber-600 text-white tracking-wider shadow-xs">
            {currentStaging.code}
          </span>
          <div>
            <div className="text-xs font-extrabold text-slate-900">{currentStaging.name}</div>
            <div className="text-[11px] text-slate-500">
              Active destination for scanned bagseals
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-amber-700 font-semibold block uppercase">
            In Draft
          </span>
          <span className="text-xs font-extrabold text-slate-800 tabular-nums">
            {stagingCounts[currentStaging.code] || 0} bagseals
          </span>
        </div>
      </div>

      {/* Quick Search & Filter */}
      {stagings.length > 6 && (
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search destination code (e.g. SKMJ, CGK01)..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>
      )}

      {/* Horizontal / Grid Staging Pills */}
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
        {filtered.map((stg) => {
          const isSelected = stg.code === selectedStagingCode;
          const count = stagingCounts[stg.code] || 0;

          return (
            <button
              key={stg.id}
              type="button"
              onClick={() => onSelectStaging(stg.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-amber-500/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
              title={stg.name}
              aria-pressed={isSelected}
            >
              <span>{stg.code}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans font-bold tabular-nums ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}
              {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0 ml-0.5" />}
            </button>
          );
        })}

        {stagings.length < MAX_STAGINGS && (
          <button
            type="button"
            onClick={onOpenManager}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-dashed border-slate-300 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/30 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Staging</span>
          </button>
        )}
      </div>
    </div>
  );
};
