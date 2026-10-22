import React, { useState, useEffect } from 'react';
import { formatApiDate } from '../../utils/formatters';
import { getDailyReport } from '../../api/reports';
import CandyStripeProgressBar from '../../components/CandyStripeProgressBar';
import { Spinner, EmptyState } from './shared';

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
  const [date, setDate] = useState(formatApiDate(new Date()));
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
    <div className="space-y-6">
      <div className="zentra-card p-5 md:p-6 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-bold text-gray-800">Select Date:</label>
        <input
          type="date"
          value={date}
          max={formatApiDate(new Date())}
          onChange={e => setDate(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      {loading ? <Spinner /> : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Calories', val: Math.round(report.totals?.calories || 0), unit: 'kcal', color: 'text-gray-900' },
              { label: 'Protein', val: (report.totals?.protein || 0).toFixed(1), unit: 'g', color: 'text-emerald-600' },
              { label: 'Carbs', val: (report.totals?.carbohydrates || 0).toFixed(1), unit: 'g', color: 'text-blue-600' },
              { label: 'Fat', val: (report.totals?.fat || 0).toFixed(1), unit: 'g', color: 'text-pink-600' },
            ].map(c => (
              <div key={c.label} className="zentra-card p-5 text-center">
                <p className={`text-3xl font-black ${c.color}`}>{c.val}</p>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{c.label} ({c.unit})</p>
              </div>
            ))}
          </div>

          {/* Goal progress with modern Candy-Stripe status bars */}
          <div className="zentra-card p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Goal Achievement</h3>
                <p className="text-xs text-gray-400 font-medium">Daily nutritional intake vs target goals</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                Zentra Bio-Meter
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {[
                { label: 'Calories', key: 'calories', unit: 'kcal', color: 'amber' },
                { label: 'Protein', key: 'protein', unit: 'g', color: 'green' },
                { label: 'Carbohydrates', key: 'carbohydrates', unit: 'g', color: 'blue' },
                { label: 'Healthy Fat', key: 'fat', unit: 'g', color: 'pink' },
                { label: 'Dietary Fiber', key: 'fiber', unit: 'g', color: 'green' },
                { label: 'Iron (Fe)', key: 'iron', unit: 'mg', color: 'green' },
                { label: 'Calcium (Ca)', key: 'calcium', unit: 'mg', color: 'blue' },
                { label: 'Potassium (K)', key: 'potassium', unit: 'mg', color: 'blue' },
                { label: 'Vitamin C', key: 'vitamin_c', unit: 'mg', color: 'amber' },
                { label: 'Vitamin D', key: 'vitamin_d', unit: 'mcg', color: 'amber' },
                { label: 'Vitamin B12', key: 'vitamin_b12', unit: 'mcg', color: 'pink' },
                { label: 'Zinc (Zn)', key: 'zinc', unit: 'mg', color: 'green' },
                { label: 'Magnesium', key: 'magnesium', unit: 'mg', color: 'green' },
                { label: 'Sodium (Na)', key: 'sodium', unit: 'mg', color: 'pink' },
              ].map(n => (
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
          </div>

          {/* Food log & comprehensive micronutrient breakdown */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span>🍽️ Meal Intake & Micronutrient Breakdown</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Complete breakdown of vitamins, minerals, and macronutrients calculated by portion weight
                </p>
              </div>

              {/* View filter switcher */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-gray-200/80 shadow-sm self-start sm:self-auto text-xs font-bold">
                {[
                  { id: 'all', label: 'All Nutrients (15)' },
                  { id: 'micros', label: 'Micronutrients Only' },
                  { id: 'macros', label: 'Macros Only' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setNutrientFilter(f.id)}
                    className={`px-3 py-1 rounded-full transition-all ${
                      nutrientFilter === f.id
                        ? 'pill-active shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {Object.entries(report.entries || report.by_meal || {}).map(([mealType, items]) => {
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
                <div key={mealType} className="zentra-card p-5 sm:p-7 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h4 className="font-extrabold text-gray-900 capitalize flex items-center gap-2 text-base">
                      <span>
                        {mealType === 'snack' ? '🍿' : mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '🌞' : '🌙'}
                      </span>
                      <span>{mealType}</span>
                      <span className="text-xs font-semibold text-gray-400">
                        ({items.length} item{items.length > 1 ? 's' : ''} &bull; {Math.round(mealTotals.quantity_g)}g)
                      </span>
                    </h4>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-black text-gray-900 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-xl border border-amber-200/60">
                        {Math.round(mealTotals.calories)} kcal
                      </span>
                      <span className="text-gray-400 font-medium hidden sm:inline text-[11px]">
                        👉 Scroll horizontally for all micronutrients
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-200/80 shadow-sm">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50/90 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <th className="sticky left-0 bg-gray-100 py-3 px-4 text-left z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)] min-w-[190px]">
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
                          <tr key={item.id} className="group hover:bg-amber-50/20 transition-colors">
                            {/* Sticky Food Name Column */}
                            <td className="sticky left-0 bg-white group-hover:bg-[#1E2027] py-3.5 px-4 font-bold text-gray-900 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)] whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-900">{item.food?.name || item.food_name || 'Food'}</span>
                                {item.food?.category && (
                                  <span className="text-[10px] font-semibold text-amber-700/80 uppercase tracking-wider">{item.food.category}</span>
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
                        <tr className="bg-gray-50/90 border-t-2 border-gray-200 font-black text-xs">
                          <td className="sticky left-0 bg-gray-100 py-3.5 px-4 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.4)] whitespace-nowrap">
                            <span className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                              Total {mealType}
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
      ) : <EmptyState message="No data found for this date." />}
    </div>
  );
};

export default DailyReport;
