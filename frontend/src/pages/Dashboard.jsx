import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, ExternalLink, Sparkles, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IsometricMealChart from '../components/IsometricMealChart';
import CandyStripeProgressBar from '../components/CandyStripeProgressBar';
import DotMatrixChart from '../components/DotMatrixChart';
import SteppedAdherenceChart from '../components/SteppedAdherenceChart';
import NutrientInsightCard from '../components/NutrientInsightCard';
import { getDailyReport, getWeeklyReport } from '../api/reports';
import { formatApiDate } from '../utils/formatters';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllMicros, setShowAllMicros] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const dateStr = formatApiDate(currentDate);
        const weekStartStr = formatApiDate(subDays(currentDate, 6));
        const [dailyData, weeklyData] = await Promise.all([
          getDailyReport(dateStr),
          getWeeklyReport(weekStartStr).catch(() => null)
        ]);
        setReport(dailyData);
        setWeeklyReport(weeklyData);
      } catch (err) {
        console.error('Failed to fetch dashboard reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentDate]);

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const isToday = formatApiDate(currentDate) === formatApiDate(new Date());

  const data = report?.totals || {};
  const goals = report?.goals || { calories: 2000, protein: 140, carbohydrates: 250, fat: 70, fiber: 30 };
  const byMeal = report?.entries || report?.by_meal || { breakfast: [], lunch: [], dinner: [], snack: [] };

  const totalCalories = Math.round(data.calories || 0);
  const goalCalories = Math.round(goals.calories || 2000);
  const remainingCalories = Math.max(0, goalCalories - totalCalories);
  const caloriePct = Math.min(100, Math.round((totalCalories / (goalCalories || 1)) * 100));

  const allMicros = [
    { label: 'Iron (Fe)', key: 'iron', unit: 'mg', goal: goals.iron || 18, color: 'green' },
    { label: 'Calcium (Ca)', key: 'calcium', unit: 'mg', goal: goals.calcium || 1000, color: 'blue' },
    { label: 'Potassium (K)', key: 'potassium', unit: 'mg', goal: goals.potassium || 3500, color: 'blue' },
    { label: 'Zinc (Zn)', key: 'zinc', unit: 'mg', goal: goals.zinc || 11, color: 'green' },
    { label: 'Vitamin C', key: 'vitamin_c', unit: 'mg', goal: goals.vitamin_c || 90, color: 'amber' },
    { label: 'Vitamin D', key: 'vitamin_d', unit: 'mcg', goal: goals.vitamin_d || 20, color: 'amber' },
    { label: 'Vitamin B12', key: 'vitamin_b12', unit: 'mcg', goal: goals.vitamin_b12 || 2.4, color: 'pink' },
    { label: 'Magnesium', key: 'magnesium', unit: 'mg', goal: goals.magnesium || 420, color: 'green' },
    { label: 'Sodium (Na)', key: 'sodium', unit: 'mg', goal: goals.sodium || 2300, color: 'pink' },
    { label: 'Saturated Fat', key: 'saturated_fat', unit: 'g', goal: goals.saturated_fat || 20, color: 'amber' },
  ];

  return (
    <div className="space-y-6">

      {/* Header & Date Selector matching Zentra Overview bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Overview</h1>
          <button 
            onClick={() => navigate('/diary')}
            className="w-7 h-7 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm transition-colors"
            title="Open Diary"
          >
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Date Controls & Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white px-2 py-1 rounded-full border border-gray-200/80 shadow-sm">
            <button 
              onClick={handlePrevDay} 
              className="p-1 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-gray-800 px-2.5">
              📅 {isToday ? 'Today, ' : ''}{format(currentDate, 'MMM d, yyyy')}
            </span>
            <button 
              onClick={handleNextDay} 
              disabled={isToday}
              className={`p-1 rounded-full transition-colors ${isToday ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => navigate('/diary')}
            className="flex items-center gap-1.5 bg-[#18181B] hover:bg-black text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus size={14} /> Log Food
          </button>
        </div>
      </div>

      {/* Main Top Grid (Isometric Meal Funnel + Total Intake) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: 3D Isometric Stepped Meal Chart (8 cols) */}
        <div className="lg:col-span-8">
          <IsometricMealChart 
            mealsData={byMeal} 
            onMealClick={() => navigate(`/diary/${formatApiDate(currentDate)}`)}
          />
        </div>

        {/* Right: Macro Volume & Candy-Stripe Progress Meters (4 cols) */}
        <div className="lg:col-span-4 zentra-card p-6 md:p-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-extrabold text-gray-900">Total Intake</h2>
              <span className="text-xs text-gray-400 font-medium">Daily Target</span>
            </div>

            {/* Big Bold Calorie Display */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black tracking-tight text-gray-900">
                {totalCalories.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-gray-400">kcal</span>
              <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                ▲ {caloriePct}% Goal
              </span>
            </div>

            {/* Diagonal Hatched Candy-Stripe Macro Bars */}
            <div className="space-y-4">
              <CandyStripeProgressBar
                label="Protein"
                current={data.protein || 0}
                goal={goals.protein || 140}
                unit="g"
                color="green"
              />
              <CandyStripeProgressBar
                label="Carbohydrates"
                current={data.carbohydrates || 0}
                goal={goals.carbohydrates || 250}
                unit="g"
                color="blue"
              />
              <CandyStripeProgressBar
                label="Healthy Fats"
                current={data.fat || 0}
                goal={goals.fat || 70}
                unit="g"
                color="pink"
              />
              <CandyStripeProgressBar
                label="Dietary Fiber"
                current={data.fiber || 0}
                goal={goals.fiber || 30}
                unit="g"
                color="amber"
              />
            </div>
          </div>

          {/* Quick Summary Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500 font-medium">
            <span>Remaining: <b className="text-gray-900">{remainingCalories} kcal</b></span>
            <span>Status: <b className={caloriePct > 100 ? 'text-amber-600' : 'text-emerald-600'}>
              {caloriePct > 100 ? 'Slightly Over' : 'On Track'}
            </b></span>
          </div>
        </div>

      </div>

      {/* Bottom Row: Stepped Adherence + Dot-Matrix Micros + Gradient Insight Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Bottom 1: Stepped Line Chart (4 cols) */}
        <div className="md:col-span-4">
          <SteppedAdherenceChart weeklyData={weeklyReport} calorieGoal={goalCalories} fallbackScore={caloriePct} />
        </div>

        {/* Bottom 2: Dot Matrix Micro Chart (4 cols) */}
        <div className="md:col-span-4">
          <DotMatrixChart nutrients={data} goals={goals} />
        </div>

        {/* Bottom 3: Gradient Grain Insight Card (4 cols) */}
        <div className="md:col-span-4">
          <NutrientInsightCard 
            caloriesEaten={totalCalories}
            calorieGoal={goalCalories}
            proteinEaten={data.protein || 0}
            proteinGoal={goals.protein || 140}
          />
        </div>

      </div>

      {/* Collapsible Complete Micronutrient Bio-Meter */}
      <div className="zentra-card p-6">
        <button 
          onClick={() => setShowAllMicros(!showAllMicros)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-gray-900">Complete Micronutrient Spectrum</h3>
              <p className="text-xs text-gray-400">ICMR-NIN & USDA nutritional adherence profile</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 group-hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
            {showAllMicros ? 'Collapse' : 'Expand All (10)'}
            <ChevronDown size={14} className={`transform transition-transform ${showAllMicros ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {showAllMicros && (
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allMicros.map(m => (
              <CandyStripeProgressBar
                key={m.key}
                label={m.label}
                current={data[m.key] || 0}
                goal={m.goal}
                unit={m.unit}
                color={m.color}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
