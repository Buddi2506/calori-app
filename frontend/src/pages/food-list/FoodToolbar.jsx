import React from 'react';
import { Search, X, ArrowDownUp } from 'lucide-react';
import Segmented from '../../components/ui/Segmented';
import { SORTS, shortCategoryTitle } from './nutrition';

const TYPES = [
  { id: 'all', label: 'All' },
  { id: 'raw', label: 'Raw' },
  { id: 'cooked', label: 'Cooked' },
];

// Search, raw/cooked filter, sort order and the category chips.
const FoodToolbar = ({
  searchQuery, setSearchQuery,
  typeFilter, setTypeFilter,
  sort, setSort,
  categories, totalItems, selectedCategory, setSelectedCategory,
}) => (
  <section className="zentra-card p-4 flex flex-col gap-3 !border-gray-200">
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="flex-1 flex items-center gap-3 h-[52px] px-4 rounded-2xl bg-[#0E0F13] border border-gray-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 transition-colors">
        <Search size={18} className="text-gray-600 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search foods or Telugu names — gongura, paneer, whey…"
          aria-label="Search foods"
          className="flex-1 min-w-0 h-12 bg-transparent outline-none text-[15px] text-gray-900 placeholder-gray-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="p-1 text-gray-500 hover:text-gray-900">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <Segmented label="Food type" options={TYPES} value={typeFilter} onChange={setTypeFilter} className="self-center" />
        <label className="relative flex items-center h-11 self-center">
          <ArrowDownUp size={15} className="absolute left-3.5 text-gray-500 pointer-events-none" aria-hidden="true" />
          <span className="sr-only">Sort foods</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 pl-9 pr-8 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-gray-900 hover:border-gray-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>
    </div>

    {categories.length > 0 && (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[{ id: 'all', icon: '🍽️', title: 'All', count: totalItems }, ...categories].map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={active}
              className={`h-9 pl-2.5 pr-3 rounded-full text-[13px] font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-colors ${
                active ? 'pill-active border-transparent' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-amber-400 hover:text-gray-900'
              }`}
            >
              <span aria-hidden="true">{cat.icon}</span>
              {shortCategoryTitle(cat.title)}
              <span className={`text-[11px] ${active ? 'opacity-70' : 'text-gray-500'}`}>{cat.count}</span>
            </button>
          );
        })}
      </div>
    )}
  </section>
);

export default FoodToolbar;
