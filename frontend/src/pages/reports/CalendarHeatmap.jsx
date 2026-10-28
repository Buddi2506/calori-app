import React from 'react';
import { Link } from 'react-router-dom';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Same ±10% rule and colors as the Overview's 7-day card.
const STYLES = {
  target: 'bg-emerald-50 ring-emerald-200 text-emerald-700',
  under: 'bg-blue-50 ring-blue-200 text-blue-700',
  over: 'bg-rose-50 ring-rose-200 text-rose-700',
  empty: 'bg-white ring-gray-100 text-gray-500',
};

const dayStatus = (calories, goal) => {
  if (!calories) return 'empty';
  const ratio = calories / (goal || 1);
  if (ratio > 1.1) return 'over';
  if (ratio < 0.9) return 'under';
  return 'target';
};

const pad = (n) => String(n).padStart(2, '0');

// Month grid: each day colored by calories vs goal, linking to that day's diary.
const CalendarHeatmap = ({ calendarData, calorieGoal, year, month }) => {
  const days = Object.entries(calendarData).sort(([a], [b]) => Number(a) - Number(b));
  // Blank cells before day 1 so it lands under the right weekday (Monday first)
  const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: leading }).map((_, i) => <li key={`blank-${i}`} aria-hidden="true" />)}
        {days.map(([day, data]) => {
          const cal = Math.round(data?.calories || 0);
          const status = dayStatus(cal, calorieGoal);
          return (
            <li key={day}>
              <Link
                to={`/diary/${year}-${pad(month)}-${pad(day)}`}
                title={`${day}: ${cal} kcal`}
                aria-label={`Open diary for day ${day}: ${cal} kcal`}
                className={`aspect-square rounded-xl ring-1 ring-inset flex flex-col items-center justify-center text-xs font-bold transition-all hover:ring-2 hover:ring-gray-300 ${STYLES[status]}`}
              >
                {day}
                {cal > 0 && <span className="hidden sm:block text-[10px] font-semibold opacity-80">{cal}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-50 ring-1 ring-emerald-200" />Within 10% of goal</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-50 ring-1 ring-blue-200" />Under</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-50 ring-1 ring-rose-200" />Over</span>
        <span className="ml-auto">Tap a day to see its log</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
