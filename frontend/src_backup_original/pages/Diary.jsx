import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Utensils, X, Check } from 'lucide-react';
import DiaryMealSection from '../components/DiaryMealSection';
import FoodSearchModal from '../components/FoodSearchModal';
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

  const totalCalories = diaryData?.totals?.calories || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft /></button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">Food Diary</h2>
          <p className="text-sm text-gray-500">{format(currentDate, 'EEEE, d MMM yyyy')}</p>
        </div>
        <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700">
          <ChevronRight />
        </button>
      </div>

      <div className="bg-primary text-white p-6 rounded-xl shadow-sm flex justify-between items-center">
        <div>
          <p className="text-green-100 text-sm font-medium">Total Calories</p>
          <p className="text-3xl font-bold">{Math.round(totalCalories)} <span className="text-lg font-normal opacity-80">kcal</span></p>
        </div>
        <div className="text-right">
          <div className="flex gap-4 text-sm font-medium text-green-50">
            <div><p>Protein</p><p className="text-lg text-white">{Math.round(diaryData?.totals?.protein || 0)}g</p></div>
            <div><p>Carbs</p><p className="text-lg text-white">{Math.round(diaryData?.totals?.carbohydrates || 0)}g</p></div>
            <div><p>Fat</p><p className="text-lg text-white">{Math.round(diaryData?.totals?.fat || 0)}g</p></div>
          </div>
        </div>
      </div>

      {loading && !diaryData ? (
        <div className="text-center py-12 text-gray-500">Loading diary...</div>
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
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Utensils size={20} className="text-primary" />
                Log Custom Meal to {selectedMealTypeForLog.charAt(0).toUpperCase() + selectedMealTypeForLog.slice(1)}
              </Dialog.Title>
              <button onClick={() => setCustomMealsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {customMeals.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {customMeals.map(meal => (
                  <div
                    key={meal.id}
                    onClick={() => !loggingCustomMeal && handleQuickLogCustomMeal(meal.id)}
                    className="p-3.5 bg-gray-50 hover:bg-green-50/80 rounded-xl border border-gray-100 hover:border-green-300 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meal.image_emoji || '🥘'}</span>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{meal.name}</p>
                        <p className="text-xs text-gray-500">
                          {Math.round(meal.nutrition?.calories ?? 0)} kcal • {meal.items?.length || 0} foods
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white group-hover:bg-primary group-hover:text-white text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-xs flex items-center gap-1">
                      <Check size={14} /> Log
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
                  className="mt-3 text-primary font-semibold text-xs underline"
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
