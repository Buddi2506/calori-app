import React from 'react';
import { Plus } from 'lucide-react';
import MacroSplitBar from '../../components/ui/MacroSplitBar';
import { nutrientsFor, portionLabel, foodTags } from './nutrition';

const fmt = (v) => Math.round((v || 0) * 10) / 10;

// One food in the library grid. The whole tile opens the detail panel; "Log" adds it to the diary.
const FoodTile = ({ item, portionMode, rank, onOpen, onLog }) => {
  const n = nutrientsFor(item, portionMode);
  const tags = foodTags(item);

  return (
    <article className="group relative zentra-card !rounded-3xl p-4 flex flex-col gap-3 hover:!border-amber-400/60">
      <div className="flex items-start gap-3">
        {rank && (
          <span className="shrink-0 mt-0.5 min-w-[28px] h-7 px-1.5 rounded-lg bg-amber-400 text-[#0B0C10] text-xs font-black flex items-center justify-center">
            #{rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold leading-snug text-gray-900 line-clamp-2">
            {/* Stretched button: the whole tile is the click target */}
            <button onClick={() => onOpen(item)} className="text-left after:absolute after:inset-0 after:rounded-3xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-amber-400">
              {item.name}
            </button>
          </h3>
          {item.name_local && <p className="text-xs text-orange-600 truncate mt-0.5">{item.name_local}</p>}
        </div>
        <div className="text-right shrink-0">
          <span className="block text-2xl font-black leading-none tracking-tight text-gray-900">{Math.round(n.calories || 0)}</span>
          <span className="text-[11px] text-gray-500">kcal</span>
        </div>
      </div>

      <MacroSplitBar nutrients={n} />

      <div className="flex items-center gap-3 text-xs">
        <span className="text-emerald-700 font-bold">{fmt(n.protein)}g <span className="font-normal text-gray-500">P</span></span>
        <span className="text-blue-700 font-bold">{fmt(n.carbohydrates)}g <span className="font-normal text-gray-500">C</span></span>
        <span className="text-pink-700 font-bold">{fmt(n.fat)}g <span className="font-normal text-gray-500">F</span></span>
        <button
          onClick={() => onLog(item)}
          aria-label={`Log ${item.name}`}
          className="relative z-10 ml-auto h-8 px-3 rounded-full flex items-center gap-1 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 hover:bg-amber-400 hover:text-[#0B0C10] hover:border-amber-400 transition-colors"
        >
          <Plus size={14} /> Log
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-gray-500 -mt-1">
        <span>{portionLabel(item, portionMode)}</span>
        {tags.map((t) => (
          <span key={t} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-semibold">{t}</span>
        ))}
      </div>
    </article>
  );
};

export default FoodTile;
