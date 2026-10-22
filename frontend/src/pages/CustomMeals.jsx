import React, { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import { getMeals, deleteMeal } from '../api/meals';
import { Plus, Check } from 'lucide-react';
import MealEditorModal from './custom-meals/MealEditorModal';
import LogMealModal from './custom-meals/LogMealModal';

const CustomMeals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // { meal: null } to create, { meal } to edit, null when the editor is closed
  const [editor, setEditor] = useState(null);
  const [mealToLog, setMealToLog] = useState(null);

  useEffect(() => {
    fetchMeals();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchMeals = async () => {
    try {
      const data = await getMeals();
      setMeals(data);
    } catch (err) {
      console.error('Error fetching custom meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => setEditor({ meal: null });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom meal?')) {
      try {
        await deleteMeal(id);
        showToast('Meal deleted successfully.');
        fetchMeals();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete meal.');
      }
    }
  };

  const handleSaved = (message) => {
    showToast(message);
    setEditor(null);
    fetchMeals();
  };

  const handleLogged = (message) => {
    showToast(message);
    setMealToLog(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm animate-fade-in border border-gray-700">
          <Check size={18} className="text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🥘 Custom Meals</h2>
          <p className="text-gray-500 text-sm mt-1">
            Create and edit reusable meals with multiple foods. Log them to any diary day in 1 click!
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create New Meal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 text-sm mt-3">Loading custom meals...</p>
        </div>
      ) : meals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onLog={() => setMealToLog(meal)}
              onEdit={() => setEditor({ meal })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 p-8">
          <span className="text-5xl mb-4 block">🍛</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No custom meals yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Create meals for combinations you eat often, like "2 Idlies + Sambar + Chutney" or "Oats + Mix Seeds".
            Then log everything with just one click!
          </p>
          <button onClick={handleOpenCreate} className="btn-primary">
            + Create Your First Meal
          </button>
        </div>
      )}

      {editor && (
        <MealEditorModal meal={editor.meal} onClose={() => setEditor(null)} onSaved={handleSaved} />
      )}

      {mealToLog && (
        <LogMealModal meal={mealToLog} onClose={() => setMealToLog(null)} onLogged={handleLogged} />
      )}
    </div>
  );
};

export default CustomMeals;
