import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuickAdd from '../components/dashboard/QuickAdd';
import FoodSearchModal from '../components/FoodSearchModal';
import Toast from '../components/Toast';
import DaySummaryCard from '../components/diary/DaySummaryCard';
import MealSection from '../components/diary/MealSection';
import EditEntryModal from '../components/diary/EditEntryModal';
import LogSavedMealModal from '../components/diary/LogSavedMealModal';
import { useDiary } from '../hooks/useDiary';
import { useToast } from '../hooks/useToast';
import { formatApiDate } from '../utils/formatters';
import { MEAL_TYPES, defaultMealForDay, formatPortion } from '../utils/quickAdd';
import { getGoals } from '../api/goals';
import { logMeal } from '../api/meals';

const DEFAULT_GOALS = { calories: 2000, protein: 140, carbohydrates: 250, fat: 70, fiber: 30 };

const Diary = () => {
  const { date } = useParams();
  const navigate = useNavigate();

  // Use parseISO for date strings from URL to avoid UTC timezone offset issues
  const currentDate = date ? parseISO(date) : new Date();
  const dateStr = formatApiDate(currentDate);
  const isToday = dateStr === formatApiDate(new Date());

  const { diaryData, loading, addEntry, updateEntry, deleteEntry, refreshDiary } = useDiary(dateStr);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [searchMeal, setSearchMeal] = useState(null); // meal the Add food search is open for
  const [savedMealFor, setSavedMealFor] = useState(null); // meal the saved-meal picker is open for
  const [editing, setEditing] = useState(null); // entry whose portion is being changed
  const [toast, showToast] = useToast();
  const [logCount, setLogCount] = useState(0); // bumps after each log to reload quick-add recents

  useEffect(() => {
    getGoals().then((g) => setGoals({ ...DEFAULT_GOALS, ...g })).catch(() => {});
  }, []);

  const goToDay = (day) => navigate(`/diary/${formatApiDate(day)}`);

  const byMeal = Object.fromEntries(MEAL_TYPES.map((m) => [m, diaryData?.entries?.[m] || []]));
  const totals = diaryData?.totals || {};
  const mealCalories = Object.fromEntries(
    MEAL_TYPES.map((m) => [m, Math.round(byMeal[m].reduce((sum, e) => sum + (e.calories || 0), 0))])
  );
  const itemCount = MEAL_TYPES.reduce((n, m) => n + byMeal[m].length, 0);
  const defaultMeal = defaultMealForDay(isToday, byMeal);

  const logged = (message) => {
    showToast(message);
    setLogCount((c) => c + 1);
  };

  const handleQuickAdd = async ({ food, quantity, unit, mealType }) => {
    const ok = await addEntry({
      date: dateStr,
      meal_type: mealType,
      food_id: food.id,
      quantity_display: quantity,
      quantity_unit: unit,
    });
    if (!ok) {
      alert('Could not add that food. Please try again.');
      throw new Error('Quick add failed');
    }
    logged(`Added ${formatPortion(quantity, unit)} ${food.name} to ${mealType}`);
  };

  const handleSearchAdd = async (data) => {
    if (await addEntry({ ...data, date: dateStr })) logged(`Added to ${data.meal_type || searchMeal}`);
  };

  const handleLogSavedMeal = async (meal) => {
    try {
      await logMeal(meal.id, dateStr, savedMealFor);
      await refreshDiary();
      logged(`Logged ${meal.name} to ${savedMealFor}`);
      setSavedMealFor(null);
    } catch (err) {
      console.error('Failed to log saved meal:', err);
      alert('Failed to log meal. Please try again.');
    }
  };

  const handleSaveEdit = async (entry, portion) => {
    if (await updateEntry(entry.id, portion)) {
      showToast(`Changed ${entry.food?.name} to ${formatPortion(portion.quantity_display, portion.quantity_unit)}`);
      setEditing(null);
    } else {
      alert('Could not save that change. Please try again.');
    }
  };

  const handleDelete = async (entry) => {
    if (await deleteEntry(entry.id)) {
      showToast(`Removed ${entry.food?.name || 'entry'} from ${entry.meal_type}`);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Toast message={toast} />

      {/* Day header and navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Diary</span>
          <h1 className="font-display italic text-[32px] leading-tight font-bold text-gray-900">
            {format(currentDate, 'EEEE, d MMM')}
          </h1>
          <span className="text-sm text-gray-600">
            {loading && !diaryData
              ? 'Loading…'
              : itemCount === 0
              ? 'Nothing logged yet'
              : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${Math.round(totals.calories || 0).toLocaleString()} kcal`}
          </span>
        </div>
        <div role="group" aria-label="Change day" className="flex gap-1.5">
          <button
            onClick={() => goToDay(subDays(currentDate, 1))}
            aria-label="Previous day"
            className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 hover:border-gray-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goToDay(new Date())}
            disabled={isToday}
            className="h-11 px-4 rounded-full bg-white border border-gray-100 text-[13px] font-bold text-gray-700 hover:text-gray-900 disabled:text-gray-500 disabled:cursor-default transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => goToDay(addDays(currentDate, 1))}
            aria-label="Next day"
            className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 hover:border-gray-200 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <QuickAdd defaultMeal={defaultMeal} onAdd={handleQuickAdd} refreshKey={logCount} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* Summary comes first on phones, and sits in a sticky column beside the meals on wide screens */}
        <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
          <DaySummaryCard totals={totals} goals={goals} mealCalories={mealCalories} />
        </aside>

        <div className="lg:col-start-1 lg:row-start-1 flex flex-col gap-4">
          {loading && !diaryData ? (
            <div className="zentra-card p-10 text-center text-sm text-gray-500">Loading your diary…</div>
          ) : (
            MEAL_TYPES.map((meal) => (
              <MealSection
                key={meal}
                meal={meal}
                entries={byMeal[meal]}
                onAddFood={setSearchMeal}
                onLogMeal={setSavedMealFor}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      <FoodSearchModal
        isOpen={searchMeal !== null}
        onClose={() => setSearchMeal(null)}
        onAdd={handleSearchAdd}
        mealType={searchMeal || defaultMeal}
      />

      {savedMealFor && (
        <LogSavedMealModal mealType={savedMealFor} onLog={handleLogSavedMeal} onClose={() => setSavedMealFor(null)} />
      )}

      {editing && (
        <EditEntryModal key={editing.id} entry={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
};

export default Diary;
