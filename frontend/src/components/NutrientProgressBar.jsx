import React from 'react';
import { getProgressColor } from '../utils/formatters';

const NutrientProgressBar = ({ label, current = 0, goal = 0, unit = 'g' }) => {
  const percentage = goal > 0 ? (current / goal) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100);
  const colorClass = getProgressColor(percentage);

  return (
    <div className="mb-4 w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          <span className="font-semibold text-gray-900">{Number(current).toFixed(1)}</span> {unit} / {goal} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${displayPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default NutrientProgressBar;
