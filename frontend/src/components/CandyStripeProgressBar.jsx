import React from 'react';

/**
 * CandyStripeProgressBar
 * Diagonal hatched progress bar matching the Zentra volume progress bars.
 */
const CandyStripeProgressBar = ({ 
  label, 
  current = 0, 
  goal = 100, 
  unit = 'g', 
  color = 'green' 
}) => {
  const percentage = Math.round((current / (goal || 1)) * 100);
  const clampedWidth = Math.min(100, Math.max(0, percentage));

  const stripeClasses = {
    green: 'stripe-green',
    blue: 'stripe-blue',
    pink: 'stripe-pink',
    amber: 'stripe-amber'
  };

  const stripeClass = stripeClasses[color] || stripeClasses.green;

  const formattedCurrent = unit === 'kcal' || current >= 50
    ? Math.round(current)
    : Number(current).toFixed(current < 1 ? 2 : 1);

  const formattedGoal = unit === 'kcal' || goal >= 50
    ? Math.round(goal)
    : Number(goal).toFixed(goal < 1 ? 2 : 1);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline text-xs font-bold text-gray-700">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${stripeClass}`}></span>
          {label}
        </span>
        <span className="font-extrabold text-gray-900">
          {formattedCurrent}{unit}{' '}
          <span className="text-gray-400 font-normal">/ {formattedGoal}{unit}</span>
          <span className="ml-1.5 text-[10px] text-gray-500 font-semibold">({percentage}%)</span>
        </span>
      </div>

      <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
        <div 
          className={`${stripeClass} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clampedWidth}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CandyStripeProgressBar;
