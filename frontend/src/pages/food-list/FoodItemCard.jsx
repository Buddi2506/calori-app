import React from 'react';
import { Plus } from 'lucide-react';

// One food in the library: badges, macros and key micronutrients for the chosen portion.
const FoodItemCard = ({ item, portionMode, onLog }) => {
  const nutrients = (portionMode === 'serving' ? item.per_serving : item.per_100g) || item.per_100g || {};
  const isRaw = (item.name || '').toLowerCase().includes('(raw)');
  const isCooked = (item.name || '').toLowerCase().includes('(cooked') ||
                   (item.name || '').toLowerCase().includes('(boiled') ||
                   (item.name || '').toLowerCase().includes('(steamed');
  const isFruit = (item.category || '').toLowerCase().includes('fruit');
  const isSeed = (item.category || '').toLowerCase().includes('seed');
  const isScoop = item.serving_unit === 'scoop';

  return (
    <div
      className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 hover:border-green-400 hover:shadow-md transition-all flex flex-col justify-between group"
    >
      {/* Top Header of Item */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            {item.name_local && (
              <p className="text-xs font-medium text-orange-600 mt-0.5">
                {item.name_local}
              </p>
            )}
          </div>

          {/* Quick Log Button */}
          <button
            onClick={() => onLog(item)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all border border-green-200 hover:border-transparent flex-shrink-0 shadow-sm"
            title="Log to today's diary"
          >
            <Plus size={14} />
            <span>Log</span>
          </button>
        </div>

        {/* Badges Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
          {isRaw && (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold uppercase tracking-wider">
              🥩 Raw Weight
            </span>
          )}
          {isCooked && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold uppercase tracking-wider">
              🍲 Cooked / Boiled
            </span>
          )}
          {isFruit && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold uppercase tracking-wider">
              🍎 Fruit
            </span>
          )}
          {isSeed && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider">
              🌱 Seeds & Nuts
            </span>
          )}
          {isScoop && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold uppercase tracking-wider">
              💪 1 Scoop
            </span>
          )}

          <span className="text-gray-500 font-medium ml-auto">
            Serving: <span className="text-gray-800 font-semibold">1 {item.serving_unit} ({item.serving_unit_weight_g}g)</span>
          </span>
        </div>
      </div>

      {/* Nutrient Content Box */}
      <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
        {/* Macro Summary Row */}
        <div className="bg-gray-50/80 rounded-xl p-3 flex items-center justify-between gap-2 border border-gray-100">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Energy ({portionMode === 'serving' ? `1 ${item.serving_unit}` : item.base_unit})
            </span>
            <span className="text-xl font-black text-gray-900 flex items-center gap-1">
              {nutrients.calories ?? 0} <span className="text-xs font-semibold text-gray-500">kcal</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-right text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">Protein</span>
              <span className="font-bold text-emerald-700">{nutrients.protein ?? 0}g</span>
            </div>
            <div className="w-[1px] h-7 bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">Carbs</span>
              <span className="font-bold text-amber-700">{nutrients.carbohydrates ?? 0}g</span>
            </div>
            <div className="w-[1px] h-7 bg-gray-200" />
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">Fat</span>
              <span className="font-bold text-indigo-700">{nutrients.fat ?? 0}g</span>
            </div>
            {(nutrients.fiber ?? 0) > 0 && (
              <>
                <div className="w-[1px] h-7 bg-gray-200" />
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">Fiber</span>
                  <span className="font-bold text-teal-700">{nutrients.fiber ?? 0}g</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Micronutrients Grid */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
            Key Micronutrients ({portionMode === 'serving' ? `1 ${item.serving_unit}` : item.base_unit}):
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs">
            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Iron (Fe)</span>
              <span className={`font-semibold ${(nutrients.iron ?? 0) > 2 ? 'text-rose-700' : 'text-gray-800'}`}>
                {nutrients.iron ?? 0} mg
              </span>
            </div>

            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Calcium (Ca)</span>
              <span className={`font-semibold ${(nutrients.calcium ?? 0) > 50 ? 'text-amber-800' : 'text-gray-800'}`}>
                {nutrients.calcium ?? 0} mg
              </span>
            </div>

            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Potassium (K)</span>
              <span className="font-semibold text-gray-800">
                {nutrients.potassium ?? 0} mg
              </span>
            </div>

            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Sodium (Na)</span>
              <span className="font-semibold text-gray-800">
                {nutrients.sodium ?? 0} mg
              </span>
            </div>

            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Magnesium</span>
              <span className="font-semibold text-gray-800">
                {nutrients.magnesium ?? 0} mg
              </span>
            </div>

            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Zinc (Zn)</span>
              <span className="font-semibold text-gray-800">
                {nutrients.zinc ?? 0} mg
              </span>
            </div>

            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Vitamin C</span>
              <span className={`font-semibold ${(nutrients.vitamin_c ?? 0) > 10 ? 'text-green-700' : 'text-gray-800'}`}>
                {nutrients.vitamin_c ?? 0} mg
              </span>
            </div>

            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
              <span className="text-[10px] text-gray-400">Sat. Fat</span>
              <span className="font-semibold text-gray-800">
                {nutrients.saturated_fat ?? 0} g
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodItemCard;
