// Food-type rules and portion math used when logging a food.

const LIQUID_TERMS = [
  'milk', 'water', 'juice', 'tea', 'coffee', 'oil', 'soup', 'rasam',
  'buttermilk', 'majjiga', 'shake', 'smoothie', 'drink', 'soda', 'beverage',
  'beer', 'wine', 'broth', 'lassi', 'kashayam', 'syrup', 'latte', 'chai',
  'cappuccino', 'chaas', 'curd', 'pulusu'
];

export const isLiquidFood = (food) => {
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

export const isSeedOrNut = (food) => {
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

export const isRawMeat = (food) => {
  if (!food) return false;
  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();
  return (
    name.includes('(raw)') &&
    (cat.includes('meat') || cat.includes('seafood') || cat.includes('poultry') || cat.includes('fish') ||
     name.includes('chicken') || name.includes('mutton') || name.includes('fish') || name.includes('prawn') || name.includes('egg'))
  );
};

export const isVegetable = (food) => {
  if (!food) return false;
  const cat = (food.category || '').toLowerCase();
  return cat.includes('vegetable') || cat.includes('legume') || cat.includes('pulse');
};

export const isFruit = (food) => {
  if (!food) return false;
  const cat = (food.category || '').toLowerCase();
  return cat.includes('fruit');
};

export const isCookedName = (food) => {
  const name = (food?.name || '').toLowerCase();
  return name.includes('(cooked') || name.includes('(boiled') || name.includes('(steamed');
};

// The amount and unit a food starts with when picked, e.g. 20 g of seeds or 1 glass of milk.
export const defaultPortion = (food) => {
  if (isSeedOrNut(food)) {
    return { unit: 'g', quantity: 20 };
  }
  if (isRawMeat(food)) {
    // Default chicken breast or meat portion to 150g or 200g
    return { unit: 'g', quantity: food.name.toLowerCase().includes('breast') ? 200 : 150 };
  }
  if (isFruit(food)) {
    if (food.serving_unit && food.serving_unit !== 'g') {
      return { unit: food.serving_unit, quantity: 1 };
    }
    return { unit: 'g', quantity: 100 };
  }
  if (food.serving_unit === 'scoop') {
    return { unit: 'scoop', quantity: 1 };
  }
  if (isLiquidFood(food)) {
    if (food.serving_unit === 'glass') return { unit: 'glass', quantity: 1 };
    if (food.serving_unit === 'cup') return { unit: 'cup', quantity: 1 };
    return { unit: 'ml', quantity: 100 };
  }
  if (food.serving_unit && food.serving_unit !== 'g') {
    return { unit: food.serving_unit, quantity: 1 };
  }
  return { unit: 'g', quantity: 100 };
};

// Nutrients for `quantity` of `unit` of a food whose values are stored per 100 g.
export const calculatePortionNutrition = (food, quantity, unit) => {
  if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, totalGrams: 0 };

  const calPer100 = food.calories ?? food.calories_per_100g ?? 0;
  const proPer100 = food.protein ?? food.protein_per_100g ?? 0;
  const carbPer100 = food.carbohydrates ?? food.carbohydrates_per_100g ?? 0;
  const fatPer100 = food.fat ?? food.fat_per_100g ?? 0;
  const fiberPer100 = food.fiber ?? food.fiber_per_100g ?? 0;

  const qtyNum = parseFloat(quantity) || 0;
  let totalGrams = qtyNum;

  if (unit === 'g' || unit === 'ml') {
    totalGrams = qtyNum;
  } else if (food.serving_unit === unit && food.serving_unit_weight_g) {
    totalGrams = qtyNum * food.serving_unit_weight_g;
  } else if (unit === 'scoop') {
    const scoopWeight = food.serving_unit_weight_g || 33;
    totalGrams = qtyNum * scoopWeight;
  } else if (unit === 'piece' || unit === 'fillet' || unit === 'slice' || unit === 'plate') {
    const pieceWeight = food.serving_unit_weight_g || 100;
    totalGrams = qtyNum * pieceWeight;
  } else if (unit === 'glass') {
    const glassWeight = food.serving_unit === 'glass' && food.serving_unit_weight_g ? food.serving_unit_weight_g : 200;
    totalGrams = qtyNum * glassWeight;
  } else if (unit === 'cup') {
    const cupWeight = food.serving_unit === 'cup' && food.serving_unit_weight_g ? food.serving_unit_weight_g : 150;
    totalGrams = qtyNum * cupWeight;
  } else if (unit === 'tbsp') {
    totalGrams = qtyNum * 15;
  } else if (unit === 'tsp') {
    totalGrams = qtyNum * 5;
  } else if (food.serving_unit_weight_g) {
    totalGrams = qtyNum * food.serving_unit_weight_g;
  }

  const multiplier = totalGrams / 100;

  return {
    calories: Math.round(calPer100 * multiplier),
    protein: Number((proPer100 * multiplier).toFixed(1)),
    carbs: Number((carbPer100 * multiplier).toFixed(1)),
    fat: Number((fatPer100 * multiplier).toFixed(1)),
    fiber: Number((fiberPer100 * multiplier).toFixed(1)),
    totalGrams: Math.round(totalGrams * 10) / 10,
    calcium: Number(((food.calcium || 0) * multiplier).toFixed(0)),
    sodium: Number(((food.sodium || 0) * multiplier).toFixed(0)),
    potassium: Number(((food.potassium || 0) * multiplier).toFixed(0)),
    iron: Number(((food.iron || 0) * multiplier).toFixed(1)),
    magnesium: Number(((food.magnesium || 0) * multiplier).toFixed(0)),
    zinc: Number(((food.zinc || 0) * multiplier).toFixed(1)),
  };
};
