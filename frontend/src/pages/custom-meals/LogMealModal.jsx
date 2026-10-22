import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Check, X, Calendar } from 'lucide-react';
import { logMeal } from '../../api/meals';
import { formatApiDate } from '../../utils/formatters';

// Log every food of a custom meal to one diary day and meal period.
const LogMealModal = ({ meal: selectedMealToLog, onClose, onLogged }) => {
  const [logDate, setLogDate] = useState(formatApiDate(new Date()));
  const [logMealType, setLogMealType] = useState('lunch');
  const [logging, setLogging] = useState(false);

  const handleConfirmLog = async () => {
    if (!selectedMealToLog) return;
    setLogging(true);
    try {
      await logMeal(selectedMealToLog.id, logDate, logMealType);
      onLogged(`Logged "${selectedMealToLog.name}" to ${logMealType} for ${logDate}! 🎉`);
    } catch (err) {
      console.error('Log meal error:', err);
      alert('Failed to log meal. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Log to Diary
            </Dialog.Title>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-3xl">{selectedMealToLog.image_emoji || '🥘'}</span>
              <div>
                <h4 className="font-bold text-gray-900">{selectedMealToLog.name}</h4>
                <p className="text-xs text-gray-500">
                  {Math.round(selectedMealToLog.nutrition?.calories ?? 0)} kcal • {selectedMealToLog.items?.length} items
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Meal Period</label>
              <select
                value={logMealType}
                onChange={(e) => setLogMealType(e.target.value)}
                className="input-field text-sm font-medium"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={handleConfirmLog}
                disabled={logging}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-semibold"
              >
                <Check size={18} />
                {logging ? 'Logging...' : `Log to ${logMealType.charAt(0).toUpperCase() + logMealType.slice(1)}`}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LogMealModal;
