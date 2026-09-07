import React from 'react';
import { Plus, Trash2, Edit2, Utensils } from 'lucide-react';
import { formatNutrient } from '../utils/formatters';

const DiaryMealSection = ({ 
  title, 
  entries = [], 
  onAddFood, 
  onLogMeal, 
  onEditEntry, 
  onDeleteEntry 
}) => {
  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  const totalProtein = entries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
  
  return (
    <div className="zentra-card p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">{title}</h3>
          <p className="text-xs text-gray-400 font-medium">{entries.length} items logged</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-gray-900">{Math.round(totalCalories)} <span className="text-xs font-normal text-gray-500">kcal</span></span>
          <p className="text-[11px] font-bold text-emerald-600">{totalProtein.toFixed(1)}g Protein</p>
        </div>
      </div>
      
      {entries.length > 0 ? (
        <div className="divide-y divide-gray-100 mb-5">
          {entries.map((entry) => {
            const foodName = entry.food?.name || entry.food_name || 'Food';
            const localName = entry.food?.name_local;

            return (
              <div key={entry.id} className="py-3.5 flex justify-between items-center group hover:bg-gray-50/60 -mx-3 px-3 rounded-2xl transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">{foodName}</p>
                    {localName && (
                      <span className="text-xs font-medium text-amber-700/80 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                        {localName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap text-xs text-gray-500 gap-2.5 mt-1">
                    <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      {entry.quantity_display} {entry.quantity_unit}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{formatNutrient(entry.protein, 'g')} P</span>
                    <span className="text-blue-700 font-semibold">{formatNutrient(entry.carbohydrates, 'g')} C</span>
                    <span className="text-pink-700 font-semibold">{formatNutrient(entry.fat, 'g')} F</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-gray-900">{Math.round(entry.calories || 0)} <span className="text-xs font-normal text-gray-400">kcal</span></span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEditEntry && onEditEntry(entry)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                      title="Edit portion"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mb-5">
          <p className="text-xs text-gray-400 italic font-medium">No foods logged for {title.toLowerCase()} yet.</p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button 
          onClick={() => onAddFood(title.toLowerCase())}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Food
        </button>
        <button 
          onClick={() => onLogMeal(title.toLowerCase())}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-2xl transition-colors shadow-sm"
        >
          <Utensils size={15} /> Log Custom Meal
        </button>
      </div>
    </div>
  );
};

export default DiaryMealSection;
