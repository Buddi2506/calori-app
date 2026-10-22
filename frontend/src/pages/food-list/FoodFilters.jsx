import React from 'react';
import { Search, X } from 'lucide-react';

// Search box, raw/cooked filter, expand/collapse buttons and the category pills.
const FoodFilters = ({
  searchQuery, setSearchQuery,
  typeFilter, setTypeFilter,
  totalFilteredItems, expandAll, collapseAll,
  libraryData, selectedCategory, setSelectedCategory,
}) => (
  <div className="zentra-card p-4 md:p-6 space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* Search Box */}
      <div className="md:col-span-6 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-colors"
          placeholder="Search by food name or Telugu (e.g. arikelu, gongura, chicken breast, whey)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Type Filter (All / Raw / Cooked) */}
      <div className="md:col-span-3 flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setTypeFilter('all')}
          className={`flex-1 py-2 rounded-lg transition-all text-center ${
            typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Variants
        </button>
        <button
          onClick={() => setTypeFilter('raw')}
          className={`flex-1 py-2 rounded-lg transition-all text-center ${
            typeFilter === 'raw' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🥩 Raw Only
        </button>
        <button
          onClick={() => setTypeFilter('cooked')}
          className={`flex-1 py-2 rounded-lg transition-all text-center ${
            typeFilter === 'cooked' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🍲 Cooked Only
        </button>
      </div>

      {/* Expand / Collapse All */}
      <div className="md:col-span-3 flex items-center justify-end gap-2 text-xs">
        <span className="text-gray-500 font-medium mr-auto md:mr-0">
          Showing <span className="font-bold text-gray-800">{totalFilteredItems}</span> foods
        </span>
        <button
          onClick={expandAll}
          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Collapse All
        </button>
      </div>
    </div>

    {/* Category Pills Scroller */}
    {libraryData && libraryData.categories && (
      <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>🌐</span>
          <span>All Categories</span>
          <span className="opacity-75 text-[10px]">({libraryData.total_items})</span>
        </button>

        {libraryData.categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-primary'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.title.split('(')[0].trim()}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#fff]/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export default FoodFilters;
