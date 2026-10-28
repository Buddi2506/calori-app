import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { searchFoods } from '../api/foods';
import { useDebounce } from '../hooks/useDebounce';
import { defaultPortion } from '../utils/foodPortions';
import FoodResultItem from './food-search/FoodResultItem';
import PortionEditor from './food-search/PortionEditor';

const FoodSearchModal = ({ isOpen, onClose, onAdd, mealType }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');

  const mealLabel = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : 'Diary';

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery.trim());
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const performSearch = async (q) => {
    setLoading(true);
    try {
      const data = await searchFoods(q);
      const items = Array.isArray(data) ? data : (data.items || []);
      setResults(items);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    const portion = defaultPortion(food);
    setUnit(portion.unit);
    setQuantity(portion.quantity);
  };

  const handleBack = () => {
    setSelectedFood(null);
  };

  const handleAdd = () => {
    if (!selectedFood) return;

    onAdd({
      food_id: selectedFood.id,
      quantity_display: parseFloat(quantity) || 1,
      quantity_unit: unit,
      meal_type: mealType || 'breakfast',
    });

    // Reset and close
    setSelectedFood(null);
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[680px] border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
            {selectedFood ? (
              <button
                onClick={handleBack}
                className="-ml-2 px-2 py-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1.5 text-sm font-bold text-gray-700"
              >
                <ArrowLeft size={18} /> Back to search
              </button>
            ) : (
              <Dialog.Title className="text-base font-extrabold text-gray-900">
                Add to {mealLabel}
              </Dialog.Title>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedFood ? (
              <div className="p-5 flex flex-col h-full">
                {/* Search input */}
                <div className="flex items-center gap-3 h-[52px] px-4 mb-3 rounded-2xl bg-[#080A0F] border border-gray-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 transition-colors">
                  <Search size={18} className="text-gray-600 shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    aria-label="Search foods"
                    className="flex-1 min-w-0 h-12 bg-transparent outline-none text-[15px] text-gray-900 placeholder-gray-500"
                    placeholder="Search foods — dosa, chicken breast, paneer…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <p className="p-10 text-center text-sm text-gray-500">Searching…</p>
                  ) : results.length > 0 ? (
                    <ul className="flex flex-col">
                      {results.map((food) => (
                        <FoodResultItem key={food.id} food={food} onSelect={handleSelectFood} />
                      ))}
                    </ul>
                  ) : query.trim().length > 0 && !loading ? (
                    <div className="text-center p-10">
                      <p className="text-sm font-bold text-gray-900 mb-1">No foods match “{query}”</p>
                      <p className="text-xs text-gray-500">Try another name, or the Telugu name.</p>
                    </div>
                  ) : (
                    <div className="text-center p-10 text-sm text-gray-500">
                      <Search size={40} className="mx-auto text-gray-300 mb-3" aria-hidden="true" />
                      Start typing to search the food library.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <PortionEditor
                food={selectedFood}
                quantity={quantity}
                setQuantity={setQuantity}
                unit={unit}
                setUnit={setUnit}
                mealLabel={mealLabel}
                onAdd={handleAdd}
              />
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default FoodSearchModal;
