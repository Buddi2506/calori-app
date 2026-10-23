import React from 'react';

/**
 * CandyStripeProgressBar
 * Labelled amount-vs-goal bar with the diagonal stripe fill.
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
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline gap-3 text-sm">
        <span className="font-bold text-gray-700">{label}</span>
        <span className="text-gray-600 whitespace-nowrap">
          <span className="font-extrabold text-gray-900">{formattedCurrent}</span> / {formattedGoal} {unit}
          <span className="ml-2 text-xs text-gray-500">{percentage}%</span>
        </span>
      </div>

      <div
        className="h-2 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${stripeClass} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
    </div>
  );
};

export default CandyStripeProgressBar;
