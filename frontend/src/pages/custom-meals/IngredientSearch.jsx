import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { searchFoods } from '../../api/foods';
import { useDebounce } from '../../hooks/useDebounce';

// Search box with a results list; picking a food clears the search.
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-[#0E0F13] border border-gray-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 transition-colors">
        <Search size={17} className="text-gray-600 shrink-0" aria-hidden="true" />
        <input
          type="text"
          aria-label="Search foods to add"
          className="flex-1 min-w-0 h-11 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
          placeholder="Search foods to add — oats, seeds, milk, dosa…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searching ? (
        <p className="px-1 text-xs text-gray-500">Searching…</p>
      ) : searchResults.length > 0 ? (
        <ul className="max-h-52 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1.5">
          {searchResults.map(food => (
            <li key={food.id}>
              <button
                onClick={() => handlePick(food)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 truncate">{food.name}</span>
                  <span className="block text-xs text-gray-500 truncate">
                    {food.name_local && <span className="text-orange-600">{food.name_local} · </span>}
                    {Math.round(food.calories || 0)} kcal / 100g
                  </span>
                </span>
                <span className="h-7 px-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-900 flex items-center gap-1 shrink-0">
                  <Plus size={13} /> Add
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default IngredientSearch;
