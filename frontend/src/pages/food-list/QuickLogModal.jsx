import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { addDiaryEntry } from '../../api/diary';
import { mealLabel } from '../../utils/quickAdd';
import Modal, { FieldLabel } from '../../components/ui/Modal';
import MealPicker from '../../components/ui/MealPicker';

// Starting amount for a food: one serving if it has a serving unit, else 100 g.
const initialPortion = (food) => {
  const unit = food.serving_unit || 'g';
  return unit !== 'g' && unit !== 'ml' ? { unit, quantity: 1 } : { unit: 'g', quantity: 100 };
};

// Grams for an amount, mirroring resolve_quantity_in_grams in backend/app/routers/diary.py
// so the preview matches what the server logs.
const portionGrams = (food, quantity, unit) => {
  const qty = parseFloat(quantity) || 0;
  const weight = food.serving_unit_weight_g;
  if (unit === 'g' || unit === 'ml') return qty;
  if (unit === 'scoop') return qty * (weight || 33);
  if (unit === 'piece' && weight) return qty * weight;
  if (unit === 'glass') return qty * (food.serving_unit === 'glass' ? weight : 200);
  if (unit === 'cup') return qty * (food.serving_unit === 'cup' ? weight : 240);
  if (unit === 'tbsp') return qty * 15;
  if (unit === 'tsp') return qty * 5;
  if (food.serving_unit && unit === food.serving_unit.toLowerCase() && weight) return qty * weight;
  return qty;
};

// Log a library food straight to the diary. Meal and date live in the page so they persist between logs.
const QuickLogModal = ({ food: logModalFood, logMealType, setLogMealType, logDate, setLogDate, onClose }) => {
  const [logQuantity, setLogQuantity] = useState(() => initialPortion(logModalFood).quantity);
  const [logUnit, setLogUnit] = useState(() => initialPortion(logModalFood).unit);
  const [loggingSuccess, setLoggingSuccess] = useState(false);
  const [loggingLoading, setLoggingLoading] = useState(false);

  const handleConfirmLog = async (e) => {
    e.preventDefault();
    if (!logModalFood) return;

    try {
      setLoggingLoading(true);
      await addDiaryEntry({
        date: logDate,
        meal_type: logMealType,
        food_id: logModalFood.id,
        quantity_display: parseFloat(logQuantity) || 1,
        quantity_unit: logUnit
      });
      setLoggingSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to log food:', err);
      alert('Could not log food. Please try again.');
    } finally {
      setLoggingLoading(false);
    }
  };

  // Library foods carry their nutrients in per_100g, not at the top level
  const per100 = logModalFood.per_100g || logModalFood;
  const grams = portionGrams(logModalFood, logQuantity, logUnit);
  const preview = {
    calories: Math.round(((per100.calories || 0) * grams) / 100),
    protein: (((per100.protein || 0) * grams) / 100).toFixed(1),
    carbs: (((per100.carbohydrates || 0) * grams) / 100).toFixed(1),
    fat: (((per100.fat || 0) * grams) / 100).toFixed(1),
  };

  return (
    <Modal title={logModalFood.name} subtitle={logModalFood.name_local || 'Log to your diary'} size="sm" onClose={onClose}>
      {loggingSuccess ? (
        <div className="py-8 text-center flex flex-col items-center gap-2">
          <span className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Check size={28} />
          </span>
          <p className="font-bold text-gray-900 text-lg">Logged</p>
          <p className="text-sm text-gray-500">Added to {mealLabel(logMealType).toLowerCase()} on {logDate}.</p>
        </div>
      ) : (
        <form onSubmit={handleConfirmLog} className="flex flex-col gap-4">
          <div>
            <FieldLabel>Meal</FieldLabel>
            <MealPicker value={logMealType} onChange={setLogMealType} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="quick-log-qty">Amount</FieldLabel>
              <input
                id="quick-log-qty"
                type="number"
                min="0.1"
                step="any"
                className="input-field text-base font-bold"
                value={logQuantity}
                onChange={(e) => setLogQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="quick-log-unit">Unit</FieldLabel>
              <select
                id="quick-log-unit"
                className="input-field text-sm"
                value={logUnit}
                onChange={(e) => setLogUnit(e.target.value)}
              >
                <option value="g">Grams (g)</option>
                {logModalFood.serving_unit && logModalFood.serving_unit !== 'g' && (
                  <option value={logModalFood.serving_unit}>
                    1 {logModalFood.serving_unit.charAt(0).toUpperCase() + logModalFood.serving_unit.slice(1)} ({logModalFood.serving_unit_weight_g}g)
                  </option>
                )}
                <option value="cup">Cup (~240g)</option>
                <option value="tbsp">Tablespoon (15g)</option>
                <option value="tsp">Teaspoon (5g)</option>
                <option value="ml">Milliliters (ml)</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="quick-log-date">Date</FieldLabel>
            <input
              id="quick-log-date"
              type="date"
              className="input-field text-sm"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
            />
          </div>

          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-center justify-between gap-3">
            <span>
              <span className="text-2xl font-black text-gray-900">{preview.calories}</span>
              <span className="text-xs text-gray-500"> kcal · {Math.round(grams)} g</span>
            </span>
            <span className="flex gap-3 text-xs">
              <span className="text-protein font-bold">{preview.protein}g P</span>
              <span className="text-carbs font-bold">{preview.carbs}g C</span>
              <span className="text-fat font-bold">{preview.fat}g F</span>
            </span>
          </div>

          <button type="submit" disabled={loggingLoading} className="w-full btn-primary h-12 flex items-center justify-center gap-2">
            <Check size={18} /> {loggingLoading ? 'Logging…' : `Add to ${mealLabel(logMealType)}`}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default QuickLogModal;
