// Protein / carbs / fat colors used across the app (match the stripe-green/blue/pink bars).
export const MACRO_COLORS = { protein: '#10B981', carbohydrates: '#3B82F6', fat: '#EC4899' };

// Share of calories from each macro (4/4/9 kcal per gram), or null when there are none.
export const macroSplit = (n) => {
  const kcal = {
    protein: (n.protein || 0) * 4,
    carbohydrates: (n.carbohydrates || 0) * 4,
    fat: (n.fat || 0) * 9,
  };
  const total = kcal.protein + kcal.carbohydrates + kcal.fat;
  if (!total) return null;
  return {
    protein: kcal.protein / total,
    carbohydrates: kcal.carbohydrates / total,
    fat: kcal.fat / total,
  };
};
