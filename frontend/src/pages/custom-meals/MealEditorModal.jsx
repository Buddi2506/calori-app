import React, { useState } from 'react';
import { Check, Trash2, AlertCircle } from 'lucide-react';
import { createMeal, updateMeal } from '../../api/meals';
import IngredientSearch from './IngredientSearch';
import Modal, { FieldLabel } from '../../components/ui/Modal';
import MacroSplitBar from '../../components/ui/MacroSplitBar';
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
        onSaved(`Saved changes to ${finalName}`);
      } else {
        await createMeal(payload);
        onSaved(`Created ${finalName}`);
      }
    } catch (err) {
      console.error('Save meal error:', err);
      setErrorMessage('Failed to save meal. Please check details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editingMeal ? 'Edit meal' : 'New meal'}
      subtitle={items.length ? `${items.length} ${items.length === 1 ? 'food' : 'foods'} · ${totalMealNutrition.calories} kcal` : 'Add the foods you eat together'}
      icon={emoji}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={handleSaveMeal}
            disabled={saving || items.length === 0}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Check size={17} /> {saving ? 'Saving…' : editingMeal ? 'Save changes' : 'Save meal'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {errorMessage && (
          <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Emoji and name */}
        <div className="flex gap-3 items-start">
          <div>
            <FieldLabel htmlFor="meal-emoji">Icon</FieldLabel>
            <select
              id="meal-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="input-field text-2xl py-1.5 px-2 text-center w-16"
            >
              {EMOJI_OPTIONS.map(em => (
                <option key={em} value={em}>{em}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <FieldLabel htmlFor="meal-name">Name</FieldLabel>
            <input
              id="meal-name"
              type="text"
              placeholder="e.g. Oats with mixed seeds"
              value={mealName}
              onChange={(e) => {
                setMealName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="input-field text-base font-semibold"
              autoFocus
            />
            {!mealName.trim() && items.length > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">
                Leave empty to name it “{items.map(i => i.food_name).slice(0, 3).join(' + ')}”
              </p>
            )}
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="meal-description">Description (optional)</FieldLabel>
          <input
            id="meal-description"
            type="text"
            placeholder="e.g. 80g oats + 20g seeds + 1 cup warm milk"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        {/* Foods in the meal */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-600">Foods</h3>
          <IngredientSearch onPick={handleAddFoodToMeal} />

          {items.length > 0 ? (
            <ul className="flex flex-col">
              {items.map((item, idx) => (
                <li
                  key={idx}
                  className="py-3 border-t border-gray-100 first:border-t-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.food_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-700">{item.calories} kcal</span>
                      <span className="text-emerald-700"> · {item.protein}g P</span>
                      <span className="text-blue-700"> · {item.carbs}g C</span>
                      <span className="text-pink-700"> · {item.fat}g F</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      aria-label={`Amount of ${item.food_name}`}
                      value={item.quantity_display}
                      onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                      className="input-field w-20 py-1.5 px-2 text-sm text-center font-bold"
                    />
                    <select
                      aria-label={`Unit for ${item.food_name}`}
                      value={item.quantity_unit}
                      onChange={(e) => handleItemUnitChange(idx, e.target.value)}
                      className="input-field py-1.5 px-2 text-xs font-medium w-28"
                    >
                      {UNIT_OPTIONS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      aria-label={`Remove ${item.food_name}`}
                      className="p-2 rounded-full text-gray-500 hover:text-rose-600 hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500">
              No foods yet. Search above and tap Add.
            </div>
          )}
        </div>

        {/* Meal totals */}
        {items.length > 0 && (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-gray-600">Meal total</span>
              <span>
                <span className="text-2xl font-black text-gray-900">{totalMealNutrition.calories}</span>
                <span className="text-xs text-gray-500"> kcal</span>
              </span>
            </div>
            <MacroSplitBar
              nutrients={{
                protein: totalMealNutrition.protein,
                carbohydrates: totalMealNutrition.carbs,
                fat: totalMealNutrition.fat,
              }}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="text-emerald-700 font-bold">{totalMealNutrition.protein}g <span className="font-normal text-gray-500">protein</span></span>
              <span className="text-blue-700 font-bold">{totalMealNutrition.carbs}g <span className="font-normal text-gray-500">carbs</span></span>
              <span className="text-pink-700 font-bold">{totalMealNutrition.fat}g <span className="font-normal text-gray-500">fat</span></span>
              {totalMealNutrition.fiber > 0 && (
                <span className="text-gray-700 font-bold">{totalMealNutrition.fiber}g <span className="font-normal text-gray-500">fiber</span></span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MealEditorModal;
