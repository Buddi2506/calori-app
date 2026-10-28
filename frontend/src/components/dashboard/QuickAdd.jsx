import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchFoods } from '../../api/foods';
import { getRecentFoods } from '../../api/diary';
import { useDebounce } from '../../hooks/useDebounce';
import { parseQuickAddQuery, quickAddPortion } from '../../utils/quickAdd';
import QuickAddPortionModal from './QuickAddPortionModal';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

// Search-as-you-type food logging plus one-tap recent foods.
// `onAdd({ food, quantity, unit, mealType })` saves the entry; `refreshKey` reloads recents after a log.
const QuickAdd = ({ defaultMeal, onAdd, refreshKey }) => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState([]);
  const [picked, setPicked] = useState(null); // { food, portion }

  const parsed = parseQuickAddQuery(debouncedQuery);

  useEffect(() => {
    getRecentFoods(8).then(setRecent).catch(() => setRecent([]));
  }, [refreshKey]);

  useEffect(() => {
    const term = parsed.term;
    if (!term) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchFoods(term, 8)
      .then((data) => { if (!cancelled) setResults(Array.isArray(data) ? data : (data.items || [])); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setSearching(false); });
    setActiveIndex(0);
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Cmd/Ctrl+K focuses the search from anywhere on the dashboard
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pickFood = (food) => {
    setPicked({ food, portion: quickAddPortion(food, parsed) });
  };

  const pickRecent = (r) => {
    setPicked({ food: r.food, portion: { quantity: r.quantity_display, unit: r.quantity_unit } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      pickFood(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  const handleAdd = async (entry) => {
    await onAdd(entry);
    setPicked(null);
    setQuery('');
    setResults([]);
  };

  const showDropdown = query.trim().length > 0;

  return (
    <section className="zentra-card p-4 flex flex-col gap-3 !border-gray-200">
      <label htmlFor="quick-add" className="text-xs font-bold text-gray-600 uppercase tracking-wider px-1.5">
        Quick add to {defaultMeal}
      </label>

      <div className="relative">
        <div className="flex items-center gap-3 h-[52px] px-4 rounded-2xl bg-[#080A0F] border border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30">
          <Search size={18} className="text-gray-600 shrink-0" aria-hidden="true" />
          <input
            id="quick-add"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type “2 chapati” or search 662 foods…"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="quick-add-results"
            className="flex-1 min-w-0 h-12 bg-transparent outline-none text-[15px] text-gray-900 placeholder-gray-500"
          />
          <kbd className="hidden sm:inline text-xs font-bold text-gray-600 px-2 py-1 rounded-lg border border-gray-200">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </div>

        {showDropdown && (
          <ul
            id="quick-add-results"
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white border border-gray-200 shadow-2xl p-1.5"
          >
            {searching && results.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-500">Searching…</li>
            ) : results.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-500">No foods match “{parsed.term || query}”.</li>
            ) : (
              results.map((food, i) => (
                <li key={food.id} role="option" aria-selected={i === activeIndex}>
                  <button
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pickFood(food)}
                    className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl ${
                      i === activeIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 truncate">{food.name}</span>
                      {food.name_local && <span className="block text-xs text-orange-600">{food.name_local}</span>}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">{Math.round(food.calories || 0)} kcal / 100g</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 px-1.5">Recent</span>
          {recent.map((r) => (
            <button
              key={r.food.id}
              onClick={() => pickRecent(r)}
              title={`${r.quantity_display} ${r.quantity_unit} ${r.food.name}`}
              className="h-9 max-w-[220px] px-3.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-semibold hover:border-amber-400 hover:text-gray-900 transition-colors truncate"
            >
              + {r.food.name}
            </button>
          ))}
        </div>
      )}

      {picked && (
        <QuickAddPortionModal
          key={picked.food.id}
          food={picked.food}
          initialPortion={picked.portion}
          initialMeal={defaultMeal}
          onAdd={handleAdd}
          onClose={() => setPicked(null)}
        />
      )}
    </section>
  );
};

export default QuickAdd;
