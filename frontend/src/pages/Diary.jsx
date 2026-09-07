import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Utensils, X, Check, Sparkles } from 'lucide-react';
import DiaryMealSection from '../components/DiaryMealSection';
import FoodSearchModal from '../components/FoodSearchModal';
import CandyStripeProgressBar from '../components/CandyStripeProgressBar';
import { useDiary } from '../hooks/useDiary';
import { formatApiDate } from '../utils/formatters';
import { getMeals, logMeal } from '../api/meals';
import { Dialog } from '@headlessui/react';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

const Diary = () => {
  const { date } = useParams();
  const navigate = useNavigate();

  // Use parseISO for date strings from URL to avoid UTC timezone offset issues
  const currentDate = date ? parseISO(date) : new Date();
  const dateStr = formatApiDate(currentDate);

  const { diaryData, loading, addEntry, deleteEntry, refreshDiary } = useDiary(dateStr);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState('breakfast');

  // Custom Meals Quick Log Modal
  const [customMealsModalOpen, setCustomMealsModalOpen] = useState(false);
  const [customMeals, setCustomMeals] = useState([]);
  const [loggingCustomMeal, setLoggingCustomMeal] = useState(false);
  const [selectedMealTypeForLog, setSelectedMealTypeForLog] = useState('lunch');

  const handlePrevDay = () => navigate(`/diary/${formatApiDate(subDays(currentDate, 1))}`);
  const handleNextDay = () => navigate(`/diary/${formatApiDate(addDays(currentDate, 1))}`);

  const handleAddFood = (mealType) => {
    setActiveMealType(mealType);
    setModalOpen(true);
  };

  const handleOpenCustomMealsLog = async (mealType) => {
    setSelectedMealTypeForLog(mealType);
    setCustomMealsModalOpen(true);
    try {
      const data = await getMeals();
      setCustomMeals(data);
    } catch (err) {
      console.error('Failed to load meals:', err);
    }
  };

  const handleQuickLogCustomMeal = async (mealId) => {
    setLoggingCustomMeal(true);
    try {
      await logMeal(mealId, dateStr, selectedMealTypeForLog);
      await refreshDiary();
      setCustomMealsModalOpen(false);
    } catch (err) {
      console.error('Failed to log custom meal:', err);
      alert('Failed to log meal. Please try again.');
    } finally {
      setLoggingCustomMeal(false);
    }
  };

  const handleSaveFood = async (data) => {
    await addEntry({ ...data, date: dateStr });
  };

  const entriesByMeal = MEALS.reduce((acc, meal) => {
    acc[meal] = diaryData?.entries?.[meal] || [];
    return acc;
  }, {});

  const totalCalories = Math.round(diaryData?.totals?.calories || 0);
  const totalProtein = Math.round(diaryData?.totals?.protein || 0);
  const totalCarbs = Math.round(diaryData?.totals?.carbohydrates || 0);
  const totalFat = Math.round(diaryData?.totals?.fat || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Date Navigation matching Zentra Overview */}
      <div className="flex items-center justify-between zentra-card p-4 px-6">
        <button 
          onClick={handlePrevDay} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
          title="Previous Day"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Daily Log</span>
          <h2 className="text-lg font-black text-gray-900">
            {format(currentDate, 'EEEE, d MMMM yyyy')}
          </h2>
        </div>
        <button 
          onClick={handleNextDay} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
          title="Next Day"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Daily Totals Zentra Card */}
      <div className="zentra-card p-6 md:p-7">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Energy Consumed</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-4xl font-black tracking-tight text-gray-900">{totalCalories.toLocaleString()}</span>
              <span className="text-sm font-bold text-gray-400">kcal total</span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            ● Active Daily Summary
          </span>
        </div>

        {/* Candy-Stripe Macro Progress Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CandyStripeProgressBar
            label="Protein"
            current={totalProtein}
            goal={140}
            unit="g"
            color="green"
          />
          <CandyStripeProgressBar
            label="Carbohydrates"
            current={totalCarbs}
            goal={250}
            unit="g"
            color="blue"
          />
          <CandyStripeProgressBar
            label="Healthy Fats"
            current={totalFat}
            goal={70}
            unit="g"
            color="pink"
          />
        </div>
      </div>

      {/* Meal Sections */}
      {loading && !diaryData ? (
        <div className="text-center py-16 text-gray-400 font-medium">Loading food diary...</div>
      ) : (
        <div className="space-y-6">
          {MEALS.map(meal => (
            <DiaryMealSection
              key={meal}
              title={meal.charAt(0).toUpperCase() + meal.slice(1)}
              entries={entriesByMeal[meal]}
              onAddFood={() => handleAddFood(meal)}
              onLogMeal={() => handleOpenCustomMealsLog(meal)}
              onEditEntry={(entry) => console.log('Edit', entry)}
              onDeleteEntry={deleteEntry}
            />
          ))}
        </div>
      )}

      {/* Food Search Modal */}
      <FoodSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleSaveFood}
        mealType={activeMealType}
      />

      {/* Quick Log Custom Meal Modal */}
      <Dialog open={customMealsModalOpen} onClose={() => setCustomMealsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-[28px] shadow-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <Dialog.Title className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Utensils size={18} className="text-amber-600" />
                Log Custom Meal to {selectedMealTypeForLog.charAt(0).toUpperCase() + selectedMealTypeForLog.slice(1)}
              </Dialog.Title>
              <button onClick={() => setCustomMealsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X size={18} />
              </button>
            </div>

            {customMeals.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {customMeals.map(meal => (
                  <div
                    key={meal.id}
                    onClick={() => !loggingCustomMeal && handleQuickLogCustomMeal(meal.id)}
                    className="p-3.5 bg-gray-50 hover:bg-amber-50/70 rounded-2xl border border-gray-100 hover:border-amber-300 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meal.image_emoji || '🥘'}</span>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-amber-800 transition-colors text-sm">{meal.name}</p>
                        <p className="text-xs text-gray-500">
                          {Math.round(meal.nutrition?.calories ?? 0)} kcal • {meal.items?.length || 0} foods
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white group-hover:bg-[#18181B] group-hover:text-white text-gray-700 rounded-full border border-gray-200 transition-colors shadow-sm flex items-center gap-1">
                      <Check size={13} /> Log
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>No custom meals found.</p>
                <button
                  onClick={() => {
                    setCustomMealsModalOpen(false);
                    navigate('/meals');
                  }}
                  className="mt-3 text-amber-600 font-semibold text-xs underline"
                >
                  Create custom meals in the Custom Meals tab ➔
                </button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Diary;
