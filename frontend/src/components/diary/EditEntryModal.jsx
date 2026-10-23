import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import PortionEditor from '../food-search/PortionEditor';
import { getFoodById } from '../../api/foods';
import { formatPortion, mealLabel } from '../../utils/quickAdd';

// Change the amount of a logged food. The diary entry only carries a short food summary,
// so the full food is loaded to preview nutrients.
const EditEntryModal = ({ entry, onSave, onClose }) => {
  const [food, setFood] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [quantity, setQuantity] = useState(entry.quantity_display);
  const [unit, setUnit] = useState(entry.quantity_unit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFoodById(entry.food_id).then(setFood).catch(() => setLoadError(true));
  }, [entry.food_id]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(entry, { quantity_display: parseFloat(quantity) || 1, quantity_unit: unit });
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
            <Dialog.Title className="text-sm font-bold text-gray-700">
              Edit portion · {mealLabel(entry.meal_type)}
            </Dialog.Title>
            <button onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {food ? (
              <PortionEditor
                food={food}
                quantity={quantity}
                setQuantity={setQuantity}
                unit={unit}
                setUnit={setUnit}
                mealLabel={mealLabel(entry.meal_type)}
                onAdd={handleSave}
                submitLabel={`Save ${formatPortion(quantity, unit)}`}
              />
            ) : (
              <p className="p-8 text-center text-sm text-gray-500">
                {loadError ? 'Could not load this food. Close and try again.' : 'Loading…'}
              </p>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditEntryModal;
