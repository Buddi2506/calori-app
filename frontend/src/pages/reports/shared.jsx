import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Spinner = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Loading report">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="zentra-card h-[110px] animate-pulse" />
    ))}
  </div>
);

export const EmptyState = ({ message }) => (
  <div className="zentra-card p-10 text-center flex flex-col items-center gap-3">
    <span className="text-5xl" aria-hidden="true">📊</span>
    <p className="text-sm text-gray-600 max-w-sm">{message}</p>
  </div>
);

// "‹  20 – 26 Oct  ›  This week" — steps through days, weeks or months.
export const PeriodNav = ({ label, onPrev, onNext, onReset, resetLabel, atLatest }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-xl font-black tracking-tight text-gray-900">{label}</h2>
    <div role="group" aria-label="Change period" className="flex gap-1.5">
      <button
        onClick={onPrev}
        aria-label="Previous"
        className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 hover:border-gray-200 flex items-center justify-center transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={onReset}
        disabled={atLatest}
        className="h-11 px-4 rounded-full bg-white border border-gray-100 text-[13px] font-bold text-gray-700 hover:text-gray-900 disabled:text-gray-500 disabled:cursor-default transition-colors"
      >
        {resetLabel}
      </button>
      <button
        onClick={onNext}
        disabled={atLatest}
        aria-label="Next"
        className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  </div>
);

const NUTRIENT_LABELS = {
  calories: 'Calories', protein: 'Protein', carbohydrates: 'Carbs', fat: 'Fat',
  fiber: 'Fiber', iron: 'Iron', calcium: 'Calcium',
};

// How many logged days reached at least 90% of each goal.
export const GoalDaysCard = ({ daysMet, loggedDays }) => (
  <section className="zentra-card p-6 flex flex-col gap-4">
    <div>
      <h3 className="text-base font-extrabold text-gray-900">Days you hit your goals</h3>
      <p className="text-xs text-gray-500 mt-0.5">
        Out of {loggedDays} logged {loggedDays === 1 ? 'day' : 'days'} · a day counts at 90% of the goal or more
      </p>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {Object.entries(daysMet).map(([nutrient, days]) => {
        const pct = loggedDays ? Math.round((days / loggedDays) * 100) : 0;
        const stripe = pct >= 70 ? 'stripe-green' : pct >= 40 ? 'stripe-amber' : 'stripe-pink';
        return (
          <div key={nutrient} className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-600">{NUTRIENT_LABELS[nutrient] || nutrient.replace(/_/g, ' ')}</span>
            <span className="text-2xl font-black text-gray-900">
              {days}<span className="text-sm font-normal text-gray-500">/{loggedDays}</span>
            </span>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full ${stripe}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  </section>
);
