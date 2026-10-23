import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Plus } from 'lucide-react';
import Segmented from './Segmented';
import { MACRO_COLORS, macroSplit, nutrientsFor, portionLabel, proteinDensity, foodTags } from './nutrition';

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbohydrates', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
];

const DETAILS = [
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'saturated_fat', label: 'Saturated fat', unit: 'g' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
  { key: 'zinc', label: 'Zinc', unit: 'mg' },
  { key: 'vitamin_c', label: 'Vitamin C', unit: 'mg' },
];

const fmt = (v) => Math.round((v || 0) * 10) / 10;

// Ring of calorie share per macro with the calories in the middle.
const CalorieRing = ({ nutrients }) => {
  const split = macroSplit(nutrients);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative w-[136px] h-[136px] shrink-0">
      <svg viewBox="0 0 136 136" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="68" cy="68" r={r} fill="none" stroke="#24262E" strokeWidth="14" />
        {split && MACROS.map(({ key }) => {
          const len = split[key] * c;
          const arc = (
            <circle
              key={key}
              cx="68" cy="68" r={r} fill="none"
              stroke={MACRO_COLORS[key]} strokeWidth="14"
              strokeDasharray={`${Math.max(0, len - 3)} ${c}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return arc;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tracking-tight text-gray-900">{Math.round(nutrients.calories || 0)}</span>
        <span className="text-xs text-gray-500">kcal</span>
      </div>
    </div>
  );
};

// Full nutrition for one food, as a side panel (bottom sheet on phones).
const FoodDetailPanel = ({ item, portionMode: initialMode, onLog, onClose }) => {
  const [portionMode, setPortionMode] = useState(initialMode);
  const n = nutrientsFor(item, portionMode);
  const split = macroSplit(n);
  const hasServing = item.serving_unit !== 'g' && item.serving_unit !== 'ml';

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <Dialog.Panel className="fixed inset-x-0 bottom-0 max-h-[88vh] rounded-t-[28px] md:inset-y-0 md:left-auto md:right-0 md:w-[440px] md:max-h-none md:rounded-none md:rounded-l-[28px] bg-white border border-gray-100 shadow-2xl flex flex-col">
        <div className="flex items-start gap-3 p-6 pb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.category}</p>
            <Dialog.Title className="text-2xl font-black tracking-tight text-gray-900 mt-1">{item.name}</Dialog.Title>
            {item.name_local && <p className="text-sm text-orange-600 mt-0.5">{item.name_local}</p>}
            {foodTags(item).length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {foodTags(item).map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold">{t}</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-6">
          {hasServing && (
            <Segmented
              label="Portion"
              value={portionMode}
              onChange={setPortionMode}
              options={[
                { id: '100g', label: `Per ${item.base_unit}` },
                { id: 'serving', label: `1 ${item.serving_unit} (${item.serving_unit_weight_g}g)` },
              ]}
            />
          )}

          <div className="flex items-center gap-6">
            <CalorieRing nutrients={n} />
            <ul className="flex-1 flex flex-col gap-3">
              {MACROS.map(({ key, label }) => (
                <li key={key} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MACRO_COLORS[key] }} aria-hidden="true" />
                  <span className="flex-1 text-sm text-gray-700">{label}</span>
                  <span className="text-sm font-extrabold text-gray-900">{fmt(n[key])}g</span>
                  <span className="w-10 text-right text-xs text-gray-500">{split ? `${Math.round(split[key] * 100)}%` : '–'}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="-mt-3 text-xs text-gray-500">
            {portionLabel(item, portionMode)} · ring shows where the calories come from
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <span className="block text-2xl font-black text-gray-900">{fmt(proteinDensity(item))}g</span>
              <span className="text-xs text-gray-500">protein per 100 kcal</span>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <span className="block text-2xl font-black text-gray-900">{fmt(n.fiber)}g</span>
              <span className="text-xs text-gray-500">fiber {portionLabel(item, portionMode)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">All nutrients</h3>
            <dl className="divide-y divide-gray-100">
              {DETAILS.map(({ key, label, unit }) => (
                <div key={key} className="flex justify-between py-2.5 text-sm">
                  <dt className="text-gray-600">{label}</dt>
                  <dd className="font-bold text-gray-900">{fmt(n[key])} {unit}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => onLog(item)} className="w-full btn-primary h-12 flex items-center justify-center gap-2">
            <Plus size={18} /> Log this food
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default FoodDetailPanel;
