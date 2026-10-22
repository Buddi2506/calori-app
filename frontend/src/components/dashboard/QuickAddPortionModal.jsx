import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import PortionEditor from '../food-search/PortionEditor';
import { MEAL_TYPES, mealLabel } from '../../utils/quickAdd';

// Confirm amount and meal for a food picked in quick add, then add it.
const QuickAddPortionModal = ({ food, initialPortion, initialMeal, onAdd, onClose }) => {
  const [quantity, setQuantity] = useState(initialPortion.quantity);
  const [unit, setUnit] = useState(initialPortion.unit);
  const [mealType, setMealType] = useState(initialMeal);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onAdd({ food, quantity: parseFloat(quantity) || 1, unit, mealType });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <Dialog.Title className="text-sm font-bold text-gray-700">Quick add</Dialog.Title>
            <div role="group" aria-label="Meal" className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-full">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMealType(m)}
                  aria-pressed={mealType === m}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    mealType === m ? 'pill-active' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mealLabel(m)}
                </button>
              ))}
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <PortionEditor
              food={food}
              quantity={quantity}
              setQuantity={setQuantity}
              unit={unit}
              setUnit={setUnit}
              mealLabel={mealLabel(mealType)}
              onAdd={handleAdd}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default QuickAddPortionModal;
