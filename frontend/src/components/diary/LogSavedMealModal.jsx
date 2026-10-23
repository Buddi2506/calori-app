import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { getMeals } from '../../api/meals';
import { mealLabel } from '../../utils/quickAdd';

// Pick one of the user's saved meals (from the Meals page) to log in one go.
const LogSavedMealModal = ({ mealType, onLog, onClose }) => {
  const [meals, setMeals] = useState(null);
  const [loggingId, setLoggingId] = useState(null);

  useEffect(() => {
    getMeals().then(setMeals).catch(() => setMeals([]));
  }, []);

  const handleLog = async (meal) => {
    if (loggingId) return;
    setLoggingId(meal.id);
    try {
      await onLog(meal);
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <Dialog.Title className="text-sm font-bold text-gray-700">
              Log a saved meal to {mealLabel(mealType)}
            </Dialog.Title>
            <button onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <X size={20} />
            </button>
          </div>

          {meals === null ? (
            <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
          ) : meals.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <p>You have no saved meals yet.</p>
              <Link to="/meals" onClick={onClose} className="inline-block mt-3 font-bold text-amber-400 hover:text-amber-300">
                Create one on the Meals page
              </Link>
            </div>
          ) : (
            <ul className="p-2 max-h-96 overflow-y-auto">
              {meals.map((meal) => (
                <li key={meal.id}>
                  <button
                    onClick={() => handleLog(meal)}
                    disabled={loggingId !== null}
                    className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-100 disabled:opacity-60 transition-colors"
                  >
                    <span className="text-2xl" aria-hidden="true">{meal.image_emoji || '🥘'}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-gray-900 truncate">{meal.name}</span>
                      <span className="block text-xs text-gray-500">
                        {Math.round(meal.nutrition?.calories ?? 0)} kcal · {meal.items?.length || 0} foods
                      </span>
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      {loggingId === meal.id ? 'Logging…' : 'Log'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LogSavedMealModal;
