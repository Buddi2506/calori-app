import React from 'react';

// One macro (protein, carbs, fat or fiber) against its goal, with a candy-stripe bar.
const MacroCard = ({ label, current, goal, stripe }) => {
  const value = Math.round(current);
  const target = Math.round(goal);
  const pct = Math.min(100, (current / (goal || 1)) * 100);
  const diff = target - value;

  return (
    <section className="zentra-card p-5 flex flex-col justify-between gap-4">
      <h2 className="text-sm font-bold text-gray-600">{label}</h2>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-black tracking-tight text-gray-900">{value}</span>
        <span className="text-sm text-gray-600">/ {target} g</span>
      </div>
      <div
        className="h-2.5 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <div className={`h-full rounded-full ${stripe} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{diff >= 0 ? `${diff} g to go` : `${-diff} g over`}</span>
    </section>
  );
};

export default MacroCard;
