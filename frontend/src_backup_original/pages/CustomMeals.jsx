import React, { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import { getMeals, createMeal, updateMeal, deleteMeal, logMeal } from '../api/meals';
import { searchFoods } from '../api/foods';
import { formatApiDate } from '../utils/formatters';
import { Dialog } from '@headlessui/react';
import { Plus, X, Search, Check, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const EMOJI_OPTIONS = ['🍛', '🥞', '🍚', '🍲', '🍳', '🥗', '🥪', '🥘', '🥣', '🌯', '🌱', '💪'];

const UNIT_OPTIONS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'scoop', label: 'Scoop' },
  { value: 'piece', label: 'Piece' },
  { value: 'glass', label: 'Glass (~200ml)' },
  { value: 'cup', label: 'Cup (~240g/ml)' },
  { value: 'tbsp', label: 'Tablespoon (~15g)' },
  { value: 'tsp', label: 'Teaspoon (~5g)' },
  { value: 'ml', label: 'Milliliters (ml)' },
];

const resolveItemWeight = (unit, qty, servingWeight = 100) => {
  const q = parseFloat(qty) || 0;
  switch (unit) {
    case 'g':
    case 'ml':
      return q;
    case 'scoop':
      return q * (servingWeight || 33);
    case 'piece':
      return q * (servingWeight || 60);
    case 'glass':
      return q * (servingWeight === 200 ? 200 : servingWeight || 200);
    case 'cup':
      return q * (servingWeight === 240 ? 240 : servingWeight || 240);
    case 'tbsp':
      return q * 15;
    case 'tsp':
      return q * 5;
    default:
      return q * (servingWeight || 1);
  }
};

