import React from 'react';

// Big number with a label, matching the Dashboard macro cards.
const StatCard = ({ label, value, unit, note, accent }) => (
  <section className="zentra-card p-5 flex flex-col gap-2">
    <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
      {accent && <span className={`w-2 h-2 rounded-full ${accent}`} aria-hidden="true" />}
      {label}
    </h2>
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl font-black tracking-tight text-gray-900">{value}</span>
      {unit && <span className="text-sm text-gray-600">{unit}</span>}
    </div>
    {note && <span className="text-xs text-gray-500">{note}</span>}
  </section>
);

export default StatCard;
