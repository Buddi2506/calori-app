// Ingredient rows in the custom meal editor and their nutrition math.
// Each row keeps per-100g base values (base_cal, base_pro...) and the scaled totals for its amount.

export const EMOJI_OPTIONS = ['🍛', '🥞', '🍚', '🍲', '🍳', '🥗', '🥪', '🥘', '🥣', '🌯', '🌱', '💪'];

export const UNIT_OPTIONS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'scoop', label: 'Scoop' },
  { value: 'piece', label: 'Piece' },
  { value: 'glass', label: 'Glass (~200ml)' },
  { value: 'cup', label: 'Cup (~240g/ml)' },
  { value: 'tbsp', label: 'Tablespoon (~15g)' },
  { value: 'tsp', label: 'Teaspoon (~5g)' },
  { value: 'ml', label: 'Milliliters (ml)' },
];

export const resolveItemWeight = (unit, qty, servingWeight = 100) => {
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

// Scaled nutrition for a row's base values at `totalGrams`.
const scaledNutrition = (item, totalGrams) => {
  const multiplier = totalGrams / 100;
  return {
    calories: Math.round(item.base_cal * multiplier),
    protein: Number((item.base_pro * multiplier).toFixed(1)),
    carbs: Number((item.base_carb * multiplier).toFixed(1)),
    fat: Number((item.base_fat * multiplier).toFixed(1)),
    fiber: Number((item.base_fiber * multiplier).toFixed(1)),
  };
};

// A row loaded from a saved meal (as returned by the API).
export const itemFromSaved = (it) => {
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
};

// A new row for a food picked from search, with a sensible starting amount.
export const itemFromFood = (food) => {
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
  const item = {
    food_id: food.id,
    food_name: food.name,
    quantity_display: qty,
    quantity_unit: unit,
    unit_weight: unitWeight,
    base_cal: food.calories || 0,
    base_pro: food.protein || 0,
    base_carb: food.carbohydrates || 0,
    base_fat: food.fat || 0,
    base_fiber: food.fiber || 0,
  };
  return { ...item, ...scaledNutrition(item, resolveItemWeight(unit, qty, unitWeight)) };
};

// The row with a new typed quantity (kept as typed; an invalid number counts as 0).
export const withQuantity = (item, newQty) => {
  const qtyNum = parseFloat(newQty);
  const validQty = isNaN(qtyNum) ? 0 : qtyNum;
  return {
    ...item,
    quantity_display: newQty,
    ...scaledNutrition(item, resolveItemWeight(item.quantity_unit, validQty, item.unit_weight)),
  };
};

// The row with a new unit (an empty quantity counts as 1).
export const withUnit = (item, newUnit) => {
  const qtyNum = parseFloat(item.quantity_display) || 1;
  return {
    ...item,
    quantity_unit: newUnit,
    ...scaledNutrition(item, resolveItemWeight(newUnit, qtyNum, item.unit_weight)),
  };
};

export const mealTotals = (items) => items.reduce(
  (acc, it) => ({
    calories: acc.calories + (it.calories || 0),
    protein: Number((acc.protein + (it.protein || 0)).toFixed(1)),
    carbs: Number((acc.carbs + (it.carbs || 0)).toFixed(1)),
    fat: Number((acc.fat + (it.fat || 0)).toFixed(1)),
    fiber: Number((acc.fiber + (it.fiber || 0)).toFixed(1)),
  }),
  { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
);
