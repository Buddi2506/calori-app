import React from 'react';
import { Link } from 'react-router-dom';

const NUTRIENTS = [
  { key: 'vitamin_b12', label: 'B12' },
  { key: 'iron', label: 'Iron' },
  { key: 'calcium', label: 'Calcium' },
  { key: 'potassium', label: 'Potassium' },
  { key: 'magnesium', label: 'Magnesium' },
  { key: 'zinc', label: 'Zinc' },
  { key: 'vitamin_c', label: 'Vitamin C' },
  { key: 'vitamin_d', label: 'Vitamin D' },
  { key: 'sodium', label: 'Sodium', limit: true },
  { key: 'saturated_fat', label: 'Sat. fat', limit: true },
];

const TONES = {
  good: 'bg-emerald-50 text-emerald-300',
  mid: 'bg-amber-50 text-amber-300',
  bad: 'bg-rose-50 text-rose-300',
};

// Targets to reach: red under 40%, amber under 75%. Limits to stay under: amber from 80%, red past 100%.
const tone = (pct, limit) => {
  if (limit) return pct > 100 ? 'bad' : pct >= 80 ? 'mid' : 'good';
  return pct < 40 ? 'bad' : pct < 75 ? 'mid' : 'good';
};

// Vitamins and minerals as colored chips showing % of the daily goal.
const NutrientChipsCard = ({ totals, goals }) => {
  const chips = NUTRIENTS
    .filter((n) => goals[n.key])
    .map((n) => {
      const pct = Math.round(((totals[n.key] || 0) / goals[n.key]) * 100);
      return { ...n, pct, tone: tone(pct, n.limit) };
    });

  return (
    <section className="zentra-card p-6 flex flex-col gap-3.5 col-span-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-gray-600">Minerals &amp; vitamins</h2>
        <Link to="/reports" className="text-[13px] font-bold text-amber-400 hover:text-amber-300">See all</Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.key} className={`px-3 py-2 rounded-xl text-[13px] font-bold ${TONES[c.tone]}`}>
            {c.label} · {c.pct}%
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">
        Red is far from goal (or over a limit like sodium), amber is partway, green is on track.
      </p>
    </section>
  );
};

export default NutrientChipsCard;
