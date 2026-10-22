import React from 'react';

// ─── Calendar Heatmap Component ──────────────────────────────────────────────
const CalendarHeatmap = ({ calendarData, calorieGoal }) => {
  const getCellColor = (calories) => {
    if (!calories) return 'bg-gray-100 text-gray-400';
    const ratio = calories / calorieGoal;
    if (ratio >= 0.9 && ratio <= 1.1) return 'bg-emerald-600 text-white shadow-sm';
    if (ratio >= 0.7) return 'bg-emerald-100 text-emerald-800';
    if (ratio > 1.1) return 'bg-amber-500 text-white shadow-sm';
    return 'bg-gray-200 text-gray-700';
  };

  const days = Object.entries(calendarData).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-bold uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map(([day, data]) => {
          const cal = data?.calories || 0;
          return (
            <div
              key={day}
              title={`Day ${day}: ${Math.round(cal)} kcal`}
              className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold cursor-default transition-all ${getCellColor(cal)}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 text-xs text-gray-500 font-medium">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span> At goal</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 inline-block"></span> Under</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Over</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block"></span> No data</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
