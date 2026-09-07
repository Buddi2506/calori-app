import React from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
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
  
  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <span className="font-semibold text-primary-dark">{Math.round(totalCalories)} kcal</span>
      </div>
      
      {entries.length > 0 ? (
        <div className="divide-y divide-gray-100 mb-4">
          {entries.map((entry) => (
            <div key={entry.id} className="py-3 flex justify-between items-center group">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{entry.food?.name || entry.food_name || 'Food'}</p>
                <div className="flex text-xs text-gray-500 gap-3 mt-1">
                  <span>{entry.quantity_display} {entry.quantity_unit}</span>
                  <span>•</span>
                  <span>{formatNutrient(entry.protein, 'g')} P</span>
                  <span>{formatNutrient(entry.carbohydrates, 'g')} C</span>
                  <span>{formatNutrient(entry.fat, 'g')} F</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{Math.round(entry.calories || 0)}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEditEntry(entry)}
                    className="p-1 text-gray-400 hover:text-blue-500"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic mb-4 text-center py-2">No foods logged yet.</p>
      )}
      
      <div className="flex gap-3">
        <button 
          onClick={() => onAddFood(title.toLowerCase())}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Food
        </button>
        <button 
          onClick={() => onLogMeal(title.toLowerCase())}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
        >
          <Plus size={16} /> Log Meal
        </button>
      </div>
    </div>
  );
};

export default DiaryMealSection;
