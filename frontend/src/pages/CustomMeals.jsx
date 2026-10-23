import React, { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getMeals, deleteMeal } from '../api/meals';
import { Plus } from 'lucide-react';
import MealEditorModal from './custom-meals/MealEditorModal';
import LogMealModal from './custom-meals/LogMealModal';

const CustomMeals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, showToast] = useToast();

  // { meal: null } to create, { meal } to edit, null when the editor is closed
  const [editor, setEditor] = useState(null);
  const [mealToLog, setMealToLog] = useState(null);

  useEffect(() => {
    fetchMeals();
  }, []);

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
        showToast('Meal deleted.');
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
    <div className="flex flex-col gap-5">
      <Toast message={toastMessage} />

      <PageHeader
        eyebrow="Meals"
        title="Saved meals"
        subtitle={loading ? 'Loading…' : meals.length
          ? `${meals.length} ${meals.length === 1 ? 'meal' : 'meals'} · log a whole combo in one tap`
          : 'Save foods you eat together and log them in one tap'}
      >
        <button onClick={handleOpenCreate} className="btn-primary h-11 flex items-center gap-2">
          <Plus size={18} /> New meal
        </button>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Loading meals">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="zentra-card !rounded-3xl h-[230px] animate-pulse" />
          ))}
        </div>
      ) : meals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        <div className="zentra-card p-10 text-center flex flex-col items-center gap-3">
          <span className="text-5xl" aria-hidden="true">🍛</span>
          <h2 className="text-lg font-bold text-gray-900">No saved meals yet</h2>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            Save combinations you eat often, like “2 idli + sambar + chutney” or “oats + mixed seeds”,
            then log the whole meal in one tap.
          </p>
          <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Create your first meal
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
