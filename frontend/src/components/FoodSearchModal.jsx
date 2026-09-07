import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, Check, ArrowLeft, Plus } from 'lucide-react';
import { searchFoods } from '../api/foods';
import { useDebounce } from '../hooks/useDebounce';

const LIQUID_TERMS = [
  'milk', 'water', 'juice', 'tea', 'coffee', 'oil', 'soup', 'rasam',
  'buttermilk', 'majjiga', 'shake', 'smoothie', 'drink', 'soda', 'beverage',
  'beer', 'wine', 'broth', 'lassi', 'kashayam', 'syrup', 'latte', 'chai',
  'cappuccino', 'chaas', 'curd', 'pulusu'
];

const isLiquidFood = (food) => {
  if (!food) return false;
  const unit = (food.serving_unit || '').toLowerCase();
  if (unit === 'ml' || unit === 'glass' || unit === 'l' || unit === 'bottle') {
    return true;
  }
  const category = (food.category || '').toLowerCase();
  if (category === 'beverage' || category === 'drinks') {
    return true;
  }
  const text = `${food.name || ''} ${food.category || ''}`.toLowerCase();
  return LIQUID_TERMS.some(term => new RegExp(`\\b${term}\\b`, 'i').test(text));
};

const isSeedOrNut = (food) => {
  if (!food) return false;
  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();
  return (
    name.includes('seed') ||
    cat.includes('seeds') ||
    name.includes('chia') ||
    name.includes('flax') ||
    name.includes('flex') ||
    name.includes('pumpkin') ||
    name.includes('sunflower') ||
    name.includes('melon')
  );
};

const isRawMeat = (food) => {
  if (!food) return false;
  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();
  return (
    name.includes('(raw)') &&
    (cat.includes('meat') || cat.includes('seafood') || cat.includes('poultry') || cat.includes('fish') ||
     name.includes('chicken') || name.includes('mutton') || name.includes('fish') || name.includes('prawn') || name.includes('egg'))
  );
};

const isVegetable = (food) => {
  if (!food) return false;
  const cat = (food.category || '').toLowerCase();
  return cat.includes('vegetable') || cat.includes('legume') || cat.includes('pulse');
};

const isFruit = (food) => {
  if (!food) return false;
  const cat = (food.category || '').toLowerCase();
  return cat.includes('fruit');
};

