import React from 'react';
import { FileText, ShieldAlert, Star, Layers, X, Check, Hash, Package } from 'lucide-react';
import { BagsealItem, CategoryTag, CATEGORY_TAGS } from '../types';
import { playTagAssignedChime } from '../utils/audio';
import { BarcodeDisplay } from './BarcodeDisplay';

interface Props {
  item: BagsealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTag: (itemId: string, tag?: CategoryTag, updatedQty?: number) => void;
  onUpdateQty: (itemId: string, qty: number) => void;
  onDeleteItem: (itemId: string) => void;
}

export const CategoryTagModal: React.FC<Props> = ({
  item,
  isOpen,
  onClose,
  onSelectTag,
  onUpdateQty,
  onDeleteItem,
}) => {
  if (!isOpen || !item) return null;

  const handleSelect = (tag?: CategoryTag) => {
    playTagAssignedChime();
    onSelectTag(item.id, tag);
    onClose();
  };

  const tagDetails: Record<
    CategoryTag,
    { label: string; desc: string; icon: React.ReactNode; color: string; activeColor: string }
  > = {
    Document: {
      label: 'Document',
      desc: 'Manifests, shipping waybills, slips & letters',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900',
      activeColor: 'border-blue-600 ring-2 ring-blue-500 bg-blue-100 text-blue-950 font-bold',
    },
    HV: {
      label: 'HV (High Value)',
      desc: 'Electronics, valuables, insured & locked parcels',
      icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900',
      activeColor: 'border-amber-600 ring-2 ring-amber-500 bg-amber-100 text-amber-950 font-bold',
    },
    VIP: {
      label: 'VIP (Priority)',
      desc: 'Urgent express handling, top tier clients',
      icon: <Star className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-900',
      activeColor: 'border-purple-600 ring-2 ring-purple-500 bg-purple-100 text-purple-950 font-bold',
    },
    BP: {
      label: 'BP (Bulk Parcel)',
      desc: 'Large bypass bags, pallet consolidation & bulk freight',
      icon: <Layers className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900',
      activeColor: 'border-emerald-600 ring-2 ring-emerald-500 bg-emerald-100 text-emerald-950 font-bold',
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-tag-modal-title"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-600">
              Assign Category Tag
            </span>
            <h2 id="category-tag-modal-title" className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span>{item.barcode}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {item.trip} • Staging: {item.staging}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Close category selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Scannable Barcode */}
        <div className="px-5 pt-3 pb-1 flex flex-col items-center bg-white border-b border-slate-100">
          <BarcodeDisplay value={item.barcode} height={52} width={2.1} allowZoom={true} className="w-full" />
          <span className="text-[10px] text-slate-400 mt-1">Dapat discan langsung dari layar HP</span>
        </div>

        {/* Quantity Quick Editor */}
        <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Hash className="w-4 h-4 text-slate-500" />
            <span>Bagseal Quantity (Qty):</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 active:bg-slate-200 flex items-center justify-center text-sm shadow-xs"
              aria-label="Decrease quantity by 1"
            >
              -
            </button>
            <span className="px-3 py-1 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm tabular-nums min-w-10 text-center shadow-xs">
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.id, item.qty + 1)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 active:bg-slate-200 flex items-center justify-center text-sm shadow-xs"
              aria-label="Increase quantity by 1"
            >
              +
            </button>
          </div>
        </div>

        {/* 4 Strict Category Tag Options + Reguler (No Tag) */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto">
          <p className="text-xs font-medium text-slate-600 mb-1">
            Pilih tag kategori (opsional, default: Reguler / Standar):
          </p>

          {/* Option: Reguler / Standar */}
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
              !item.categoryTag
                ? 'border-slate-800 ring-2 ring-slate-800 bg-slate-100 font-bold text-slate-900'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white shadow-xs border border-slate-200">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>Reguler / Standar</span>
                  {!item.categoryTag && (
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-semibold">
                      Aktif (Tanpa Tag)
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Paket biasa tanpa penanganan khusus (opsional)
                </div>
              </div>
            </div>
            {!item.categoryTag ? (
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-slate-300 group-hover:border-slate-500 flex items-center justify-center bg-white" />
            )}
          </button>

          {CATEGORY_TAGS.map((tag) => {
            const detail = tagDetails[tag];
            const isSelected = item.categoryTag === tag;

            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelect(tag)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                  isSelected ? detail.activeColor : detail.color
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-xs border border-slate-200/60">
                    {detail.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>{detail.label}</span>
                      {isSelected && (
                        <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-semibold">
                          Current Tag
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{detail.desc}</div>
                  </div>
                </div>

                <div className="ml-2 shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-300 group-hover:border-slate-500 flex items-center justify-center bg-white">
                      <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-slate-400"></span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onDeleteItem(item.id);
              onClose();
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Remove Item
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
