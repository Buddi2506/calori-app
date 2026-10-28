import React from 'react';
import { Plus, Trash2, Pencil, Utensils } from 'lucide-react';
import { MEAL_COLORS } from '../dashboard/CaloriesCard';
import { formatPortion, mealLabel } from '../../utils/quickAdd';
import { formatNutrient } from '../../utils/formatters';

const EntryRow = ({ entry, onEdit, onDelete }) => {
  const name = entry.food?.name || 'Food';
  return (
    <li className="group flex items-center gap-3 py-3 border-t border-gray-100 first:border-t-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{formatPortion(entry.quantity_display, entry.quantity_unit)}</span>
          <span className="text-protein">{formatNutrient(entry.protein, 'g')} P</span>
          <span className="text-carbs">{formatNutrient(entry.carbohydrates, 'g')} C</span>
          <span className="text-fat">{formatNutrient(entry.fat, 'g')} F</span>
        </p>
      </div>
      <span className="text-sm font-extrabold text-gray-900 shrink-0">
        {Math.round(entry.calories || 0)} <span className="text-xs font-normal text-gray-500">kcal</span>
      </span>
      {/* Always visible on touch screens; on wider screens they appear on hover or keyboard focus */}
      <div className="flex shrink-0 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          aria-label={`Edit portion of ${name}`}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(entry)}
          aria-label={`Remove ${name}`}
          className="p-2 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-gray-100 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
};

// One meal of the day: its entries, totals, and buttons to add more.
const MealSection = ({ meal, entries, onAddFood, onLogMeal, onEdit, onDelete }) => {
  const calories = Math.round(entries.reduce((sum, e) => sum + (e.calories || 0), 0));
  const protein = entries.reduce((sum, e) => sum + (e.protein || 0), 0);
  const label = mealLabel(meal);

  return (
    <section aria-labelledby={`meal-${meal}`} className="zentra-card p-5 sm:p-6 flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <span className="w-1.5 h-10 rounded-full shrink-0" style={{ background: MEAL_COLORS[meal] }} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h2 id={`meal-${meal}`} className="text-lg font-extrabold tracking-tight text-gray-900">{label}</h2>
          <p className="text-xs text-gray-500">
            {entries.length
              ? `${entries.length} ${entries.length === 1 ? 'item' : 'items'} · ${formatNutrient(protein, 'g')} protein`
              : 'Nothing logged yet'}
          </p>
        </div>
        <span className={`text-lg font-black ${entries.length ? 'text-gray-900' : 'text-gray-500'}`}>
          {calories.toLocaleString()} <span className="text-xs font-normal text-gray-500">kcal</span>
        </span>
      </header>

      {entries.length > 0 && (
        <ul className="flex flex-col">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAddFood(meal)}
          className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold text-gray-900 bg-gray-50 border border-gray-200 hover:border-amber-400 transition-colors"
        >
          <Plus size={15} /> Add food
        </button>
        <button
          onClick={() => onLogMeal(meal)}
          className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:border-amber-400 hover:text-gray-900 transition-colors"
        >
          <Utensils size={15} /> Log saved meal
        </button>
      </div>
    </section>
  );
};

export default MealSection;
