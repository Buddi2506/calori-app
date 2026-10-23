import React from 'react';
import Segmented from './Segmented';
import { MEAL_TYPES, mealLabel } from '../../utils/quickAdd';

const OPTIONS = MEAL_TYPES.map((m) => ({ id: m, label: mealLabel(m) }));

// Breakfast / Lunch / Snack / Dinner pill toggle.
const MealPicker = ({ value, onChange }) => (
  <Segmented label="Meal" options={OPTIONS} value={value} onChange={onChange} />
);

export default MealPicker;
