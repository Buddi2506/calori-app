import React from 'react';
import { mealLabel } from '../../utils/quickAdd';

export const MEAL_COLORS = {
  breakfast: '#FBBF24',
  lunch: '#60A5FA',
  snack: '#34D399',
  dinner: '#F472B6',
};

const ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

// Today is still in progress, so anything not over is "on track"; a past day is judged
// like the 7-day card: within 10% of goal is on target, otherwise under or over.
const calorieStatus = (eaten, goal, isToday) => {
  const ratio = eaten / (goal || 1);
  if (eaten === 0) return { text: isToday ? 'Not started' : 'Nothing logged', cls: 'bg-gray-100 text-gray-600' };
  if (ratio > 1.1) return { text: 'Over goal', cls: 'bg-rose-50 text-rose-700' };
  if (isToday) return { text: 'On track', cls: 'bg-emerald-50 text-emerald-700' };
  if (ratio < 0.9) return { text: 'Under goal', cls: 'bg-amber-50 text-amber-700' };
  return { text: 'On target', cls: 'bg-emerald-50 text-emerald-700' };
};

// Calories eaten vs goal, split into one bar segment per meal.
const CaloriesCard = ({ eaten, goal, mealCalories, isToday }) => {
  const scale = Math.max(goal, eaten) || 1;
  const left = goal - eaten;
  const status = calorieStatus(eaten, goal, isToday);

  return (
    <section className="zentra-card p-6 flex flex-col gap-5 col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-600">Calories</h2>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.cls}`}>{status.text}</span>
      </div>

      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="text-[56px] leading-none font-black tracking-tight text-gray-900">{eaten.toLocaleString()}</span>
        <span className="text-[15px] text-gray-600">of {goal.toLocaleString()} kcal</span>
      </div>

      <div
        className="flex h-3.5 rounded-full overflow-hidden bg-gray-100 gap-0.5"
        role="img"
        aria-label={ORDER.map((m) => `${mealLabel(m)} ${mealCalories[m]} kcal`).join(', ')}
      >
        {ORDER.filter((m) => mealCalories[m] > 0).map((m) => (
          <div key={m} style={{ width: `${(mealCalories[m] / scale) * 100}%`, background: MEAL_COLORS[m] }} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
        {ORDER.map((m) => (
          <span key={m} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: MEAL_COLORS[m] }} />
            {mealLabel(m)} {mealCalories[m].toLocaleString()}
          </span>
        ))}
        <span className="ml-auto font-bold text-gray-900">
          {left >= 0 ? `${left.toLocaleString()} left` : `${(-left).toLocaleString()} over`}
        </span>
      </div>
    </section>
  );
};

export default CaloriesCard;
