import React, { useState } from 'react';
import { Sparkles, MoreHorizontal } from 'lucide-react';

/**
 * 3D Isometric Stepped Meal Chart
 * Displays Breakfast, Lunch, Dinner, and Snacks as 3D isometric stepped blocks with diagonal hatched patterns.
 */
const IsometricMealChart = ({ mealsData = {}, onMealClick }) => {
  const bList = mealsData?.breakfast || [];
  const lList = mealsData?.lunch || [];
  const dList = mealsData?.dinner || [];
  const sList = mealsData?.snack || mealsData?.snacks || [];

  const breakfastCal = Math.round(bList.reduce((s, e) => s + (parseFloat(e.calories) || 0), 0));
  const lunchCal = Math.round(lList.reduce((s, e) => s + (parseFloat(e.calories) || 0), 0));
  const dinnerCal = Math.round(dList.reduce((s, e) => s + (parseFloat(e.calories) || 0), 0));
  const snackCal = Math.round(sList.reduce((s, e) => s + (parseFloat(e.calories) || 0), 0));

  const [activeMeal, setActiveMeal] = useState(() => {
    const cals = { lunch: lunchCal, breakfast: breakfastCal, dinner: dinnerCal, snack: snackCal };
    const top = Object.entries(cals).sort((a, b) => b[1] - a[1])[0];
    return (top && top[1] > 0) ? top[0] : 'lunch';
  });

  const getFoodNames = (list, defaultText) => {
    if (!list || list.length === 0) return defaultText;
    const names = list.map(e => e.food?.name || e.name || 'Logged Item').filter(Boolean);
    return names.slice(0, 2).join(', ') || defaultText;
  };

  const mealItems = {
    breakfast: {
      label: 'Breakfast',
      cal: breakfastCal,
      sub: breakfastCal > 0 ? `${bList.length} item${bList.length > 1 ? 's' : ''} logged` : 'Idli, Dosa, Poha',
      stripe: 'stripe-pink',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      pro: bList.reduce((s, e) => s + (parseFloat(e.protein) || 0), 0),
      foods: getFoodNames(bList, 'Light & Healthy')
    },
    lunch: {
      label: 'Lunch',
      cal: lunchCal,
      sub: lunchCal > 0 ? `${lList.length} item${lList.length > 1 ? 's' : ''} logged` : 'Rice, Curries, Dal',
      stripe: 'stripe-blue',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      pro: lList.reduce((s, e) => s + (parseFloat(e.protein) || 0), 0),
      foods: getFoodNames(lList, 'Wholesome Thali')
    },
    dinner: {
      label: 'Dinner',
      cal: dinnerCal,
      sub: dinnerCal > 0 ? `${dList.length} item${dList.length > 1 ? 's' : ''} logged` : 'Rotis, Dal, Light Meal',
      stripe: 'stripe-green',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      pro: dList.reduce((s, e) => s + (parseFloat(e.protein) || 0), 0),
      foods: getFoodNames(dList, 'Balanced Dinner')
    },
    snack: {
      label: 'Snacks',
      cal: snackCal,
      sub: snackCal > 0 ? `${sList.length} item${sList.length > 1 ? 's' : ''} logged` : 'Fruit, Nuts, Tea',
      stripe: 'stripe-amber',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      pro: sList.reduce((s, e) => s + (parseFloat(e.protein) || 0), 0),
      foods: getFoodNames(sList, 'Evening Energy')
    }
  };

  // Find max calorie for relative scaling (minimum height 40px, maximum 160px)
  const maxCal = Math.max(breakfastCal, lunchCal, dinnerCal, snackCal, 500);

  const getBarHeight = (cal) => {
    if (cal <= 0) return 44; // minimum subtle block
    return Math.max(54, Math.min(170, Math.round((cal / maxCal) * 150) + 16));
  };

  const currentActive = mealItems[activeMeal] || mealItems.lunch;

  return (
    <div className="zentra-card p-6 md:p-7 flex flex-col justify-between relative overflow-hidden">
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Meal Intake Funnel</h2>
          <p className="text-xs text-gray-400 font-medium">Energy distribution across today's eating periods</p>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Metric Header Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left mb-6 border-b border-gray-100 pb-4">
        {Object.entries(mealItems).map(([key, item]) => (
          <div 
            key={key} 
            onClick={() => setActiveMeal(key)}
            className={`p-2 rounded-xl cursor-pointer transition-all ${activeMeal === key ? 'bg-gray-50/80 ring-1 ring-gray-200' : 'hover:bg-gray-50/50'}`}
          >
            <span className="text-[11px] text-gray-400 font-semibold block">{item.label}</span>
            <span className="text-lg font-extrabold text-gray-900">
              {item.cal} <span className="text-xs font-normal text-gray-500">kcal</span>
            </span>
          </div>
        ))}
      </div>

      {/* 3D Isometric Stepped Bars Visualization */}
      <div className="h-60 relative flex items-end justify-between px-2 sm:px-6 pb-2">
        
        {/* Floating Interactive Tooltip */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/80 shadow-lg text-xs font-semibold text-gray-800 flex items-center gap-2.5 transition-all">
          <span className={`w-2.5 h-2.5 rounded-full ${currentActive.stripe}`}></span>
          <span>
            <b>{currentActive.cal} kcal</b> • {currentActive.label} ({currentActive.foods})
          </span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 text-[11px]">
            {currentActive.pro.toFixed(1)}g Pro
          </span>
        </div>

        {/* Isometric Bars */}
        {Object.entries(mealItems).map(([key, item]) => {
          const height = getBarHeight(item.cal);
          const isSelected = activeMeal === key;

          return (
            <div 
              key={key} 
              onClick={() => {
                setActiveMeal(key);
                if (onMealClick) onMealClick(key);
              }}
              className="w-1/5 flex flex-col items-center group cursor-pointer"
            >
              {/* 3D Stepped Block with Diagonal Hatching */}
              <div 
                style={{ height: `${height}px` }}
                className={`w-full rounded-2xl ${item.stripe} transition-all duration-500 relative flex flex-col justify-between shadow-md ${
                  isSelected ? 'scale-105 shadow-xl ring-2 ring-gray-900/10' : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'
                }`}
              >
                {/* 3D Chamfered Top Plane */}
                <div className="h-2.5 w-full bg-white/30 rounded-t-2xl border-b border-white/20"></div>
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-gray-900/40 rounded-full"></div>
                )}
              </div>

              {/* Label */}
              <span className={`text-xs font-bold mt-3 transition-colors ${isSelected ? item.color : 'text-gray-700'}`}>
                {item.label}
              </span>
              <span className="text-[10px] text-gray-400 font-medium truncate max-w-[80px]">
                {item.cal > 0 ? `${item.cal} kcal` : 'Empty'}
              </span>
            </div>
          );
        })}

      </div>

      {/* AI Assistant Bottom Bar (matching Zentra prompt bar) */}
      <div className="mt-4 pt-3 border-t border-gray-100 bg-blue-50/40 -mx-6 -mb-6 md:-mx-7 md:-mb-7 p-4 px-6 md:px-7 rounded-b-[28px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Sparkles size={14} className="text-blue-600 shrink-0" />
          <span className="text-blue-700 font-bold">What would you like to explore next?</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="text-gray-500 truncate">How much protein do I need for dinner to reach my target?</span>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100/80 text-amber-800 rounded-lg border border-amber-200/60 shrink-0">
          /dinner suggestion
        </span>
      </div>

    </div>
  );
};

export default IsometricMealChart;