const CustomMeals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State (Used for both Create and Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null); // null when creating, meal object when editing
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🍛');
  const [items, setItems] = useState([]); // [{ food_id, food_name, calories, protein, carbs, fat, fiber, quantity_display, quantity_unit, unit_weight, base_cal, base_pro, base_carb, base_fat, base_fiber }]
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Food Search inside Modal
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Log Meal Modal State
  const [logOpen, setLogOpen] = useState(false);
  const [selectedMealToLog, setSelectedMealToLog] = useState(null);
  const [logDate, setLogDate] = useState(formatApiDate(new Date()));
  const [logMealType, setLogMealType] = useState('lunch');
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, []);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim().length > 0) {
      setSearching(true);
      searchFoods(debouncedSearch.trim())
        .then(data => setSearchResults(Array.isArray(data) ? data : (data.items || [])))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchMeals = async () => {
    try {
      const data = await getMeals();
      setMeals(data);
    } catch (err) {
      console.error('Error fetching custom meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMeal(null);
    setMealName('');
    setDescription('');
    setEmoji('🍛');
    setItems([]);
    setErrorMessage('');
    setSearchQuery('');
    setSearchResults([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (meal) => {
    setEditingMeal(meal);
    setMealName(meal.name || '');
    setDescription(meal.description || '');
    setEmoji(meal.image_emoji || '🍛');
    setErrorMessage('');
    setSearchQuery('');
    setSearchResults([]);

    const loadedItems = (meal.items || []).map(it => {
      const unitWeight = it.serving_unit_weight_g || (it.quantity_g && it.quantity_display ? it.quantity_g / it.quantity_display : 100);
      const totalGrams = it.quantity_g || resolveItemWeight(it.quantity_unit, it.quantity_display, unitWeight);
      const mult = totalGrams / 100;

      const baseCal = it.base_cal ?? (it.calories ? Math.round(it.calories / mult) : 0);
      const basePro = it.base_pro ?? (it.protein ? Number((it.protein / mult).toFixed(1)) : 0);
      const baseCarb = it.base_carb ?? (it.carbohydrates ? Number((it.carbohydrates / mult).toFixed(1)) : 0);
      const baseFat = it.base_fat ?? (it.fat ? Number((it.fat / mult).toFixed(1)) : 0);
      const baseFiber = it.base_fiber ?? 0;

      return {
        food_id: it.food_id,
        food_name: it.food_name,
        quantity_display: it.quantity_display,
        quantity_unit: it.quantity_unit || 'g',
        unit_weight: unitWeight,
        base_cal: baseCal,
        base_pro: basePro,
        base_carb: baseCarb,
        base_fat: baseFat,
        base_fiber: baseFiber,
        calories: it.calories ?? Math.round(baseCal * mult),
        protein: it.protein ?? Number((basePro * mult).toFixed(1)),
        carbs: it.carbohydrates ?? Number((baseCarb * mult).toFixed(1)),
        fat: it.fat ?? Number((baseFat * mult).toFixed(1)),
        fiber: Number((baseFiber * mult).toFixed(1)),
      };
    });

    setItems(loadedItems);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom meal?')) {
      try {
        await deleteMeal(id);
        showToast('Meal deleted successfully.');
        fetchMeals();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete meal.');
      }
    }
  };

  const handleOpenLog = (meal) => {
    setSelectedMealToLog(meal);
    setLogDate(formatApiDate(new Date()));
    setLogMealType('lunch');
    setLogOpen(true);
  };

  const handleConfirmLog = async () => {
    if (!selectedMealToLog) return;
    setLogging(true);
    try {
      await logMeal(selectedMealToLog.id, logDate, logMealType);
      showToast(`Logged "${selectedMealToLog.name}" to ${logMealType} for ${logDate}! 🎉`);
      setLogOpen(false);
    } catch (err) {
      console.error('Log meal error:', err);
      alert('Failed to log meal. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  const handleAddFoodToMeal = (food) => {
    const isSeed = (food.name || '').toLowerCase().includes('seed') || (food.category || '').toLowerCase().includes('seed');
    const isScoop = food.serving_unit === 'scoop';
    const isLiquid = food.serving_unit === 'ml' || food.serving_unit === 'glass' || (food.category || '').toLowerCase().includes('beverage');

    let unit = 'g';
    let qty = 100;

    if (isSeed) {
      unit = 'g';
      qty = 20; // 20g default for seeds
    } else if (isScoop) {
      unit = 'scoop';
      qty = 1;
    } else if (isLiquid) {
      unit = food.serving_unit === 'glass' ? 'glass' : 'ml';
      qty = unit === 'glass' ? 1 : 100;
    } else if (food.serving_unit && food.serving_unit !== 'g') {
      unit = food.serving_unit;
      qty = 1;
    }

    const unitWeight = food.serving_unit_weight_g || 100;
    const totalGrams = resolveItemWeight(unit, qty, unitWeight);
    const multiplier = totalGrams / 100;

    const baseCal = food.calories || 0;
    const basePro = food.protein || 0;
    const baseCarb = food.carbohydrates || 0;
    const baseFat = food.fat || 0;
    const baseFiber = food.fiber || 0;

    const newItem = {
      food_id: food.id,
      food_name: food.name,
      quantity_display: qty,
      quantity_unit: unit,
      unit_weight: unitWeight,
      base_cal: baseCal,
      base_pro: basePro,
      base_carb: baseCarb,
      base_fat: baseFat,
      base_fiber: baseFiber,
      calories: Math.round(baseCal * multiplier),
      protein: Number((basePro * multiplier).toFixed(1)),
      carbs: Number((baseCarb * multiplier).toFixed(1)),
      fat: Number((baseFat * multiplier).toFixed(1)),
      fiber: Number((baseFiber * multiplier).toFixed(1)),
    };

    setItems(prev => {
      const next = [...prev, newItem];
      // Auto-suggest name if empty
      if (!mealName.trim()) {
        const suggested = next.map(i => i.food_name).slice(0, 2).join(' & ');
        setMealName(suggested);
      }
      return next;
    });

    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage('');
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemQtyChange = (index, newQty) => {
    const qtyNum = parseFloat(newQty);
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const validQty = isNaN(qtyNum) ? 0 : qtyNum;
      const totalGrams = resolveItemWeight(item.quantity_unit, validQty, item.unit_weight);
      const multiplier = totalGrams / 100;

      return {
        ...item,
        quantity_display: newQty,
        calories: Math.round(item.base_cal * multiplier),
        protein: Number((item.base_pro * multiplier).toFixed(1)),
        carbs: Number((item.base_carb * multiplier).toFixed(1)),
        fat: Number((item.base_fat * multiplier).toFixed(1)),
        fiber: Number((item.base_fiber * multiplier).toFixed(1)),
      };
    }));
  };

  const handleItemUnitChange = (index, newUnit) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const qtyNum = parseFloat(item.quantity_display) || 1;
      const totalGrams = resolveItemWeight(newUnit, qtyNum, item.unit_weight);
      const multiplier = totalGrams / 100;

      return {
        ...item,
        quantity_unit: newUnit,
        calories: Math.round(item.base_cal * multiplier),
        protein: Number((item.base_pro * multiplier).toFixed(1)),
        carbs: Number((item.base_carb * multiplier).toFixed(1)),
        fat: Number((item.base_fat * multiplier).toFixed(1)),
        fiber: Number((item.base_fiber * multiplier).toFixed(1)),
      };
    }));
  };

  const totalMealNutrition = items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      protein: Number((acc.protein + (it.protein || 0)).toFixed(1)),
      carbs: Number((acc.carbs + (it.carbs || 0)).toFixed(1)),
      fat: Number((acc.fat + (it.fat || 0)).toFixed(1)),
      fiber: Number((acc.fiber + (it.fiber || 0)).toFixed(1)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

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
        showToast(`Updated "${finalName}" successfully! ✨`);
      } else {
        await createMeal(payload);
        showToast(`Created "${finalName}" successfully! 🎉`);
      }

      setModalOpen(false);
      fetchMeals();
    } catch (err) {
      console.error('Save meal error:', err);
      setErrorMessage('Failed to save meal. Please check details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm animate-fade-in border border-gray-700">
          <Check size={18} className="text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🥘 Custom Meals</h2>
          <p className="text-gray-500 text-sm mt-1">
            Create and edit reusable meals with multiple foods. Log them to any diary day in 1 click!
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create New Meal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 text-sm mt-3">Loading custom meals...</p>
        </div>
      ) : meals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onLog={() => handleOpenLog(meal)}
              onEdit={() => handleOpenEdit(meal)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 p-8">
          <span className="text-5xl mb-4 block">🍛</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No custom meals yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Create meals for combinations you eat often, like "2 Idlies + Sambar + Chutney" or "Oats + Mix Seeds".
            Then log everything with just one click!
          </p>
          <button onClick={handleOpenCreate} className="btn-primary">
            + Create Your First Meal
          </button>
        </div>
      )}

      {/* ─── CREATE & EDIT MEAL MODAL ─────────────────────────────────────────── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[740px]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>{editingMeal ? '✏️ Edit Custom Meal' : '✨ Create Custom Meal'}</span>
              </Dialog.Title>
              <button
                onClick={() => setModalOpen(false)}
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

                {/* Search input */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="input-field pl-9 text-sm"
                    placeholder="Search foods to add (e.g. Oats, Mix Seeds, Milk, Dosa)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Search Results Dropdown */}
                {searching ? (
                  <div className="p-3 text-center text-xs text-gray-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-md mb-3">
                    {searchResults.map(food => (
                      <div
                        key={food.id}
                        onClick={() => handleAddFoodToMeal(food)}
                        className="p-2.5 hover:bg-green-50/70 cursor-pointer flex justify-between items-center text-sm transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-gray-900">{food.name}</span>
                          {food.name_local && <span className="text-xs text-orange-600 ml-2 font-medium">{food.name_local}</span>}
                          <span className="text-xs text-gray-400 ml-2">({Math.round(food.calories || 0)} kcal/100g)</span>
                        </div>
                        <span className="text-xs font-semibold text-primary px-2.5 py-1 bg-green-50 rounded-md">
                          + Add
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

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
              <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">
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

      {/* ─── LOG MEAL MODAL ────────────────────────────────────────────────── */}
      <Dialog open={logOpen} onClose={() => setLogOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-primary" /> Log to Diary
              </Dialog.Title>
              <button onClick={() => setLogOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {selectedMealToLog && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-3xl">{selectedMealToLog.image_emoji || '🥘'}</span>
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedMealToLog.name}</h4>
                    <p className="text-xs text-gray-500">
                      {Math.round(selectedMealToLog.nutrition?.calories ?? 0)} kcal • {selectedMealToLog.items?.length} items
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Meal Period</label>
                  <select
                    value={logMealType}
                    onChange={(e) => setLogMealType(e.target.value)}
                    className="input-field text-sm font-medium"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleConfirmLog}
                    disabled={logging}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Check size={18} />
                    {logging ? 'Logging...' : `Log to ${logMealType.charAt(0).toUpperCase() + logMealType.slice(1)}`}
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default CustomMeals;
