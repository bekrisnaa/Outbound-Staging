import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  Star,
  Layers,
  ChevronRight,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Tag,
  Hash,
  Minus,
  Plus,
} from 'lucide-react';
import { BagsealItem, CategoryTag } from '../types';

interface Props {
  items: BagsealItem[];
  onItemClick: (item: BagsealItem) => void;
  onQuickTag: (itemId: string, tag: CategoryTag) => void;
  onUpdateQty: (itemId: string, newQty: number) => void;
  onDeleteItem: (itemId: string) => void;
  onClearAll: () => void;
}

export const DraftListView: React.FC<Props> = ({
  items,
  onItemClick,
  onQuickTag,
  onUpdateQty,
  onDeleteItem,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('ALL');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.staging.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTag === 'ALL') return true;
    if (filterTag === 'UNTAGGED') return !item.categoryTag;
    return item.categoryTag === filterTag;
  });

  const getTagBadge = (tag?: CategoryTag) => {
    switch (tag) {
      case 'Document':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
            <FileText className="w-3 h-3 text-blue-600" />
            Document
          </span>
        );
      case 'HV':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            HV
          </span>
        );
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
            <Star className="w-3 h-3 text-purple-600" />
            VIP
          </span>
        );
      case 'BP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
            <Layers className="w-3 h-3 text-emerald-600" />
            BP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <Tag className="w-3 h-3" />
            Pilih Tag
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* Draft List Header */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Draft List &amp; Kolom Qty</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {items.length} {items.length === 1 ? 'Bagseal' : 'Bagseals'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kolom Qty dapat diedit langsung pada setiap baris bagseal di bawah
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 transition-colors flex items-center gap-1"
            title="Clear all scanned items in draft"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Draft
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      {items.length > 0 && (
        <div className="p-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by barcode or staging..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <button
              type="button"
              onClick={() => setFilterTag('ALL')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                filterTag === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('UNTAGGED')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                filterTag === 'UNTAGGED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Untagged
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('Document')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                filterTag === 'Document'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Doc
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('HV')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                filterTag === 'HV'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              HV
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('VIP')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                filterTag === 'VIP'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              VIP
            </button>
            <button
              type="button"
              onClick={() => setFilterTag('BP')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                filterTag === 'BP'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              BP
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Belum Ada Bagseal yang Discan</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Gunakan kamera atau ketik nomor bagseal dan isi kolom Qty di atas. Item akan langsung masuk ke daftar ini.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Tidak ada nomor bagseal yang cocok dengan pencarian.
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const timeStr = item.scannedAt
              ? new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '';

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                {/* Bagian Kiri: Nomor Bagseal & Metadata */}
                <div
                  className="flex items-start gap-3 flex-1 cursor-pointer"
                  onClick={() => onItemClick(item)}
                >
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {items.length - idx}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.barcode}
                      </span>
                      {getTagBadge(item.categoryTag)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="font-semibold text-blue-700">{item.trip}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-amber-700">Staging: {item.staging}</span>
                      {timeStr && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bagian Tengah: KOLOM EDIT QTY LANGSUNG */}
                <div
                  className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>Qty:</span>
                  </span>

                  {/* Decrement Button */}
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))}
                    className="w-6 h-6 rounded-md bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                    title="Kurangi Qty 1"
                    aria-label={`Kurangi Qty untuk ${item.barcode}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  {/* Direct Qty Number Input Column */}
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={item.qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateQty(item.id, isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    className="w-14 px-1.5 py-0.5 text-center font-bold text-xs bg-white border border-slate-300 rounded-md text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 tabular-nums shadow-2xs"
                    title="Ketik langsung jumlah Qty isi bagseal"
                    aria-label={`Kolom Qty untuk ${item.barcode}`}
                  />

                  {/* Increment Button */}
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="w-6 h-6 rounded-md bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                    title="Tambah Qty 1"
                    aria-label={`Tambah Qty untuk ${item.barcode}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Bagian Kanan: Quick Tagging & Action Controls */}
                <div
                  className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Inline quick tag pills */}
                  <div className="flex items-center gap-1">
                    {(['Document', 'HV', 'VIP', 'BP'] as CategoryTag[]).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onQuickTag(item.id, tag)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors border ${
                          item.categoryTag === tag
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`Tag sebagai ${tag}`}
                      >
                        {tag === 'Document' ? 'Doc' : tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 ml-1">
                    <button
                      type="button"
                      onClick={() => onItemClick(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Buka rincian & tag"
                      aria-label={`Buka detail untuk ${item.barcode}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus baris ini"
                      aria-label={`Hapus ${item.barcode}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      {items.length > 0 && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Semua nomor bagseal dan kolom Qty otomatis tersimpan di LocalStorage dan siap disinkron ke Google Sheets.</span>
        </div>
      )}
    </div>
  );
};
