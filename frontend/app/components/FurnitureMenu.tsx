"use client";

import React, { useState, useEffect } from "react";
import {
  FiX,
  FiFilter,
  FiShoppingBag,
  FiMove,
  FiCheck,
  FiChevronRight,
  FiInfo,
} from "react-icons/fi";
import {
  DATASET_CATEGORIES,
  BUDGET_TIERS,
  DatasetFurnitureItem,
  getDatasetItems,
  prefetchCategoryExtractions,
} from "../services/datasetCatalog";
import { API_BASE } from "../services/api";

const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400";
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/uploads/")) {
    return `${API_BASE}${url}`;
  }
  return url;
};

interface FurnitureMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  userBudget?: number;
  onPlaceItem: (item: DatasetFurnitureItem) => void;
  onDragStartItem: (e: React.DragEvent, item: DatasetFurnitureItem) => void;
  isLight?: boolean;
}

export default function FurnitureMenu({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  userBudget,
  onPlaceItem,
  onDragStartItem,
  isLight = true,
}: FurnitureMenuProps) {
  const [selectedBudgetBracket, setSelectedBudgetBracket] = useState<string>("all");
  const [items, setItems] = useState<DatasetFurnitureItem[]>([]);

  useEffect(() => {
    const bracket = selectedBudgetBracket === "all" ? undefined : selectedBudgetBracket;
    const filtered = getDatasetItems(activeCategory, userBudget, bracket);
    setItems(filtered);
    prefetchCategoryExtractions(filtered, (updated) => setItems(updated));
  }, [activeCategory, selectedBudgetBracket, userBudget]);


  if (!isOpen) return null;

  const currentCategoryMeta = DATASET_CATEGORIES.find((c) => c.key === activeCategory) || DATASET_CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
          isLight
            ? "bg-[#FCFCFA] border-stone-200 text-stone-800"
            : "bg-slate-900 border-slate-800 text-stone-100"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isLight ? "border-stone-200 bg-stone-50/70" : "border-slate-800 bg-slate-950/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentCategoryMeta.icon}</span>
            <div>
              <h2 className={`font-bold text-lg leading-tight ${isLight ? "text-stone-900" : "text-stone-100"}`}>
                Select {currentCategoryMeta.label}
              </h2>
              <p className={`text-xs ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                Real catalog pieces from the interior dataset · Drag directly onto room or click place
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight ? "hover:bg-stone-200/70 text-stone-500" : "hover:bg-slate-800 text-stone-400"
            }`}
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Category & Budget Filter Toolbar */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLight ? "border-stone-200 bg-white" : "border-slate-800 bg-slate-900"
          }`}
        >
          {/* Category Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {DATASET_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  onSelectCategory(cat.key);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                  activeCategory === cat.key
                    ? isLight
                      ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                      : "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : isLight
                    ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                    : "bg-slate-800 hover:bg-slate-700 text-stone-300 border-slate-700"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Budget Bracket Filter Dropdown / Tabs */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isLight ? "text-stone-400" : "text-stone-500"}`}>
              <FiFilter className="text-xs" /> Budget:
            </span>
            <select
              value={selectedBudgetBracket}
              onChange={(e) => setSelectedBudgetBracket(e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition ${
                isLight
                  ? "bg-stone-100 border-stone-200 text-stone-800 focus:border-stone-400"
                  : "bg-slate-800 border-slate-700 text-stone-200 focus:border-slate-500"
              }`}
            >
              <option value="all">All Budget Brackets</option>
              {BUDGET_TIERS.map((tier) => (
                <option key={tier.key} value={tier.key}>
                  {tier.label} ({tier.desc})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real Dataset Furniture Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {items.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <FiShoppingBag className="text-3xl mx-auto opacity-40 mb-2" />
              <p className="text-sm font-semibold">No furniture found for the selected filter.</p>
              <p className="text-xs">Try selecting a different budget tier or category above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => onDragStartItem(e, item)}
                  className={`group rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing ${
                    isLight
                      ? "bg-white border-stone-200 hover:border-indigo-400"
                      : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/80"
                  }`}
                >
                  <div>
                    {/* Item Image */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-50 dark:bg-slate-900 border border-stone-100 dark:border-slate-800 flex items-center justify-center mb-3 select-none">
                      <img
                        src={resolveImageUrl(item.extracted_image_url || item.image_url)}
                        alt={item.label}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400";
                        }}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
                      />


                      {/* Budget Bracket Badge */}
                      <span className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        {item.budgetLabel}
                      </span>

                      {/* Drag Hint on Hover */}
                      <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1 pointer-events-none">
                        <FiMove /> Drag into Room
                      </div>
                    </div>

                    {/* Details */}
                    <h4 className={`font-bold text-sm line-clamp-1 ${isLight ? "text-stone-900" : "text-stone-100"}`}>
                      {item.label}
                    </h4>

                    <p className={`text-xs mt-1 line-clamp-2 ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                      {item.description || item.material}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="font-mono text-emerald-600 font-bold text-sm">
                        ₹{item.price.toLocaleString("en-IN")}
                      </span>
                      <span className={`text-[11px] ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                        {item.dimensions.width_ft}×{item.dimensions.length_ft} ft
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onPlaceItem(item);
                        onClose();
                      }}
                      className="flex-1 bg-gradient-to-r from-stone-900 to-stone-800 dark:from-indigo-600 dark:to-purple-600 hover:opacity-95 text-white text-xs font-semibold py-2 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FiCheck className="text-xs" /> + Place in Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isLight ? "border-stone-200 bg-stone-50/50 text-stone-500" : "border-slate-800 bg-slate-950/40 text-stone-400"
          }`}
        >
          <span className="flex items-center gap-1">
            <FiInfo className="text-xs" /> Showing {items.length} verified items from `furniture_dataset/{activeCategory}`
          </span>
          <button
            onClick={onClose}
            className={`font-semibold cursor-pointer ${isLight ? "text-stone-700 hover:text-stone-900" : "text-stone-300 hover:text-white"}`}
          >
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
}
