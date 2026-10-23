import { defaultPortion } from './foodPortions';

const UNIT_ALIASES = {
  g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g',
  ml: 'ml',
  cup: 'cup', cups: 'cup',
  glass: 'glass', glasses: 'glass',
  tbsp: 'tbsp', tsp: 'tsp',
  scoop: 'scoop', scoops: 'scoop',
  piece: 'piece', pieces: 'piece', pc: 'piece', pcs: 'piece',
};

// "2 chapati" -> { quantity: 2, unit: null, term: 'chapati' }
// "150g rice" / "1 cup curd" -> quantity, unit and the search term; plain text -> { term }
export const parseQuickAddQuery = (text) => {
  const raw = (text || '').trim();
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?\s+(.+)$/i);
  if (!match) return { quantity: null, unit: null, term: raw };

  const quantity = parseFloat(match[1]);
  const maybeUnit = (match[2] || '').toLowerCase();
  if (maybeUnit && UNIT_ALIASES[maybeUnit]) {
    return { quantity, unit: UNIT_ALIASES[maybeUnit], term: match[3].trim() };
  }
  // The word after the number wasn't a unit, so it's part of the food name ("2 masala dosa")
  return { quantity, unit: null, term: `${maybeUnit} ${match[3]}`.trim() };
};

// Starting amount when a food is picked from quick add, honouring a typed amount if any.
export const quickAddPortion = (food, parsed) => {
  const base = defaultPortion(food);
  if (!parsed?.quantity) return base;
  if (parsed.unit) return { unit: parsed.unit, quantity: parsed.quantity };
  // "2 dosa" means 2 servings; a bare number only means grams when it's clearly a weight
  if (base.unit !== 'g' && base.unit !== 'ml') return { unit: base.unit, quantity: parsed.quantity };
  return parsed.quantity >= 10 ? { unit: base.unit, quantity: parsed.quantity } : base;
};

export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

// The meal people are most likely logging at this time of day.
export const mealForTime = (now = new Date()) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 11 * 60) return 'breakfast';
  if (minutes < 16 * 60) return 'lunch';
  if (minutes < 18 * 60 + 30) return 'snack';
  return 'dinner';
};

// Today: the meal for the current time. Other days: the first meal with nothing logged.
export const defaultMealForDay = (isToday, byMeal = {}) =>
  isToday ? mealForTime() : (MEAL_TYPES.find((m) => !(byMeal[m] || []).length) || 'snack');

// "150 g", "2 piece", "1.5 cup"
export const formatPortion = (quantity, unit) =>
  `${Number(quantity)}${unit === 'g' || unit === 'ml' ? '' : ' '}${unit}`;

export const mealLabel = (mealType) => mealType.charAt(0).toUpperCase() + mealType.slice(1);