const FoodSearchModal = ({ isOpen, onClose, onAdd, mealType }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery.trim());
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const performSearch = async (q) => {
    setLoading(true);
    try {
      const data = await searchFoods(q);
      const items = Array.isArray(data) ? data : (data.items || []);
      setResults(items);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    const isLiquid = isLiquidFood(food);
    const isScoop = food.serving_unit === 'scoop';
    const isSeed = isSeedOrNut(food);
    const isMeat = isRawMeat(food);
    const isFruitFood = isFruit(food);

    if (isSeed) {
      setUnit('g');
      setQuantity(20);
    } else if (isMeat) {
      setUnit('g');
      // Default chicken breast or meat portion to 150g or 200g
      setQuantity(food.name.toLowerCase().includes('breast') ? 200 : 150);
    } else if (isFruitFood) {
      if (food.serving_unit && food.serving_unit !== 'g') {
        setUnit(food.serving_unit);
        setQuantity(1);
      } else {
        setUnit('g');
        setQuantity(100);
      }
    } else if (isScoop) {
      setUnit('scoop');
      setQuantity(1);
    } else if (isLiquid) {
      if (food.serving_unit === 'glass') {
        setUnit('glass');
        setQuantity(1);
      } else if (food.serving_unit === 'cup') {
        setUnit('cup');
        setQuantity(1);
      } else {
        setUnit('ml');
        setQuantity(100);
      }
    } else if (food.serving_unit && food.serving_unit !== 'g') {
      setUnit(food.serving_unit);
      setQuantity(1);
    } else {
      setUnit('g');
      setQuantity(100);
    }
  };

  const handleBack = () => {
    setSelectedFood(null);
  };

  const calculateNutrition = () => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, totalGrams: 0 };

    const calPer100 = selectedFood.calories ?? selectedFood.calories_per_100g ?? 0;
    const proPer100 = selectedFood.protein ?? selectedFood.protein_per_100g ?? 0;
    const carbPer100 = selectedFood.carbohydrates ?? selectedFood.carbohydrates_per_100g ?? 0;
    const fatPer100 = selectedFood.fat ?? selectedFood.fat_per_100g ?? 0;
    const fiberPer100 = selectedFood.fiber ?? selectedFood.fiber_per_100g ?? 0;

    const qtyNum = parseFloat(quantity) || 0;
    let totalGrams = qtyNum;

    if (unit === 'g' || unit === 'ml') {
      totalGrams = qtyNum;
    } else if (selectedFood.serving_unit === unit && selectedFood.serving_unit_weight_g) {
      totalGrams = qtyNum * selectedFood.serving_unit_weight_g;
    } else if (unit === 'scoop') {
      const scoopWeight = selectedFood.serving_unit_weight_g || 33;
      totalGrams = qtyNum * scoopWeight;
    } else if (unit === 'piece' || unit === 'fillet' || unit === 'slice' || unit === 'plate') {
      const pieceWeight = selectedFood.serving_unit_weight_g || 100;
      totalGrams = qtyNum * pieceWeight;
    } else if (unit === 'glass') {
      const glassWeight = selectedFood.serving_unit === 'glass' && selectedFood.serving_unit_weight_g ? selectedFood.serving_unit_weight_g : 200;
      totalGrams = qtyNum * glassWeight;
    } else if (unit === 'cup') {
      const cupWeight = selectedFood.serving_unit === 'cup' && selectedFood.serving_unit_weight_g ? selectedFood.serving_unit_weight_g : 150;
      totalGrams = qtyNum * cupWeight;
    } else if (unit === 'tbsp') {
      totalGrams = qtyNum * 15;
    } else if (unit === 'tsp') {
      totalGrams = qtyNum * 5;
    } else if (selectedFood.serving_unit_weight_g) {
      totalGrams = qtyNum * selectedFood.serving_unit_weight_g;
    }

    const multiplier = totalGrams / 100;

    return {
      calories: Math.round(calPer100 * multiplier),
      protein: Number((proPer100 * multiplier).toFixed(1)),
      carbs: Number((carbPer100 * multiplier).toFixed(1)),
      fat: Number((fatPer100 * multiplier).toFixed(1)),
      fiber: Number((fiberPer100 * multiplier).toFixed(1)),
      totalGrams: Math.round(totalGrams * 10) / 10,
      calcium: Number(((selectedFood.calcium || 0) * multiplier).toFixed(0)),
      sodium: Number(((selectedFood.sodium || 0) * multiplier).toFixed(0)),
      potassium: Number(((selectedFood.potassium || 0) * multiplier).toFixed(0)),
      iron: Number(((selectedFood.iron || 0) * multiplier).toFixed(1)),
      magnesium: Number(((selectedFood.magnesium || 0) * multiplier).toFixed(0)),
      zinc: Number(((selectedFood.zinc || 0) * multiplier).toFixed(1)),
    };
  };

  const handleAdd = () => {
    if (!selectedFood) return;

    onAdd({
      food_id: selectedFood.id,
      quantity_display: parseFloat(quantity) || 1,
      quantity_unit: unit,
      meal_type: mealType || 'breakfast',
    });

    // Reset and close
    setSelectedFood(null);
    setQuery('');
    setResults([]);
    onClose();
  };

  const nutrition = calculateNutrition();
  const isLiquid = isLiquidFood(selectedFood);
  const isScoop = selectedFood?.serving_unit === 'scoop';
  const isSeed = isSeedOrNut(selectedFood);
  const isMeat = isRawMeat(selectedFood);
  const isVeg = isVegetable(selectedFood);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[640px] border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {selectedFood ? (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium text-gray-700"
              >
                <ArrowLeft size={18} /> Back to Search
              </button>
            ) : (
              <Dialog.Title className="text-lg font-bold text-gray-900">
                Add to {mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : 'Diary'}
              </Dialog.Title>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedFood ? (
              <div className="p-5 flex flex-col h-full">
                {/* Search input */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm"
                    placeholder="Search chicken, breast, mutton, fish, carrot, seeds..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                      <p className="text-sm text-gray-700 font-medium">Searching foods & supplements...</p>
                      <p className="text-xs text-gray-400 mt-1">Checking local database + nutrition registry 🌐</p>
                    </div>
                  ) : results.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {results.map((food) => {
                        const calories = Math.round(food.calories ?? food.calories_per_100g ?? 0);
                        const protein = Number((food.protein ?? food.protein_per_100g ?? 0).toFixed(1));
                        const liquid = isLiquidFood(food);
                        const foodIsScoop = food.serving_unit === 'scoop';
                        const foodIsSeed = isSeedOrNut(food);
                        const foodIsMeat = isRawMeat(food);
                        const foodIsVeg = isVegetable(food);
                        const foodIsFruit = isFruit(food);
                        const foodNameLower = (food.name || '').toLowerCase();
                        const foodIsCooked = foodNameLower.includes('(cooked') || foodNameLower.includes('(boiled') || foodNameLower.includes('(steamed') || foodNameLower.includes('(curry') || foodNameLower.includes('(roasted');
                        const foodIsRawGrain = foodNameLower.includes('(raw)') && ((food.category || '').toLowerCase().includes('rice') || (food.category || '').toLowerCase().includes('grain'));
                        const baseUnit = liquid ? '100ml' : '100g';
                        const servingUnit = food.serving_unit && food.serving_unit !== 'g' && food.serving_unit !== 'ml' ? food.serving_unit : null;
                        const unitWeight = food.serving_unit_weight_g || food.piece_weight_g;
                        const scoopCal = foodIsScoop && unitWeight ? Math.round((calories * unitWeight) / 100) : null;
                        const scoopProtein = foodIsScoop && unitWeight ? Number(((food.protein || 0) * unitWeight / 100).toFixed(1)) : null;

                        return (
                          <li
                            key={food.id}
                            className="py-3 px-3 hover:bg-green-50/60 cursor-pointer rounded-xl transition-colors flex justify-between items-center group"
                            onClick={() => handleSelectFood(food)}
                          >
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900">{food.name}</p>
                                {foodIsFruit && (
                                  <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    🍎 Fruit
                                  </span>
                                )}
                                {foodIsMeat && (
                                  <span className="text-[10px] text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    🥩 Raw Meat
                                  </span>
                                )}
                                {foodIsRawGrain && (
                                  <span className="text-[10px] text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    🌾 Raw Grain
                                  </span>
                                )}
                                {foodIsCooked && (
                                  <span className="text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    🍲 Cooked
                                  </span>
                                )}
                                {foodIsSeed && (
                                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Seeds & Nuts
                                  </span>
                                )}
                                {foodIsScoop && (
                                  <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Whey Protein
                                  </span>
                                )}
                                {foodIsVeg && !foodIsSeed && !foodIsFruit && !foodIsCooked && (
                                  <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                                    Veg
                                  </span>
                                )}
                                {liquid && (
                                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                    Liquid
                                  </span>
                                )}
                              </div>
                              {food.name_local && (
                                <p className="text-xs text-orange-600 font-medium mt-0.5">
                                  {food.name_local}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {foodIsScoop ? (
                                  <span className="font-semibold text-green-700">
                                    1 scoop ({unitWeight}g) = {scoopCal} kcal • {scoopProtein}g Protein
                                  </span>
                                ) : foodIsMeat ? (
                                  <span className="font-semibold text-rose-700">
                                    {calories} kcal • {protein}g Protein per 100g (Raw weight)
                                  </span>
                                ) : foodIsSeed ? (
                                  <span className="font-medium text-emerald-700">
                                    {calories} kcal / 100g • Weighed in grams (e.g. 5g, 10g, 20g, 33g)
                                  </span>
                                ) : (
                                  <>
                                    <span className="font-medium text-gray-700">{calories} kcal</span> / {baseUnit}
                                    {protein > 0 && <span> • {protein}g Protein</span>}
                                    {servingUnit && unitWeight && (
                                      <span> • ~{Math.round((calories * unitWeight) / 100)} kcal / {servingUnit} ({unitWeight}{liquid ? 'ml' : 'g'})</span>
                                    )}
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                              <Plus size={18} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : query.trim().length > 0 && !loading ? (
                    <div className="text-center p-10 text-gray-500">
                      <p className="text-base font-medium text-gray-700 mb-1">No items found matching "{query}"</p>
                      <p className="text-xs text-gray-400">Try searching: chicken, breast, boneless, mutton, fish, carrot, seeds...</p>
                    </div>
                  ) : (
                    <div className="text-center p-10 text-gray-400 text-sm">
                      <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="font-medium text-gray-600">Search for meats, vegetables, seeds, or supplements</p>
                      <p className="text-xs text-gray-400 mt-1">Raw meats, chicken cuts, fish, veggies, and whey powders</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
                      : selectedFood.name.toLowerCase().includes('(cooked') || selectedFood.name.toLowerCase().includes('(boiled') || selectedFood.name.toLowerCase().includes('(steamed')
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
                      : selectedFood.name.toLowerCase().includes('(cooked') || selectedFood.name.toLowerCase().includes('(boiled') || selectedFood.name.toLowerCase().includes('(steamed')
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
                  onClick={handleAdd}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-base font-semibold shadow-md shadow-green-600/20"
                >
                  <Check size={20} /> Add {quantity}{unit === 'g' || unit === 'ml' ? unit : ` ${unit}`} to {mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : 'Diary'}
                </button>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default FoodSearchModal;
