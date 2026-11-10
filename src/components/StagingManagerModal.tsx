import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, AlertCircle, Building2, Search, RotateCcw } from 'lucide-react';
import { StagingItem } from '../types';
import { MAX_STAGINGS } from '../utils/bagsealLogic';
import { DEFAULT_STAGINGS } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stagings: StagingItem[];
  currentStagingCode: string;
  onSelectStaging: (code: string) => void;
  onSaveStagings: (updated: StagingItem[]) => void;
}

export const StagingManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stagings,
  currentStagingCode,
  onSelectStaging,
  onSaveStagings,
}) => {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAtLimit = stagings.length >= MAX_STAGINGS;

  const handleAddStaging = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = newCode.trim().toUpperCase();
    const cleanName = newName.trim() || cleanCode;

    if (!cleanCode) {
      setError('Please provide a staging destination code (e.g. SKMJ).');
      return;
    }

    if (stagings.length >= MAX_STAGINGS) {
      setError(`Cannot add more than ${MAX_STAGINGS} custom stagings.`);
      return;
    }

    if (stagings.some((s) => s.code.toUpperCase() === cleanCode)) {
      setError(`Staging code "${cleanCode}" already exists.`);
      return;
    }

    const newItem: StagingItem = {
      id: `stg-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      createdAt: new Date().toISOString(),
    };

    const updated = [...stagings, newItem];
    onSaveStagings(updated);
    setNewCode('');
    setNewName('');
  };

  const handleStartEdit = (staging: StagingItem) => {
    setEditingId(staging.id);
    setEditCode(staging.code);
    setEditName(staging.name);
  };

  const handleSaveEdit = (id: string) => {
    setError(null);
    const cleanCode = editCode.trim().toUpperCase();
    const cleanName = editName.trim() || cleanCode;

    if (!cleanCode) {
      setError('Staging code cannot be empty.');
      return;
    }

    // Check conflict with other items
    if (stagings.some((s) => s.id !== id && s.code.toUpperCase() === cleanCode)) {
      setError(`Staging code "${cleanCode}" already exists.`);
      return;
    }

    const updated = stagings.map((s) =>
      s.id === id ? { ...s, code: cleanCode, name: cleanName } : s
    );
    onSaveStagings(updated);
    setEditingId(null);
  };

  const handleDeleteStaging = (id: string, code: string) => {
    if (stagings.length <= 1) {
      setError('At least one staging code must remain.');
      return;
    }
    const updated = stagings.filter((s) => s.id !== id);
    onSaveStagings(updated);

    // If current selected staging was deleted, switch to the first available
    if (currentStagingCode === code && updated.length > 0) {
      onSelectStaging(updated[0].code);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset staging list to default standard distribution hubs?')) {
      onSaveStagings(DEFAULT_STAGINGS);
    }
  };

  const filteredStagings = stagings.filter(
    (s) =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staging-manager-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="staging-manager-title" className="text-base font-bold text-slate-900">
                Manage Custom Stagings
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-slate-500">
                  Capacity: <strong className="text-slate-900">{stagings.length}</strong> / {MAX_STAGINGS} slots
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Saved in LocalStorage
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Close staging manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Staging Form */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleAddStaging} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Add New Staging Destination</span>
              {isAtLimit && (
                <span className="text-xs font-semibold text-rose-600">
                  Maximum {MAX_STAGINGS} stagings reached
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Code (e.g. SKMJ)"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  disabled={isAtLimit}
                  className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  maxLength={10}
                />
              </div>

              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Hub Name (e.g. Sukamaju Hub)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isAtLimit}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isAtLimit || !newCode.trim()}
                  className="w-full h-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Search & List Controls */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search staging code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100 flex items-center gap-1 shrink-0"
            title="Reset to default 10 logistic stagings"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Defaults</span>
          </button>
        </div>

        {/* Stagings List */}
        <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2">
          {filteredStagings.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No stagings found matching &apos;{search}&apos;.
            </div>
          ) : (
            filteredStagings.map((stg) => {
              const isSelected = stg.code === currentStagingCode;
              const isEditing = editingId === stg.id;

              return (
                <div
                  key={stg.id}
                  className={`p-2.5 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-amber-50/70 border border-amber-200/80' : 'hover:bg-slate-50'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-blue-400 rounded-md"
                        maxLength={10}
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-blue-400 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(stg.id)}
                        className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
                        onClick={() => {
                          onSelectStaging(stg.code);
                          onClose();
                        }}
                      >
                        <span className="font-mono text-xs font-extrabold px-2 py-1 rounded-md bg-slate-900 text-white tracking-wide">
                          {stg.code}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {stg.name}
                          </div>
                          {isSelected && (
                            <div className="text-[10px] font-semibold text-amber-700">
                              Currently Active Staging
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStaging(stg.code);
                            onClose();
                          }}
                          className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                            isSelected
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(stg)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit staging"
                          aria-label={`Edit ${stg.code}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaging(stg.id, stg.code)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete staging"
                          aria-label={`Delete ${stg.code}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Stagings persist across all 4 Trips.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
