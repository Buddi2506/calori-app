import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDailyReport, getWeeklyReport } from '../api/reports';
import { addDiaryEntry } from '../api/diary';
import { formatApiDate } from '../utils/formatters';
import { defaultMealForDay } from '../utils/quickAdd';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import QuickAdd from '../components/dashboard/QuickAdd';
import CaloriesCard from '../components/dashboard/CaloriesCard';
import MacroCard from '../components/dashboard/MacroCard';
import WeekAdherenceCard from '../components/dashboard/WeekAdherenceCard';
import NutrientChipsCard from '../components/dashboard/NutrientChipsCard';
import MealsCard from '../components/dashboard/MealsCard';

const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'];

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, showToast] = useToast();
  const [logCount, setLogCount] = useState(0); // bumps after each quick add to reload recents

  const dateStr = formatApiDate(currentDate);
  const isToday = dateStr === formatApiDate(new Date());

  const fetchReports = useCallback(async () => {
    try {
      const [dailyData, weeklyData] = await Promise.all([
        getDailyReport(dateStr),
        getWeeklyReport(formatApiDate(subDays(currentDate, 6))).catch(() => null),
      ]);
      setReport(dailyData);
      setWeeklyReport(weeklyData);
    } catch (err) {
      console.error('Failed to fetch dashboard reports:', err);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [fetchReports]);

  const totals = report?.totals || {};
  const goals = report?.goals || { calories: 2000, protein: 140, carbohydrates: 250, fat: 70, fiber: 30 };
  const byMeal = report?.entries || { breakfast: [], lunch: [], dinner: [], snack: [] };

  const mealCalories = Object.fromEntries(
    MEALS.map((m) => [m, Math.round((byMeal[m] || []).reduce((sum, e) => sum + (e.calories || 0), 0))])
  );
  const loggedMeals = MEALS.filter((m) => (byMeal[m] || []).length > 0);
  const openMeals = MEALS.filter((m) => !loggedMeals.includes(m));

  const defaultMeal = defaultMealForDay(isToday, byMeal);

  const subtitle = loggedMeals.length === 0
    ? 'Nothing logged yet'
    : openMeals.length === 0
    ? `All ${MEALS.length} meals logged`
    : `${loggedMeals.length} ${loggedMeals.length === 1 ? 'meal' : 'meals'} logged · ${openMeals.join(', ')} still open`;

  const handleQuickAdd = async ({ food, quantity, unit, mealType }) => {
    try {
      await addDiaryEntry({
        date: dateStr,
        meal_type: mealType,
        food_id: food.id,
        quantity_display: quantity,
        quantity_unit: unit,
      });
      showToast(`Added ${quantity} ${unit} ${food.name} to ${mealType}`);
      setLogCount((c) => c + 1);
      fetchReports();
    } catch (err) {
      console.error('Quick add failed:', err);
      alert('Could not add that food. Please try again.');
      throw err;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Toast message={toast} />

      {/* Day header and navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-black tracking-tight text-gray-900">
            {format(currentDate, 'EEEE, d MMM')}
          </h1>
          <span className="text-sm text-gray-600">{loading && !report ? 'Loading…' : subtitle}</span>
        </div>
        <div role="group" aria-label="Change day" className="flex gap-1.5">
          <button
            onClick={() => setCurrentDate((d) => subDays(d, 1))}
            aria-label="Previous day"
            className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 hover:border-gray-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            disabled={isToday}
            className="h-11 px-4 rounded-full bg-white border border-gray-100 text-[13px] font-bold text-gray-700 hover:text-gray-900 disabled:text-gray-500 disabled:cursor-default transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate((d) => addDays(d, 1))}
            disabled={isToday}
            aria-label="Next day"
            className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <QuickAdd defaultMeal={defaultMeal} onAdd={handleQuickAdd} refreshKey={logCount} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CaloriesCard
          eaten={Math.round(totals.calories || 0)}
          goal={Math.round(goals.calories || 2000)}
          mealCalories={mealCalories}
          isToday={isToday}
        />
        <MacroCard label="Protein" current={totals.protein || 0} goal={goals.protein || 140} stripe="stripe-green" />
        <MacroCard label="Carbs" current={totals.carbohydrates || 0} goal={goals.carbohydrates || 250} stripe="stripe-blue" />
        <MacroCard label="Fat" current={totals.fat || 0} goal={goals.fat || 70} stripe="stripe-pink" />
        <MacroCard label="Fiber" current={totals.fiber || 0} goal={goals.fiber || 30} stripe="stripe-amber" />
        <WeekAdherenceCard
          days={weeklyReport?.days || []}
          goal={goals.calories || 2000}
          selectedDate={dateStr}
        />
        <MealsCard byMeal={byMeal} mealCalories={mealCalories} diaryPath={`/diary/${dateStr}`} />
        <NutrientChipsCard totals={totals} goals={goals} />
      </div>
    </div>
  );
};

export default Dashboard;
