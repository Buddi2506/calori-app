import React from 'react';
import { Plus } from 'lucide-react';
import { isLiquidFood, isSeedOrNut, isRawMeat, isVegetable, isFruit } from '../../utils/foodPortions';

// Short tags for a search result: what kind of food it is.
const resultTags = (food) => {
  const name = (food.name || '').toLowerCase();
  const category = (food.category || '').toLowerCase();
  const cooked = ['(cooked', '(boiled', '(steamed', '(curry', '(roasted'].some((w) => name.includes(w));
  const tags = [];
  if (isFruit(food)) tags.push('Fruit');
  if (isRawMeat(food)) tags.push('Raw meat');
  if (name.includes('(raw)') && (category.includes('rice') || category.includes('grain'))) tags.push('Raw grain');
  if (cooked) tags.push('Cooked');
  if (isSeedOrNut(food)) tags.push('Seeds & nuts');
  if (food.serving_unit === 'scoop') tags.push('Whey');
  if (isVegetable(food) && !isSeedOrNut(food) && !isFruit(food) && !cooked) tags.push('Veg');
  if (isLiquidFood(food)) tags.push('Liquid');
  return tags;
};

// One food in the search results, with kcal per 100 g and per serving.
const FoodResultItem = ({ food, onSelect }) => {
  const calories = Math.round(food.calories ?? food.calories_per_100g ?? 0);
  const protein = Number((food.protein ?? food.protein_per_100g ?? 0).toFixed(1));
  const liquid = isLiquidFood(food);
  const baseUnit = liquid ? '100ml' : '100g';
  const servingUnit = food.serving_unit && food.serving_unit !== 'g' && food.serving_unit !== 'ml' ? food.serving_unit : null;
  const unitWeight = food.serving_unit_weight_g || food.piece_weight_g;

  return (
    <li>
      <button
        onClick={() => onSelect(food)}
        className="w-full text-left py-3 px-3 hover:bg-gray-100 rounded-2xl transition-colors flex items-center gap-3 group"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-gray-900">{food.name}</span>
          {food.name_local && <span className="block text-xs text-orange-600 mt-0.5">{food.name_local}</span>}
          <span className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-gray-500">
            <span><span className="font-bold text-gray-700">{calories} kcal</span> / {baseUnit}</span>
            {protein > 0 && <span className="text-emerald-700">· {protein}g protein</span>}
            {servingUnit && unitWeight && (
              <span>· ~{Math.round((calories * unitWeight) / 100)} kcal / {servingUnit} ({unitWeight}{liquid ? 'ml' : 'g'})</span>
            )}
            {resultTags(food).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold">{t}</span>
            ))}
          </span>
        </span>
        <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-amber-400 group-hover:border-amber-400 group-hover:text-[#0B0C10] transition-colors shrink-0">
          <Plus size={16} />
        </span>
      </button>
    </li>
  );
};

export default FoodResultItem;
