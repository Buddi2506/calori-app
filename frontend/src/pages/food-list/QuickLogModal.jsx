import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { addDiaryEntry } from '../../api/diary';

// Starting amount for a food: one serving if it has a serving unit, else 100 g.
const initialPortion = (food) => {
  const unit = food.serving_unit || 'g';
  return unit !== 'g' && unit !== 'ml' ? { unit, quantity: 1 } : { unit: 'g', quantity: 100 };
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Quick Log to Diary</span>
            <h3 className="text-xl font-bold text-gray-900">{logModalFood.name}</h3>
            {logModalFood.name_local && (
              <p className="text-sm font-medium text-orange-600">{logModalFood.name_local}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {loggingSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-14 h-14 bg-green-100 text-primary rounded-full flex items-center justify-center mx-auto text-2xl">
              <Check size={28} />
            </div>
            <p className="font-bold text-gray-800 text-lg">Logged Successfully!</p>
            <p className="text-xs text-gray-500">Added to your {logMealType} diary.</p>
          </div>
        ) : (
          <form onSubmit={handleConfirmLog} className="space-y-4">
            {/* Date and Meal Period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Meal Period</label>
                <select
                  className="input-field text-sm bg-gray-50"
                  value={logMealType}
                  onChange={(e) => setLogMealType(e.target.value)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  className="input-field text-sm bg-gray-50"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                />
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  className="input-field text-base font-bold bg-gray-50"
                  value={logQuantity}
                  onChange={(e) => setLogQuantity(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Unit</label>
                <select
                  className="input-field text-sm bg-gray-50"
                  value={logUnit}
                  onChange={(e) => setLogUnit(e.target.value)}
                >
                  <option value="g">Grams (g)</option>
                  {logModalFood.serving_unit && logModalFood.serving_unit !== 'g' && (
                    <option value={logModalFood.serving_unit}>
                      1 {logModalFood.serving_unit.charAt(0).toUpperCase() + logModalFood.serving_unit.slice(1)} ({logModalFood.serving_unit_weight_g}g)
                    </option>
                  )}
                  <option value="cup">Cup (~150g)</option>
                  <option value="tbsp">Tablespoon (15g)</option>
                  <option value="tsp">Teaspoon (5g)</option>
                  <option value="ml">Milliliters (ml)</option>
                </select>
              </div>
            </div>

            {/* Calculated Live Calories */}
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Total Nutrition for this entry:</span>
              <span className="text-sm font-black text-emerald-900">
                {(() => {
                  const qty = parseFloat(logQuantity) || 0;
                  let grams = qty;
                  if (logUnit === logModalFood.serving_unit && logModalFood.serving_unit_weight_g) {
                    grams = qty * logModalFood.serving_unit_weight_g;
                  } else if (logUnit === 'cup') {
                    grams = qty * 150;
                  } else if (logUnit === 'tbsp') {
                    grams = qty * 15;
                  } else if (logUnit === 'tsp') {
                    grams = qty * 5;
                  }
                  const cal = Math.round(((logModalFood.calories || 0) * grams) / 100);
                  const pro = (((logModalFood.protein || 0) * grams) / 100).toFixed(1);
                  return `${cal} kcal • ${pro}g Protein (${Math.round(grams)}g)`;
                })()}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loggingLoading}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-md shadow-green-900/10"
              >
                {loggingLoading ? 'Logging...' : '+ Add to Diary'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickLogModal;
