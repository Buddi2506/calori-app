import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { searchFoods } from '../../api/foods';
import { useDebounce } from '../../hooks/useDebounce';

// Search box with a results dropdown; picking a food clears the search.
const IngredientSearch = ({ onPick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim().length > 0) {
      setSearching(true);
      searchFoods(debouncedSearch.trim())
        .then(data => setSearchResults(Array.isArray(data) ? data : (data.items || [])))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const handlePick = (food) => {
    onPick(food);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <>
      {/* Search input */}
      <div className="relative mb-2">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="input-field pl-9 text-sm"
          placeholder="Search foods to add (e.g. Oats, Mix Seeds, Milk, Dosa)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Search Results Dropdown */}
      {searching ? (
        <div className="p-3 text-center text-xs text-gray-500">Searching...</div>
      ) : searchResults.length > 0 ? (
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-md mb-3">
          {searchResults.map(food => (
            <div
              key={food.id}
              onClick={() => handlePick(food)}
              className="p-2.5 hover:bg-green-50/70 cursor-pointer flex justify-between items-center text-sm transition-colors"
            >
              <div>
                <span className="font-semibold text-gray-900">{food.name}</span>
                {food.name_local && <span className="text-xs text-orange-600 ml-2 font-medium">{food.name_local}</span>}
                <span className="text-xs text-gray-400 ml-2">({Math.round(food.calories || 0)} kcal/100g)</span>
              </div>
              <span className="text-xs font-semibold text-primary px-2.5 py-1 bg-green-50 rounded-md">
                + Add
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

export default IngredientSearch;
