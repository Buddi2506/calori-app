import React from 'react';
import { Plus } from 'lucide-react';
import { isLiquidFood, isSeedOrNut, isRawMeat, isVegetable, isFruit } from '../../utils/foodPortions';

// One food in the search results, with type badges and a per-100g / per-serving summary.
const FoodResultItem = ({ food, onSelect }) => {
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
      className="py-3 px-3 hover:bg-green-50/60 cursor-pointer rounded-xl transition-colors flex justify-between items-center group"
      onClick={() => onSelect(food)}
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
};

export default FoodResultItem;
