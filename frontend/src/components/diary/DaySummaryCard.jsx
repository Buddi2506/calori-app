import React from 'react';
import { MealSplitBar, MEAL_COLORS } from '../dashboard/CaloriesCard';
import { MEAL_TYPES, mealLabel } from '../../utils/quickAdd';

const MACROS = [
  { key: 'protein', label: 'Protein', stripe: 'stripe-green' },
  { key: 'carbohydrates', label: 'Carbs', stripe: 'stripe-blue' },
  { key: 'fat', label: 'Fat', stripe: 'stripe-pink' },
  { key: 'fiber', label: 'Fiber', stripe: 'stripe-amber' },
];

const MacroRow = ({ label, current, goal, stripe }) => {
  const value = Math.round(current);
  const target = Math.round(goal);
  const pct = Math.min(100, (current / (goal || 1)) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-bold text-gray-700">{label}</span>
        <span className="text-gray-600">
          <span className="font-extrabold text-gray-900">{value}</span> / {target} g
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <div className={`h-full rounded-full ${stripe} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// The day's calories by meal and macros against goal, shown beside the meal list.
const DaySummaryCard = ({ totals, goals, mealCalories }) => {
  const eaten = Math.round(totals.calories || 0);
  const goal = Math.round(goals.calories || 2000);
  const left = goal - eaten;

  return (
    <section className="zentra-card p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-gray-600">Day total</h2>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[44px] leading-none font-black tracking-tight text-gray-900">{eaten.toLocaleString()}</span>
          <span className="text-sm text-gray-600">of {goal.toLocaleString()} kcal</span>
        </div>
        <span className={`text-sm font-bold ${left >= 0 ? 'text-gray-700' : 'text-rose-700'}`}>
          {left >= 0 ? `${left.toLocaleString()} kcal left` : `${(-left).toLocaleString()} kcal over`}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <MealSplitBar mealCalories={mealCalories} scale={Math.max(goal, eaten) || 1} className="h-3" />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
          {MEAL_TYPES.map((m) => (
            <li key={m} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: MEAL_COLORS[m] }} aria-hidden="true" />
              {mealLabel(m)}
              <span className="ml-auto font-bold text-gray-900">{mealCalories[m].toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-5 gap-y-4 pt-4 border-t border-gray-100">
        {MACROS.map((m) => (
          <MacroRow key={m.key} label={m.label} current={totals[m.key] || 0} goal={goals[m.key] || 0} stripe={m.stripe} />
        ))}
      </div>
    </section>
  );
};

export default DaySummaryCard;
