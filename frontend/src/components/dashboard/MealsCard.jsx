import React from 'react';
import { Link } from 'react-router-dom';
import { MEAL_COLORS } from './CaloriesCard';
import { mealLabel } from '../../utils/quickAdd';

const ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

// What was eaten at each meal, with a link to the full diary for the day.
const MealsCard = ({ byMeal, mealCalories, diaryPath }) => (
  <section className="zentra-card p-6 flex flex-col gap-2 col-span-2">
    <div className="flex items-baseline justify-between mb-1">
      <h2 className="text-sm font-bold text-gray-600">Meals</h2>
      <Link to={diaryPath} className="text-[13px] font-bold text-amber-400 hover:text-amber-300">Open diary</Link>
    </div>
    <ul className="flex flex-col">
      {ORDER.map((m) => {
        const items = byMeal[m] || [];
        return (
          <li key={m} className="flex items-center gap-3 py-2.5 border-t border-gray-100 first:border-t-0">
            <span className="w-1.5 h-9 rounded-full shrink-0" style={{ background: MEAL_COLORS[m] }} aria-hidden="true" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-gray-900">{mealLabel(m)}</span>
              <span className="block text-xs text-gray-500 truncate">
                {items.length ? items.map((e) => e.food?.name).join(' · ') : 'Nothing logged yet'}
              </span>
            </span>
            <span className={`text-sm font-extrabold ${items.length ? 'text-gray-900' : 'text-gray-500'}`}>
              {items.length ? `${mealCalories[m].toLocaleString()} kcal` : '—'}
            </span>
          </li>
        );
      })}
    </ul>
  </section>
);

export default MealsCard;
