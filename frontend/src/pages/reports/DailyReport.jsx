import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { formatApiDate } from '../../utils/formatters';
import { getDailyReport } from '../../api/reports';
import CandyStripeProgressBar from '../../components/CandyStripeProgressBar';
import StatCard from '../../components/ui/StatCard';
import Segmented from '../../components/ui/Segmented';
import { MEAL_COLORS } from '../../components/dashboard/CaloriesCard';
import { mealLabel } from '../../utils/quickAdd';
import { Spinner, EmptyState, PeriodNav } from './shared';

const GOAL_BARS = {
  macros: [
    { label: 'Calories', key: 'calories', unit: 'kcal', color: 'amber' },
    { label: 'Protein', key: 'protein', unit: 'g', color: 'green' },
    { label: 'Carbs', key: 'carbohydrates', unit: 'g', color: 'blue' },
    { label: 'Fat', key: 'fat', unit: 'g', color: 'pink' },
    { label: 'Fiber', key: 'fiber', unit: 'g', color: 'amber' },
    { label: 'Sodium (limit)', key: 'sodium', unit: 'mg', color: 'pink' },
  ],
  micros: [
    { label: 'Iron', key: 'iron', unit: 'mg', color: 'green' },
    { label: 'Calcium', key: 'calcium', unit: 'mg', color: 'blue' },
    { label: 'Potassium', key: 'potassium', unit: 'mg', color: 'blue' },
    { label: 'Magnesium', key: 'magnesium', unit: 'mg', color: 'green' },
    { label: 'Zinc', key: 'zinc', unit: 'mg', color: 'green' },
    { label: 'Vitamin C', key: 'vitamin_c', unit: 'mg', color: 'amber' },
    { label: 'Vitamin D', key: 'vitamin_d', unit: 'mcg', color: 'amber' },
    { label: 'Vitamin B12', key: 'vitamin_b12', unit: 'mcg', color: 'pink' },
  ],
};

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

// ─── Daily Report Nutrient Columns ──────────────────────────────────────────
const ALL_NUTRIENT_COLS = [
  { key: 'calories', label: 'Cal', unit: 'kcal', category: 'macro', color: 'text-gray-900 font-extrabold', decimals: 0 },
  { key: 'protein', label: 'Protein', unit: 'g', category: 'macro', color: 'text-emerald-600 font-bold', decimals: 1 },
  { key: 'carbohydrates', label: 'Carbs', unit: 'g', category: 'macro', color: 'text-blue-600 font-bold', decimals: 1 },
  { key: 'fat', label: 'Fat', unit: 'g', category: 'macro', color: 'text-pink-600 font-bold', decimals: 1 },
  { key: 'fiber', label: 'Fiber', unit: 'g', category: 'macro', color: 'text-emerald-700 font-bold', decimals: 1 },
  { key: 'vitamin_b12', label: 'Vit B12', unit: 'mcg', category: 'micro', color: 'text-amber-600 font-bold', decimals: 2 },
  { key: 'vitamin_d', label: 'Vit D', unit: 'mcg', category: 'micro', color: 'text-amber-600 font-bold', decimals: 1 },
  { key: 'vitamin_c', label: 'Vit C', unit: 'mg', category: 'micro', color: 'text-amber-600 font-bold', decimals: 1 },
  { key: 'iron', label: 'Iron (Fe)', unit: 'mg', category: 'micro', color: 'text-indigo-600 font-bold', decimals: 1 },
  { key: 'calcium', label: 'Calcium (Ca)', unit: 'mg', category: 'micro', color: 'text-indigo-600 font-bold', decimals: 0 },
  { key: 'zinc', label: 'Zinc (Zn)', unit: 'mg', category: 'micro', color: 'text-teal-600 font-bold', decimals: 1 },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', category: 'micro', color: 'text-teal-600 font-bold', decimals: 0 },
  { key: 'potassium', label: 'Potassium (K)', unit: 'mg', category: 'micro', color: 'text-blue-700 font-bold', decimals: 0 },
  { key: 'sodium', label: 'Sodium (Na)', unit: 'mg', category: 'micro', color: 'text-rose-600 font-bold', decimals: 0 },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', category: 'micro', color: 'text-purple-600 font-bold', decimals: 0 },
];

