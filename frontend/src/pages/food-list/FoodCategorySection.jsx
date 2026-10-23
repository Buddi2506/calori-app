import React from 'react';
import { ChevronDown } from 'lucide-react';
import FoodTile from './FoodTile';

// A collapsible category heading with its grid of food tiles.
const FoodCategorySection = ({ category, isExpanded, onToggle, portionMode, onOpen, onLog }) => (
  <section className="flex flex-col gap-3">
    <h2>
      <button
        onClick={() => onToggle(category.id)}
        aria-expanded={isExpanded}
        className="w-full flex items-center gap-3 py-2 text-left group"
      >
        <span className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
          {category.icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-lg font-extrabold tracking-tight text-gray-900 truncate">{category.title}</span>
          <span className="block text-xs text-gray-500">{category.count} {category.count === 1 ? 'food' : 'foods'}</span>
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-500 group-hover:text-gray-900 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
        />
      </button>
    </h2>

    {isExpanded && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {category.items.map((item) => (
          <FoodTile key={item.id} item={item} portionMode={portionMode} onOpen={onOpen} onLog={onLog} />
        ))}
      </div>
    )}
  </section>
);

export default FoodCategorySection;
