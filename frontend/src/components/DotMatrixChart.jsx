import React from 'react';
import { MoreHorizontal } from 'lucide-react';

/**
 * DotMatrixChart
 * Visualizes micronutrient rhythm using dot-matrix / audio-waveform columns
 * matching the Transactions and Customers cards in Zentra.
 */
const DotMatrixChart = ({ nutrients = {}, goals = {} }) => {
  const items = [
    { label: 'Iron (Fe)', current: nutrients.iron || 0, goal: goals.iron || 18, unit: 'mg', color: 'bg-emerald-500', lightColor: 'bg-emerald-200' },
    { label: 'Calcium (Ca)', current: nutrients.calcium || 0, goal: goals.calcium || 1000, unit: 'mg', color: 'bg-blue-500', lightColor: 'bg-blue-200' },
    { label: 'Potassium (K)', current: nutrients.potassium || 0, goal: goals.potassium || 3500, unit: 'mg', color: 'bg-indigo-500', lightColor: 'bg-indigo-200' },
    { label: 'Zinc (Zn)', current: nutrients.zinc || 0, goal: goals.zinc || 11, unit: 'mg', color: 'bg-teal-500', lightColor: 'bg-teal-200' },
  ];

  return (
    <div className="zentra-card p-6 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-extrabold text-gray-900">Micro Mineral Rhythm</h3>
          <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200/50">
            ICMR Target
          </span>
        </div>
        <button className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="space-y-4 my-auto">
        {items.map((item, idx) => {
          const pct = Math.min(100, Math.round((item.current / (item.goal || 1)) * 100));
          const dotsCount = 10;
          const activeDots = Math.max(1, Math.min(dotsCount, Math.round((pct / 100) * dotsCount)));

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>{item.label}</span>
                <span className="text-gray-900 font-extrabold">
                  {item.current.toFixed(1)}{item.unit}{' '}
                  <span className="text-[10px] text-gray-400 font-normal">({pct}%)</span>
                </span>
              </div>

              {/* Dot Matrix Row */}
              <div className="flex items-center gap-1.5 h-4">
                {Array.from({ length: dotsCount }).map((_, dotIdx) => {
                  const isActive = dotIdx < activeDots;
                  const isPeak = dotIdx === activeDots - 1 && isActive;

                  return (
                    <div
                      key={dotIdx}
                      className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                        isActive
                          ? isPeak ? `${item.color} scale-y-125 shadow-sm` : item.color
                          : 'bg-gray-100'
                      }`}
                    ></div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex justify-between">
        <span>South Indian diet profile</span>
        <span className="text-emerald-600 font-bold">Good mineral intake</span>
      </div>
    </div>
  );
};

export default DotMatrixChart;
