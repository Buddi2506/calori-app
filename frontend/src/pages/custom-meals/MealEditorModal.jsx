import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Check, Trash2, AlertCircle } from 'lucide-react';
import { createMeal, updateMeal } from '../../api/meals';
import IngredientSearch from './IngredientSearch';
import {
  EMOJI_OPTIONS, UNIT_OPTIONS, itemFromSaved, itemFromFood, withQuantity, withUnit, mealTotals,
} from './mealItems';

// Create a custom meal (meal = null) or edit an existing one.
const MealEditorModal = ({ meal: editingMeal, onClose, onSaved }) => {
  const [mealName, setMealName] = useState(editingMeal?.name || '');
  const [description, setDescription] = useState(editingMeal?.description || '');
  const [emoji, setEmoji] = useState(editingMeal?.image_emoji || '🍛');
  const [items, setItems] = useState(() => (editingMeal?.items || []).map(itemFromSaved));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddFoodToMeal = (food) => {
    const newItem = itemFromFood(food);

    setItems(prev => {
      const next = [...prev, newItem];
      // Auto-suggest name if empty
      if (!mealName.trim()) {
        const suggested = next.map(i => i.food_name).slice(0, 2).join(' & ');
        setMealName(suggested);
      }
      return next;
    });

    setErrorMessage('');
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemQtyChange = (index, newQty) => {
    setItems(prev => prev.map((item, i) => (i === index ? withQuantity(item, newQty) : item)));
  };

  const handleItemUnitChange = (index, newUnit) => {
    setItems(prev => prev.map((item, i) => (i === index ? withUnit(item, newUnit) : item)));
  };

  const totalMealNutrition = mealTotals(items);

  const handleSaveMeal = async () => {
    setErrorMessage('');

    // Fallback: If user didn't enter a meal name, auto-create one from items
    let finalName = mealName.trim();
    if (!finalName) {
      if (items.length > 0) {
        finalName = items.map(i => i.food_name).slice(0, 3).join(' + ');
      } else {
        setErrorMessage('Please add at least one food item to this meal.');
        return;
      }
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one food item using the search box below.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: finalName,
        description: description.trim(),
        image_emoji: emoji,
        items: items.map(it => ({
          food_id: it.food_id,
          quantity_display: parseFloat(it.quantity_display) || 1,
          quantity_unit: it.quantity_unit,
        })),
      };

      if (editingMeal) {
        await updateMeal(editingMeal.id, payload);
        onSaved(`Updated "${finalName}" successfully! ✨`);
      } else {
        await createMeal(payload);
        onSaved(`Created "${finalName}" successfully! 🎉`);
      }
    } catch (err) {
      console.error('Save meal error:', err);
      setErrorMessage('Failed to save meal. Please check details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[740px]">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>{editingMeal ? '✏️ Edit Custom Meal' : '✨ Create Custom Meal'}</span>
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Inline Error Alert */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Meal Name & Emoji */}
            <div className="flex gap-4 items-start">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Emoji</label>
                <select
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="input-field text-2xl py-2 px-2 text-center w-16 bg-white"
                >
                  {EMOJI_OPTIONS.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Meal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oats with Mix Seeds, Andhra Lunch Thali"
                  value={mealName}
                  onChange={(e) => {
                    setMealName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className={`input-field text-base font-semibold ${!mealName.trim() && items.length > 0 ? 'border-amber-400 focus:border-amber-500' : ''}`}
                  autoFocus
                />
                {!mealName.trim() && items.length > 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    💡 Tip: Leave empty to auto-name as "{items.map(i => i.food_name).slice(0, 2).join(' + ')}"
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
              <input
                type="text"
                placeholder="e.g. 80g Oats + 20g Mix Seeds + 1 cup warm milk"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* Add Foods Section */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Add Foods to this Meal
              </label>

              <IngredientSearch onPick={handleAddFoodToMeal} />

              {/* Selected Items List */}
              {items.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{item.food_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                          {item.fiber > 0 && <span> • Fiber: {item.fiber}g</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity_display}
                          onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                          className="input-field w-20 py-1 px-2 text-sm text-center font-bold bg-white"
                        />
                        <select
                          value={item.quantity_unit}
                          onChange={(e) => handleItemUnitChange(idx, e.target.value)}
                          className="input-field py-1 px-2 text-xs font-medium bg-white w-28"
                        >
                          {UNIT_OPTIONS.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
                  <p className="font-medium text-gray-700 mb-1">No foods added to this meal yet</p>
                  <p className="text-gray-400">Search above (e.g. Oats, Mix Seeds) and click "+ Add" to include ingredients.</p>
                </div>
              )}
            </div>

            {/* Total Nutrition Summary */}
            {items.length > 0 && (
              <div className="bg-green-50/80 border border-green-200/70 p-4 rounded-xl">
                <p className="text-xs font-bold text-green-900 uppercase tracking-wider mb-2">Meal Nutrition Total</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <span className="block text-xl font-bold text-primary-dark">{totalMealNutrition.calories}</span>
                    <span className="block text-xs text-gray-600 font-medium">kcal</span>
                  </div>
                  <div>
                    <span className="block text-xl font-bold text-orange-600">{totalMealNutrition.protein}g</span>
                    <span className="block text-xs text-gray-600 font-medium">Protein</span>
                  </div>
                  <div>
                    <span className="block text-xl font-bold text-yellow-600">{totalMealNutrition.carbs}g</span>
                    <span className="block text-xs text-gray-600 font-medium">Carbs</span>
                  </div>
                  <div>
                    <span className="block text-xl font-bold text-red-500">{totalMealNutrition.fat}g</span>
                    <span className="block text-xs text-gray-600 font-medium">Fat</span>
                  </div>
                </div>
                {totalMealNutrition.fiber > 0 && (
                  <p className="text-center text-xs text-emerald-800 font-semibold mt-2 pt-2 border-t border-green-200/50">
                    Total Dietary Fiber: {totalMealNutrition.fiber}g
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            <button onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={handleSaveMeal}
              disabled={saving || items.length === 0}
              className={`btn-primary text-sm flex items-center gap-1.5 ${saving ? 'opacity-70' : ''} ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Check size={18} /> {saving ? 'Saving...' : editingMeal ? 'Update Meal' : 'Save Meal'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default MealEditorModal;
