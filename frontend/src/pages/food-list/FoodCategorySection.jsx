import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import FoodItemCard from './FoodItemCard';

// A collapsible category with its grid of food cards.
const FoodCategorySection = ({ category, isExpanded, onToggle, portionMode, onLog }) => (
  <div className="zentra-card overflow-hidden">
    {/* Category Accordion Header */}
    <div
      onClick={() => onToggle(category.id)}
      className="p-4 md:p-5 bg-gradient-to-r from-gray-50 via-gray-50/70 to-white flex items-center justify-between cursor-pointer select-none hover:bg-green-50/40 transition-colors border-b border-gray-100"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          {category.icon}
        </span>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            {category.title}
          </h2>
          <p className="text-xs text-gray-500">
            Category: <span className="font-semibold text-gray-700">{category.id}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-gray-200/80 text-gray-700 text-xs font-bold rounded-full">
          {category.count} items
        </span>
        <div className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>
    </div>

    {/* Category Items Cards Grid */}
    {isExpanded && (
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-50/30">
        {category.items.map((item) => (
          <FoodItemCard key={item.id} item={item} portionMode={portionMode} onLog={onLog} />
        ))}
      </div>
    )}
  </div>
);

export default FoodCategorySection;
