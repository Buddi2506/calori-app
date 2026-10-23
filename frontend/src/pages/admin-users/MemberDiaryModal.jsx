import React from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { MEAL_COLORS } from '../../components/dashboard/CaloriesCard';
import { MEAL_TYPES, mealLabel, formatPortion } from '../../utils/quickAdd';
import { userInitials } from '../../components/UserMenu';

const TOTALS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g', cls: 'text-emerald-700' },
  { key: 'carbohydrates', label: 'Carbs', unit: 'g', cls: 'text-blue-700' },
  { key: 'fat', label: 'Fat', unit: 'g', cls: 'text-pink-700' },
];

// Read-only view of a member's diary for one day.
const MemberDiaryModal = ({ selectedUser, inspectDate, inspectDiary, diaryLoading, onDateChange, onClose }) => (
  <Modal
    title={selectedUser.full_name || selectedUser.username}
    subtitle={`@${selectedUser.username} · food diary`}
    icon={<span className="text-sm font-black text-gray-900">{userInitials(selectedUser)}</span>}
    size="xl"
    onClose={onClose}
  >
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => onDateChange(-1)} aria-label="Previous day"
          className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-extrabold text-gray-900">{format(parseISO(inspectDate), 'EEEE, d MMM yyyy')}</span>
        <button onClick={() => onDateChange(1)} aria-label="Next day"
          className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 flex items-center justify-center">
          <ChevronRight size={18} />
        </button>
      </div>

      {diaryLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">Loading diary…</p>
      ) : !inspectDiary ? (
        <p className="py-10 text-center text-sm text-gray-500">No diary records for this date.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {TOTALS.map((t) => (
              <div key={t.key} className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-center">
                <span className={`block text-lg font-black ${t.cls || 'text-gray-900'}`}>
                  {Math.round(inspectDiary.totals?.[t.key] || 0)}
                  <span className="text-xs font-normal text-gray-500"> {t.unit}</span>
                </span>
                <span className="text-[11px] text-gray-500">{t.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {MEAL_TYPES.map((mealType) => {
              const items = inspectDiary.entries?.[mealType] || [];
              const mealCal = items.reduce((acc, curr) => acc + (curr.calories || 0), 0);
              return (
                <section key={mealType} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-7 rounded-full shrink-0" style={{ background: MEAL_COLORS[mealType] }} aria-hidden="true" />
                    <h4 className="flex-1 text-sm font-extrabold text-gray-900">{mealLabel(mealType)}</h4>
                    <span className="text-sm font-black text-gray-900">{Math.round(mealCal)} <span className="text-xs font-normal text-gray-500">kcal</span></span>
                  </div>
                  {items.length === 0 ? (
                    <p className="mt-2 pl-[18px] text-xs text-gray-500">Nothing logged</p>
                  ) : (
                    <ul className="mt-2 pl-[18px]">
                      {items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-2 border-t border-gray-100 first:border-t-0 text-xs">
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-bold text-gray-900 truncate">{item.food?.name || 'Item'}</span>
                            <span className="text-gray-500">
                              {formatPortion(item.quantity_display, item.quantity_unit)}
                              <span className="text-emerald-700"> · {Math.round(item.protein || 0)}g P</span>
                              <span className="text-blue-700"> · {Math.round(item.carbohydrates || 0)}g C</span>
                              <span className="text-pink-700"> · {Math.round(item.fat || 0)}g F</span>
                            </span>
                          </span>
                          <span className="text-sm font-extrabold text-gray-900 shrink-0">{Math.round(item.calories || 0)} kcal</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  </Modal>
);

export default MemberDiaryModal;
