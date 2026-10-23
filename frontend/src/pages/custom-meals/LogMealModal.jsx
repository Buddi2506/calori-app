import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { logMeal } from '../../api/meals';
import { formatApiDate } from '../../utils/formatters';
import { mealForTime, mealLabel } from '../../utils/quickAdd';
import Modal, { FieldLabel } from '../../components/ui/Modal';
import MealPicker from '../../components/ui/MealPicker';

// Log every food of a saved meal to one diary day and meal period.
const LogMealModal = ({ meal, onClose, onLogged }) => {
  const [logDate, setLogDate] = useState(formatApiDate(new Date()));
  const [logMealType, setLogMealType] = useState(mealForTime());
  const [logging, setLogging] = useState(false);

  const handleConfirmLog = async () => {
    setLogging(true);
    try {
      await logMeal(meal.id, logDate, logMealType);
      onLogged(`Logged ${meal.name} to ${logMealType}`);
    } catch (err) {
      console.error('Log meal error:', err);
      alert('Failed to log meal. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <Modal
      title={meal.name}
      subtitle={`${Math.round(meal.nutrition?.calories ?? 0)} kcal · ${meal.items?.length || 0} foods`}
      icon={meal.image_emoji || '🥘'}
      size="sm"
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <div>
          <FieldLabel>Meal</FieldLabel>
          <MealPicker value={logMealType} onChange={setLogMealType} />
        </div>
        <div>
          <FieldLabel htmlFor="log-meal-date">Date</FieldLabel>
          <input
            id="log-meal-date"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>
        <button
          onClick={handleConfirmLog}
          disabled={logging}
          className="w-full btn-primary h-12 flex items-center justify-center gap-2"
        >
          <Check size={18} />
          {logging ? 'Logging…' : `Log to ${mealLabel(logMealType)}`}
        </button>
      </div>
    </Modal>
  );
};

export default LogMealModal;