// ─── Daily Report Tab ────────────────────────────────────────────────────────
const DailyReport = () => {
  const today = formatApiDate(new Date());
  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nutrientFilter, setNutrientFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    getDailyReport(date)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="flex flex-col gap-5">
      <PeriodNav
        label={format(parseISO(date), 'EEEE, d MMM')}
        onPrev={() => setDate(formatApiDate(subDays(parseISO(date), 1)))}
        onNext={() => setDate(formatApiDate(addDays(parseISO(date), 1)))}
        onReset={() => setDate(today)}
        resetLabel="Today"
        atLatest={date >= today}
      />

      {loading ? <Spinner /> : report ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Calories" value={Math.round(report.totals?.calories || 0).toLocaleString()} unit="kcal"
              note={`of ${Math.round(report.goals?.calories || 0).toLocaleString()} goal`} accent="stripe-amber" />
            <StatCard label="Protein" value={(report.totals?.protein || 0).toFixed(1)} unit="g"
              note={`of ${Math.round(report.goals?.protein || 0)} g goal`} accent="stripe-green" />
            <StatCard label="Carbs" value={(report.totals?.carbohydrates || 0).toFixed(1)} unit="g"
              note={`of ${Math.round(report.goals?.carbohydrates || 0)} g goal`} accent="stripe-blue" />
            <StatCard label="Fat" value={(report.totals?.fat || 0).toFixed(1)} unit="g"
              note={`of ${Math.round(report.goals?.fat || 0)} g goal`} accent="stripe-pink" />
          </div>

          <section className="zentra-card p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
            {[['Energy and macros', GOAL_BARS.macros], ['Vitamins and minerals', GOAL_BARS.micros]].map(([title, bars]) => (
              <div key={title} className="flex flex-col gap-4">
                <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
                {bars.map((n) => (
                  <CandyStripeProgressBar
                    key={n.key}
                    label={n.label}
                    current={report.totals?.[n.key] || 0}
                    goal={report.goals?.[n.key] || 1}
                    unit={n.unit}
                    color={n.color}
                  />
                ))}
              </div>
            ))}
          </section>

          {/* Food log & comprehensive micronutrient breakdown */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Food breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Every nutrient for each food, by portion weight ·{' '}
                  <Link to={`/diary/${date}`} className="font-bold text-amber-400 hover:text-amber-300">Open diary</Link>
                </p>
              </div>
              <Segmented
                label="Columns"
                value={nutrientFilter}
                onChange={setNutrientFilter}
                options={[
                  { id: 'all', label: 'All' },
                  { id: 'macros', label: 'Macros' },
                  { id: 'micros', label: 'Vitamins & minerals' },
                ]}
              />
            </div>

            {MEAL_ORDER.map((mealType) => [mealType, (report.entries || report.by_meal || {})[mealType]]).map(([mealType, items]) => {
              if (!items || items.length === 0) return null;

              // Compute meal totals
              const mealTotals = items.reduce((acc, it) => {
                acc.quantity_g = (acc.quantity_g || 0) + (it.quantity_g || 0);
                acc.calories = (acc.calories || 0) + (it.calories || 0);
                acc.protein = (acc.protein || 0) + (it.protein || 0);
                acc.carbohydrates = (acc.carbohydrates || 0) + (it.carbohydrates || 0);
                acc.fat = (acc.fat || 0) + (it.fat || 0);
                acc.fiber = (acc.fiber || 0) + (it.fiber || 0);
                acc.vitamin_b12 = (acc.vitamin_b12 || 0) + (it.vitamin_b12 || 0);
                acc.vitamin_d = (acc.vitamin_d || 0) + (it.vitamin_d || 0);
                acc.vitamin_c = (acc.vitamin_c || 0) + (it.vitamin_c || 0);
                acc.iron = (acc.iron || 0) + (it.iron || 0);
                acc.calcium = (acc.calcium || 0) + (it.calcium || 0);
                acc.zinc = (acc.zinc || 0) + (it.zinc || 0);
                acc.magnesium = (acc.magnesium || 0) + (it.magnesium || 0);
                acc.potassium = (acc.potassium || 0) + (it.potassium || 0);
                acc.sodium = (acc.sodium || 0) + (it.sodium || 0);
                acc.cholesterol = (acc.cholesterol || 0) + (it.cholesterol || 0);
                return acc;
              }, {});

              const visibleCols = ALL_NUTRIENT_COLS.filter((col) => {
                if (nutrientFilter === 'micros') return col.category === 'micro';
                if (nutrientFilter === 'macros') return col.category === 'macro';
                return true;
              });

              return (
                <div key={mealType} className="zentra-card p-5 sm:p-6 overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-1.5 h-9 rounded-full shrink-0" style={{ background: MEAL_COLORS[mealType] }} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-extrabold text-gray-900">{mealLabel(mealType)}</h4>
                      <p className="text-xs text-gray-500">
                        {items.length} {items.length === 1 ? 'item' : 'items'} · {Math.round(mealTotals.quantity_g)} g
                        <span className="hidden sm:inline"> · scroll the table sideways for more</span>
                      </p>
                    </div>
                    <span className="text-lg font-black text-gray-900">
                      {Math.round(mealTotals.calories)} <span className="text-xs font-normal text-gray-500">kcal</span>
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 border-b border-gray-100">
                          <th className="sticky left-0 bg-gray-50 py-3 px-4 text-left z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)] min-w-[190px]">
                            Food
                          </th>
                          <th className="py-3 px-3 text-right min-w-[90px] border-b border-gray-200">Portion</th>
                          <th className="py-3 px-3 text-right min-w-[70px] border-b border-gray-200">Weight</th>
                          {visibleCols.map((col) => (
                            <th key={col.key} className="py-3 px-3 text-right min-w-[82px] whitespace-nowrap border-b border-gray-200">
                              <span>{col.label}</span>{' '}
                              {col.unit && <span className="text-[10px] font-normal text-gray-400 lowercase">({col.unit})</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {items.map((item) => (
                          <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                            {/* Sticky Food Name Column */}
                            <td className="sticky left-0 bg-white group-hover:bg-gray-50 py-3.5 px-4 font-bold text-gray-900 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)] whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-900">{item.food?.name || item.food_name || 'Food'}</span>
                                {item.food?.category && (
                                  <span className="text-[11px] font-medium text-gray-500">{item.food.category}</span>
                                )}
                              </div>
                            </td>

                            {/* Quantity display */}
                            <td className="py-3.5 px-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">
                              {item.quantity_display} {item.quantity_unit}
                            </td>

                            {/* Actual weight in grams */}
                            <td className="py-3.5 px-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                              {Math.round(item.quantity_g || 0)}g
                            </td>

                            {/* Nutrient columns */}
                            {visibleCols.map((col) => {
                              const val = item[col.key] || 0;
                              const isZero = !val || Math.abs(val) < 0.001;
                              const formatted = isZero
                                ? (col.decimals === 0 ? '0' : '0.0')
                                : col.decimals === 0
                                ? Math.round(val)
                                : val.toFixed(col.decimals);

                              return (
                                <td
                                  key={col.key}
                                  className={`py-3.5 px-3 text-right whitespace-nowrap ${
                                    isZero ? 'text-gray-300 font-normal' : col.color
                                  }`}
                                >
                                  {formatted}{col.unit}
                                </td>
                              );
                            })}
                          </tr>
                        ))}

                        {/* Meal Totals Summary Row */}
                        <tr className="bg-gray-50 border-t border-gray-200 font-black text-xs">
                          <td className="sticky left-0 bg-gray-50 py-3.5 px-4 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)] whitespace-nowrap">
                            <span className="font-black text-gray-900 text-xs">
                              {mealLabel(mealType)} total
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right text-gray-500 whitespace-nowrap">
                            {items.length} item{items.length > 1 ? 's' : ''}
                          </td>
                          <td className="py-3.5 px-3 text-right text-gray-900 font-black whitespace-nowrap">
                            {Math.round(mealTotals.quantity_g)}g
                          </td>
                          {visibleCols.map((col) => {
                            const val = mealTotals[col.key] || 0;
                            const isZero = !val || Math.abs(val) < 0.001;
                            const formatted = isZero
                              ? (col.decimals === 0 ? '0' : '0.0')
                              : col.decimals === 0
                              ? Math.round(val)
                              : val.toFixed(col.decimals);

                            return (
                              <td
                                key={col.key}
                                className={`py-3.5 px-3 text-right whitespace-nowrap ${
                                  isZero ? 'text-gray-400 font-medium' : col.color
                                }`}
                              >
                                {formatted}{col.unit}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : <EmptyState message="Couldn't load this day's report." />}
    </div>
  );
};

export default DailyReport;
