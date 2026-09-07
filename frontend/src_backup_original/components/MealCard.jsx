import React from 'react';
import { Calendar, Trash2, Edit3, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const MealCard = ({ meal, onLog, onEdit, onDelete }) => {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
            {meal.image_emoji || '🥘'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{meal.name}</h3>
            {meal.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{meal.description}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-primary-dark">{Math.round(meal.nutrition?.calories ?? meal.total_calories ?? 0)}</span>
          <span className="text-xs text-gray-500 block">kcal</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 mb-4 line-clamp-2">
          {meal.items && meal.items.map(i => i.food_name).join(', ')}
        </p>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(meal)}
              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
              title="Edit Meal"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => onDelete(meal.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete Meal"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <button 
            onClick={() => onLog(meal)}
            className="flex items-center gap-1 bg-green-50 text-primary hover:bg-green-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Calendar size={16} />
            Log Meal
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
