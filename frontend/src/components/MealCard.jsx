import React from 'react';
import { Calendar, Trash2, Edit3 } from 'lucide-react';

const MealCard = ({ meal, onLog, onEdit, onDelete }) => {
  return (
    <div className="zentra-card p-6 flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
              {meal.image_emoji || '🥘'}
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base group-hover:text-amber-800 transition-colors">{meal.name}</h3>
              {meal.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{meal.description}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="font-black text-gray-900 text-lg">{Math.round(meal.nutrition?.calories ?? meal.total_calories ?? 0)}</span>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">kcal</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {meal.items && meal.items.map(i => i.food_name).join(', ')}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button 
            onClick={() => onEdit(meal)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-gray-100 transition-colors"
            title="Edit Meal"
          >
            <Edit3 size={16} />
          </button>
          <button 
            onClick={() => onDelete(meal.id)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-gray-100 transition-colors"
            title="Delete Meal"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <button 
          onClick={() => onLog(meal)}
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Calendar size={14} />
          Log Meal
        </button>
      </div>
    </div>
  );
};

export default MealCard;
