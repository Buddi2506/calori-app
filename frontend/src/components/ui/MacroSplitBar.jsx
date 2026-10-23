import React from 'react';
import { MACRO_COLORS, macroSplit } from '../../utils/macros';

const LABELS = { protein: 'protein', carbohydrates: 'carbs', fat: 'fat' };

// Thin bar showing where a food's calories come from.
const MacroSplitBar = ({ nutrients, className = 'h-1.5' }) => {
  const split = macroSplit(nutrients);
  if (!split) return <div className={`${className} rounded-full bg-gray-100`} />;
  const keys = Object.keys(MACRO_COLORS).filter((k) => split[k] > 0);
  return (
    <div
      className={`${className} flex gap-0.5 rounded-full overflow-hidden bg-gray-100`}
      role="img"
      aria-label={`Calories: ${keys.map((k) => `${Math.round(split[k] * 100)}% ${LABELS[k]}`).join(', ')}`}
    >
      {keys.map((k) => (
        <div key={k} style={{ width: `${split[k] * 100}%`, background: MACRO_COLORS[k] }} />
      ))}
    </div>
  );
};

export default MacroSplitBar;
