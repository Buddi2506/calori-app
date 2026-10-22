import React from 'react';
import { Sparkles } from 'lucide-react';

// Page title plus the "per 100g / per serving" toggle.
const FoodListHeader = ({ portionMode, setPortionMode }) => (
  <div className="zentra-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
    <div className="relative z-10 space-y-2">
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/60 text-amber-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
        <Sparkles size={14} className="text-amber-600" /> Item List & Micro Values
      </div>
      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
        Comprehensive Food Library
      </h1>
      <p className="text-gray-500 text-sm md:text-base max-w-2xl font-medium">
        Browse 662 authentic South Indian & Indian foods across 23 categories. Inspect real-time macros, minerals, and vitamins for 100g, 100ml, scoops, and piece weights.
      </p>
    </div>

    {/* Portion Toggle Header Control with Black Pill Active State */}
    <div className="relative z-10 bg-gray-100 p-1.5 rounded-2xl border border-gray-200/80 flex flex-col gap-1 self-start md:self-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
        Calculate Nutrition As:
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPortionMode('100g')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            portionMode === '100g'
              ? 'pill-active shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Per 100g / 100ml
        </button>
        <button
          onClick={() => setPortionMode('serving')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            portionMode === 'serving'
              ? 'pill-active shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Per 1 Serving (Piece/Scoop/Cup)
        </button>
      </div>
    </div>
  </div>
);

export default FoodListHeader;
