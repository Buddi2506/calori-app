// Display helpers for library foods (`per_100g` / `per_serving` nutrient blocks from /foods/library).

export { MACRO_COLORS, macroSplit } from '../../utils/macros';

// Nutrients for the chosen portion mode, falling back to per 100 g.
export const nutrientsFor = (item, portionMode) =>
  (portionMode === 'serving' ? item.per_serving : item.per_100g) || item.per_100g || {};

export const portionLabel = (item, portionMode) =>
  portionMode === 'serving'
    ? `per 1 ${item.serving_unit}${item.serving_unit !== 'g' && item.serving_unit !== 'ml' ? ` (${item.serving_unit_weight_g}g)` : ''}`
    : `per ${item.base_unit}`;

// Grams of protein per 100 kcal; the same for any portion size.
export const proteinDensity = (item) => {
  const n = item.per_100g || {};
  return n.calories ? ((n.protein || 0) / n.calories) * 100 : 0;
};

export const foodTags = (item) => {
  const name = (item.name || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  const tags = [];
  if (name.includes('(raw)')) tags.push('Raw');
  if (['(cooked', '(boiled', '(steamed'].some((w) => name.includes(w))) tags.push('Cooked');
  if (category.includes('fruit')) tags.push('Fruit');
  if (category.includes('seed')) tags.push('Seeds & nuts');
  if (item.serving_unit === 'scoop') tags.push('Scoop');
  return tags;
};

// `key` sorts a flat list across all categories; 'category' keeps the grouped view.
export const SORTS = [
  { id: 'category', label: 'By category' },
  { id: 'protein', label: 'Most protein', value: (item, mode) => -(nutrientsFor(item, mode).protein || 0) },
  { id: 'density', label: 'Protein per 100 kcal', value: (item) => -proteinDensity(item) },
  // Zero-calorie items (salt, water) go last so the top of the list is actual low-calorie food
  { id: 'low-cal', label: 'Lowest calories', value: (item, mode) => nutrientsFor(item, mode).calories || 1e9 },
  { id: 'fiber', label: 'Most fiber', value: (item, mode) => -(nutrientsFor(item, mode).fiber || 0) },
  { id: 'name', label: 'Name A–Z' },
];

export const shortCategoryTitle = (title) => title.split('(')[0].trim();
