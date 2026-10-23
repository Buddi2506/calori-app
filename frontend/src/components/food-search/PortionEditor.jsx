import React from 'react';
import { Check } from 'lucide-react';
import {
  isLiquidFood, isSeedOrNut, isRawMeat, isFruit, isCookedName, calculatePortionNutrition,
} from '../../utils/foodPortions';

// Second step of adding a food: pick the amount and unit, preview nutrients, then add.
// `submitLabel` replaces the "Add … to <meal>" button text, e.g. when editing an entry.
const PortionEditor = ({ food: selectedFood, quantity, setQuantity, unit, setUnit, mealLabel, onAdd, submitLabel }) => {
  const nutrition = calculatePortionNutrition(selectedFood, quantity, unit);
  const isLiquid = isLiquidFood(selectedFood);
  const isScoop = selectedFood.serving_unit === 'scoop';
  const isSeed = isSeedOrNut(selectedFood);
  const isMeat = isRawMeat(selectedFood);
  const isCooked = isCookedName(selectedFood);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{selectedFood.name}</h2>
          {selectedFood.name_local && (
            <p className="text-sm text-orange-600 font-medium mt-0.5">{selectedFood.name_local}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            Base: {Math.round(selectedFood.calories ?? 0)} kcal per {isLiquid ? '100ml' : '100g'} {isMeat ? '(Raw/Uncooked)' : selectedFood.name.toLowerCase().includes('(raw)') ? '(Raw weight)' : ''}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isMeat
            ? 'bg-rose-100 text-rose-800'
            : isCooked
            ? 'bg-blue-100 text-blue-800'
            : isFruit(selectedFood)
            ? 'bg-amber-100 text-amber-800'
            : isSeed
            ? 'bg-emerald-100 text-emerald-800'
            : isScoop
            ? 'bg-purple-100 text-purple-800'
            : isLiquid
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {isMeat
            ? '🥩 Raw Meat (Uncooked)'
            : isCooked
            ? '🍲 Cooked / Boiled'
            : isFruit(selectedFood)
            ? '🍎 Fresh Fruit'
            : isSeed
            ? '🌱 Seeds & Nuts'
            : isScoop
            ? '💪 Whey Protein'
            : isLiquid
            ? '💧 Beverage / Liquid'
            : (selectedFood.category || 'Food')}
        </span>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isScoop ? 'Number of Scoops' : isMeat || isSeed ? 'Quantity (Grams)' : 'Quantity'}
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              className="input-field text-lg font-semibold bg-white"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              className="input-field text-base font-medium bg-white"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {isMeat ? (
                <>
                  <option value="g">Grams (g)</option>
                  {selectedFood.serving_unit === 'piece' && (
                    <option value="piece">Piece / Fillet (~{selectedFood.serving_unit_weight_g}g)</option>
                  )}
                  <option value="cup">Cup chopped (~140g)</option>
                </>
              ) : isFruit(selectedFood) ? (
                <>
                  {selectedFood.serving_unit === 'piece' && (
                    <option value="piece">1 Piece (~{selectedFood.serving_unit_weight_g}g)</option>
                  )}
                  {selectedFood.serving_unit === 'cup' && (
                    <option value="cup">1 Cup (~{selectedFood.serving_unit_weight_g}g)</option>
                  )}
                  {selectedFood.serving_unit === 'tbsp' && (
                    <option value="tbsp">1 Tablespoon (~{selectedFood.serving_unit_weight_g}g)</option>
                  )}
                  {selectedFood.serving_unit === 'glass' && (
                    <option value="glass">1 Glass (~{selectedFood.serving_unit_weight_g}ml)</option>
                  )}
                  <option value="g">Grams (g)</option>
                </>
              ) : isSeed ? (
                <>
                  <option value="g">Grams (g)</option>
                  <option value="tbsp">Tablespoon (~10g)</option>
                  <option value="tsp">Teaspoon (~5g)</option>
                </>
              ) : isScoop ? (
                <>
                  <option value="scoop">Scoop ({selectedFood.serving_unit_weight_g}g each)</option>
                  <option value="g">Grams (g)</option>
                </>
              ) : isLiquid ? (
                <>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="glass">Glass (~200 ml)</option>
                  <option value="cup">Cup (~240 ml)</option>
                  <option value="tbsp">Tablespoon (15 ml)</option>
                  <option value="tsp">Teaspoon (5 ml)</option>
                  <option value="g">Grams (g)</option>
                </>
              ) : (
                <>
                  <option value="g">Grams (g)</option>
                  {selectedFood.serving_unit && selectedFood.serving_unit !== 'g' && (
                    <option value={selectedFood.serving_unit}>
                      {selectedFood.serving_unit.charAt(0).toUpperCase() + selectedFood.serving_unit.slice(1)}
                      {selectedFood.serving_unit_weight_g ? ` (${selectedFood.serving_unit_weight_g}g)` : ''}
                    </option>
                  )}
                  <option value="cup">Cup (~200g)</option>
                  <option value="tbsp">Tablespoon (15g)</option>
                  <option value="tsp">Teaspoon (5g)</option>
                  <option value="ml">Milliliters (ml)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Weight / Meat / Seed Explanation */}
        {isMeat ? (
          <p className="text-xs text-rose-700 font-medium">
            🥩 Raw Weight: Calculated for <span className="font-bold">{nutrition.totalGrams}g</span> raw uncooked weight.
          </p>
        ) : isSeed ? (
          <p className="text-xs text-emerald-800 font-medium">
            Calculated precisely for <span className="font-bold">{nutrition.totalGrams}g</span>
            {unit === 'tbsp' ? ` (${quantity} tbsp × 10g)` : unit === 'tsp' ? ` (${quantity} tsp × 5g)` : ''}
          </p>
        ) : isScoop ? (
          unit === 'scoop' ? (
            <p className="text-xs text-purple-700 font-medium">
              Total weight: <span className="font-bold">{nutrition.totalGrams}g</span> ({quantity} {quantity === 1 ? 'scoop' : 'scoops'} × {selectedFood.serving_unit_weight_g}g)
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Weight: <span className="font-semibold text-gray-700">{nutrition.totalGrams}g</span> (~{(quantity / (selectedFood.serving_unit_weight_g || 33)).toFixed(1)} scoops)
            </p>
          )
        ) : isLiquid ? (
          unit === 'ml' ? (
            <p className="text-xs text-gray-500">
              Common liquid sizes: <span className="font-semibold text-gray-700">1 glass = 200 ml</span> • 1 cup = 240 ml
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Equivalent volume: <span className="font-semibold text-gray-700">{nutrition.totalGrams} ml</span>
            </p>
          )
        ) : (
          unit !== 'g' && unit !== 'ml' && (
            <p className="text-xs text-gray-500">
              Total weight: <span className="font-semibold text-gray-700">{nutrition.totalGrams}g</span>
            </p>
          )
        )}
      </div>

      {/* Macronutrient preview cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-4 text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <span className="block text-2xl font-bold text-green-700">{nutrition.calories}</span>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Calories</span>
        </div>
        <div className="bg-white border border-rose-200 rounded-xl p-3 shadow-sm bg-rose-50/20">
          <span className="block text-2xl font-bold text-rose-600">{nutrition.protein}g</span>
          <span className="block text-xs font-semibold text-rose-700 uppercase tracking-wider mt-0.5">Protein</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <span className="block text-2xl font-bold text-yellow-600">{nutrition.carbs}g</span>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Carbs</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <span className="block text-2xl font-bold text-red-500">{nutrition.fat}g</span>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">Fat</span>
        </div>
      </div>

      {/* Micronutrients breakdown strip */}
      {(nutrition.fiber > 0 || nutrition.calcium > 0 || nutrition.potassium > 0 || nutrition.sodium > 0 || nutrition.iron > 0 || nutrition.magnesium > 0 || nutrition.zinc > 0) && (
        <div className="bg-gray-50 rounded-xl p-3 mb-6 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Micronutrients for {nutrition.totalGrams}g:
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700">
            {nutrition.fiber > 0 && <span>Fiber: <strong className="text-emerald-700">{nutrition.fiber} g</strong></span>}
            {nutrition.iron > 0 && <span>Iron: <strong className="text-gray-900">{nutrition.iron} mg</strong></span>}
            {nutrition.zinc > 0 && <span>Zinc: <strong className="text-gray-900">{nutrition.zinc} mg</strong></span>}
            {nutrition.potassium > 0 && <span>Potassium: <strong className="text-gray-900">{nutrition.potassium} mg</strong></span>}
            {nutrition.calcium > 0 && <span>Calcium: <strong className="text-gray-900">{nutrition.calcium} mg</strong></span>}
            {nutrition.magnesium > 0 && <span>Magnesium: <strong className="text-gray-900">{nutrition.magnesium} mg</strong></span>}
            {nutrition.sodium > 0 && <span>Sodium: <strong className="text-gray-900">{nutrition.sodium} mg</strong></span>}
          </div>
        </div>
      )}

      <button
        onClick={onAdd}
        className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-base font-semibold shadow-md shadow-green-600/20"
      >
        <Check size={20} /> {submitLabel || <>Add {quantity}{unit === 'g' || unit === 'ml' ? unit : ` ${unit}`} to {mealLabel}</>}
      </button>
    </div>
  );
};

export default PortionEditor;
