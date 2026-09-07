import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';

/**
 * SteppedAdherenceChart
 * Stepped histogram chart matching the pink "Retention" card in Zentra UI.
 * Dynamically computes heights, consistency score, and peak badge from weekly diary entries.
 */
const SteppedAdherenceChart = ({ weeklyData, calorieGoal = 2000, fallbackScore = 65 }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Compute days list from weeklyData or fallback to days of current week
  const rawDays = weeklyData?.days || [];
  const goalCal = weeklyData?.goals?.calories || calorieGoal || 2000;

  let days = [];
  let peakIndex = -1;
  let maxCal = 0;

  if (rawDays.length > 0) {
    days = rawDays.map((d, idx) => {
      let label = 'Day';
      try {
        label = format(parseISO(d.date), 'EEE');
      } catch (e) {
        label = `D${idx + 1}`;
      }
      const cal = Math.round(d.totals?.calories || 0);
      if (cal > maxCal) {
        maxCal = cal;
        peakIndex = idx;
      }
      return {
        day: label,
        dateStr: d.date,
        calories: cal,
        pct: Math.min(150, Math.round((cal / (goalCal || 1)) * 100))
      };
    });
  } else {
    // Fallback if loading or no weeklyData
    const defaultLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days = defaultLabels.map((lbl) => ({
      day: lbl,
      dateStr: '',
      calories: 0,
      pct: 0
    }));
  }

  // Calculate consistency score
  let consistencyScore = fallbackScore;
  if (weeklyData) {
    const loggedDays = weeklyData.total_logged_days || 0;
    if (loggedDays > 0) {
      const avgCal = weeklyData.averages?.calories || 0;
      const ratio = Math.min(1, avgCal / (goalCal || 1));
      consistencyScore = Math.round(ratio * 100);
    } else {
      consistencyScore = 0;
    }
  }

  // Bar height calculation: 10px minimum when 0 kcal, up to 88px
  const getBarHeight = (cal) => {
    if (cal <= 0) return 10;
    const ratio = Math.min(1.2, cal / (goalCal || 2000));
    return Math.max(16, Math.min(88, Math.round(ratio * 75) + 12));
  };

  return (
    <div className="zentra-card p-6 flex flex-col justify-between relative">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900">7-Day Calorie Adherence</h3>
          <p className="text-[11px] text-gray-400 font-medium">Daily intake vs {Math.round(goalCal)} kcal target</p>
        </div>
        <button className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="my-2">
        <span className="text-3xl font-black text-gray-900 tracking-tight">{consistencyScore}%</span>
        <span className="text-xs text-gray-400 ml-1.5 font-medium">consistency score</span>
      </div>

      {/* Stepped Line / Histogram Visual */}
      <div className="h-28 flex items-end justify-between px-2 pt-6 border-b border-gray-100 relative">
        {days.map((item, idx) => {
          const isPeak = idx === peakIndex && item.calories > 0;
          const height = getBarHeight(item.calories);
          const isHovered = hoveredDay === idx;

          return (
            <div 
              key={idx} 
              onMouseEnter={() => setHoveredDay(idx)}
              onMouseLeave={() => setHoveredDay(null)}
              className="flex flex-col items-center flex-1 relative group cursor-pointer"
            >
              {/* Tooltip on Hover */}
              {isHovered && item.calories > 0 && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-md">
                  {item.calories} kcal ({item.pct}%)
                </div>
              )}

              {/* Bar */}
              <div 
                style={{ height: `${height}px` }} 
                className={`w-3.5 sm:w-4 rounded-t-md transition-all duration-500 relative ${
                  isPeak 
                    ? 'bg-pink-500 shadow-sm shadow-pink-500/30' 
                    : item.calories > 0 
                      ? 'bg-pink-200 hover:bg-pink-300' 
                      : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {isPeak && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold bg-pink-600 text-white px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    Peak
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[11px] font-semibold text-gray-400 pt-2 px-1">
        {days.map((d, i) => (
          <span 
            key={i} 
            className={`transition-colors ${hoveredDay === i ? 'text-gray-900 font-bold' : ''}`}
          >
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SteppedAdherenceChart;
