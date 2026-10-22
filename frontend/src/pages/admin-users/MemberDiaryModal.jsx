import React from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Read-only view of a member's diary for one day.
const MemberDiaryModal = ({ selectedUser, inspectDate, inspectDiary, diaryLoading, onDateChange, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
              {selectedUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>{selectedUser.full_name || selectedUser.username}</span>
                <span className="text-xs font-normal text-gray-400">(@{selectedUser.username})</span>
              </h3>
              <p className="text-xs text-gray-500">Member Food Diary Inspection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl border border-gray-200/80 mb-6">
          <button
            onClick={() => onDateChange(-1)}
            className="p-1.5 rounded-xl hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Calendar size={14} className="text-amber-500" />
            <span>{inspectDate}</span>
          </div>
          <button
            onClick={() => onDateChange(1)}
            className="p-1.5 rounded-xl hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {diaryLoading ? (
          <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
            <span className="inline-block w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
            <span className="text-xs">Loading diary entries...</span>
          </div>
        ) : inspectDiary ? (
          <div className="space-y-5">
            {/* Total Stats Banner */}
            <div className="grid grid-cols-4 gap-2 bg-[#24262E] text-white p-4 rounded-2xl text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Calories</div>
                <div className="text-base font-black text-amber-400">
                  {Math.round(inspectDiary.totals?.calories || 0)} kcal
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Protein</div>
                <div className="text-base font-black text-rose-300">
                  {Math.round(inspectDiary.totals?.protein || 0)}g
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Carbs</div>
                <div className="text-base font-black text-amber-200">
                  {Math.round(inspectDiary.totals?.carbohydrates || 0)}g
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Fat</div>
                <div className="text-base font-black text-emerald-300">
                  {Math.round(inspectDiary.totals?.fat || 0)}g
                </div>
              </div>
            </div>

            {/* Meals Breakdown */}
            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
              const items = inspectDiary.entries?.[mealType] || [];
              const mealCal = items.reduce((acc, curr) => acc + (curr.calories || 0), 0);

              return (
                <div key={mealType} className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                      {mealType} ({items.length})
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      {Math.round(mealCal)} kcal
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic">No food logged for {mealType}.</p>
                  ) : (
                    <div className="space-y-1.5 mt-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-2.5 rounded-xl border border-gray-200/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-800">
                              {item.food?.name || 'Item'}
                            </span>
                            <span className="text-gray-400 text-[11px] ml-2">
                              ({item.quantity_display} {item.quantity_unit})
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                            <span>P: {Math.round(item.protein || 0)}g</span>
                            <span>C: {Math.round(item.carbohydrates || 0)}g</span>
                            <span>F: {Math.round(item.fat || 0)}g</span>
                            <span className="font-bold text-gray-900 ml-1">
                              {Math.round(item.calories || 0)} kcal
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">No diary records found for this date.</p>
        )}
      </div>
    </div>
  );
};

export default MemberDiaryModal;
