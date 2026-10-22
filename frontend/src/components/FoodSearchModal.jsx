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
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[640px] border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {selectedFood ? (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium text-gray-700"
              >
                <ArrowLeft size={18} /> Back to Search
              </button>
            ) : (
              <Dialog.Title className="text-lg font-bold text-gray-900">
                Add to {mealLabel}
              </Dialog.Title>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedFood ? (
              <div className="p-5 flex flex-col h-full">
                {/* Search input */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm"
                    placeholder="Search chicken, breast, mutton, fish, carrot, seeds..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                      <p className="text-sm text-gray-700 font-medium">Searching foods & supplements...</p>
                      <p className="text-xs text-gray-400 mt-1">Checking local database + nutrition registry 🌐</p>
                    </div>
                  ) : results.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {results.map((food) => (
                        <FoodResultItem key={food.id} food={food} onSelect={handleSelectFood} />
                      ))}
                    </ul>
                  ) : query.trim().length > 0 && !loading ? (
                    <div className="text-center p-10 text-gray-500">
                      <p className="text-base font-medium text-gray-700 mb-1">No items found matching "{query}"</p>
                      <p className="text-xs text-gray-400">Try searching: chicken, breast, boneless, mutton, fish, carrot, seeds...</p>
                    </div>
                  ) : (
                    <div className="text-center p-10 text-gray-400 text-sm">
                      <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="font-medium text-gray-600">Search for meats, vegetables, seeds, or supplements</p>
                      <p className="text-xs text-gray-400 mt-1">Raw meats, chicken cuts, fish, veggies, and whey powders</p>
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
