import React from 'react';
import { format, parseISO } from 'date-fns';

// A logged day is "on target" within ±10% of the calorie goal.
const dayStatus = (day, goal) => {
  if (!day.entries_count) return 'empty';
  const ratio = (day.totals?.calories || 0) / (goal || 1);
  if (ratio < 0.9) return 'under';
  if (ratio > 1.1) return 'over';
  return 'target';
};

const STYLES = {
  target: 'bg-emerald-50 ring-emerald-200',
  under: 'bg-amber-50 ring-amber-200',
  over: 'bg-rose-50 ring-rose-200',
  empty: 'bg-white ring-gray-100',
};

const LABELS = { target: 'on target', under: 'under goal', over: 'over goal', empty: 'nothing logged' };

// The 7 days ending on the selected date, colored by how close each was to the calorie goal.
const WeekAdherenceCard = ({ days, goal, selectedDate }) => {
  const statuses = days.map((d) => dayStatus(d, goal));
  const logged = statuses.filter((s) => s !== 'empty').length;
  const onTarget = statuses.filter((s) => s === 'target').length;

  return (
    <section className="zentra-card p-6 flex flex-col gap-4 col-span-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-600">Last 7 days</h2>
        <span className="text-[13px] font-bold text-gray-900">
          {logged ? `${onTarget} of ${logged} logged days on target` : 'No days logged yet'}
        </span>
      </div>

      <ol className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const date = parseISO(d.date);
          const isSelected = d.date === selectedDate;
          return (
            <li key={d.date} className="flex flex-col items-center gap-2">
              <span
                className={`w-full h-11 rounded-xl ring-1 ring-inset ${STYLES[statuses[i]]} ${isSelected ? '!ring-2 !ring-amber-400' : ''}`}
                title={`${format(date, 'EEE d MMM')}: ${Math.round(d.totals?.calories || 0)} kcal, ${LABELS[statuses[i]]}`}
              />
              <span className={`text-xs ${isSelected ? 'font-bold text-amber-400' : 'text-gray-500'}`}>
                {format(date, 'EEE')}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-50 ring-1 ring-emerald-200" />Within 10% of goal</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-50 ring-1 ring-amber-200" />Under</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-50 ring-1 ring-rose-200" />Over</span>
      </div>
    </section>
  );
};

export default WeekAdherenceCard;
