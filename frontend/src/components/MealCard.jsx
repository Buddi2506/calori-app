import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import MacroSplitBar from './ui/MacroSplitBar';

const fmt = (v) => Math.round((v || 0) * 10) / 10;
const SHOWN_ITEMS = 4;

// One saved meal: totals, what's in it, and buttons to log, edit or delete it.
const MealCard = ({ meal, onLog, onEdit, onDelete }) => {
  const n = meal.nutrition || {};
  const items = meal.items || [];
  const extra = items.length - SHOWN_ITEMS;

  return (
    <article className="zentra-card !rounded-3xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
          {meal.image_emoji || '🥘'}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold text-gray-900 leading-snug line-clamp-2">{meal.name}</h3>
          <p className="text-xs text-gray-500 truncate">
            {meal.description || `${items.length} ${items.length === 1 ? 'food' : 'foods'}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-2xl font-black leading-none tracking-tight text-gray-900">
            {Math.round(n.calories ?? meal.total_calories ?? 0)}
          </span>
          <span className="text-[11px] text-gray-500">kcal</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <MacroSplitBar nutrients={n} />
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-700 font-bold">{fmt(n.protein)}g <span className="font-normal text-gray-500">P</span></span>
          <span className="text-blue-700 font-bold">{fmt(n.carbohydrates)}g <span className="font-normal text-gray-500">C</span></span>
          <span className="text-pink-700 font-bold">{fmt(n.fat)}g <span className="font-normal text-gray-500">F</span></span>
          {n.fiber > 0 && <span className="text-gray-700 font-bold">{fmt(n.fiber)}g <span className="font-normal text-gray-500">fiber</span></span>}
        </div>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="Foods in this meal">
        {items.slice(0, SHOWN_ITEMS).map((i, idx) => (
          <li key={idx} className="max-w-full truncate px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-700">
            {i.food_name}
          </li>
        ))}
        {extra > 0 && (
          <li className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-500">+{extra} more</li>
        )}
      </ul>

      <div className="mt-auto flex items-center gap-1">
        <button
          onClick={() => onLog(meal)}
          className="h-9 px-4 rounded-full flex items-center gap-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-[#0B0C10] transition-colors"
        >
          <Plus size={14} /> Log meal
        </button>
        <span className="flex-1" />
        <button
          onClick={() => onEdit(meal)}
          aria-label={`Edit ${meal.name}`}
          className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(meal.id)}
          aria-label={`Delete ${meal.name}`}
          className="p-2 rounded-full text-gray-500 hover:text-rose-600 hover:bg-gray-100 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
};

export default MealCard;
