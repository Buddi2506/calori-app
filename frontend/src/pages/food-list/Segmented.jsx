import React from 'react';

// Small pill toggle: options = [{ id, label }].
const Segmented = ({ label, options, value, onChange, className = '' }) => (
  <div role="group" aria-label={label} className={`flex gap-1 bg-gray-100 p-1 rounded-full ${className}`}>
    {options.map((o) => (
      <button
        key={o.id}
        onClick={() => onChange(o.id)}
        aria-pressed={value === o.id}
        className={`flex-1 px-3.5 h-9 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
          value === o.id ? 'pill-active' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export default Segmented;
