import React, { useState, useEffect, useMemo } from 'react';
import { getFoodLibrary } from '../api/foods';
import { useDebounce } from '../hooks/useDebounce';
import FoodListHeader from './food-list/FoodListHeader';
import FoodFilters from './food-list/FoodFilters';
import FoodCategorySection from './food-list/FoodCategorySection';
import QuickLogModal from './food-list/QuickLogModal';

const FoodList = () => {
  const [libraryData, setLibraryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'raw', 'cooked'
  const [portionMode, setPortionMode] = useState('100g'); // '100g' or 'serving'

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState({});

  // Quick Log Modal State (meal and date are remembered between logs)
  const [logModalFood, setLogModalFood] = useState(null);
  const [logMealType, setLogMealType] = useState('lunch');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLibrary();
  }, [typeFilter]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (typeFilter !== 'all') {
        params.filter_type = typeFilter;
      }
      const data = await getFoodLibrary(params);
      setLibraryData(data);

      // Default expand the first 2 categories for fast snappy render
      if (data && data.categories) {
        const initialExpanded = {};
        data.categories.forEach((cat, idx) => {
          initialExpanded[cat.id] = idx < 2;
        });
        setExpandedCategories(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to load food library:', err);
      setError('Unable to load food library. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const expandAll = () => {
    if (!libraryData) return;
    const all = {};
    libraryData.categories.forEach(c => { all[c.id] = true; });
    setExpandedCategories(all);
  };

  // Categories missing from the map count as open, so collapse each one explicitly
  const collapseAll = () => {
    if (!libraryData) return;
    const none = {};
    libraryData.categories.forEach(c => { none[c.id] = false; });
    setExpandedCategories(none);
  };

  // Filter categories and items based on search & category filter
  const filteredCategories = useMemo(() => {
    if (!libraryData || !libraryData.categories) return [];

    const q = debouncedSearch.toLowerCase().trim();

    return libraryData.categories
      .filter(cat => {
        if (selectedCategory !== 'all' && cat.id !== selectedCategory) {
          return false;
        }
        return true;
      })
      .map(cat => {
        if (!q) return cat;

        const matchingItems = cat.items.filter(item => {
          const nameMatch = (item.name || '').toLowerCase().includes(q);
          const localMatch = (item.name_local || '').toLowerCase().includes(q);
          const catMatch = (item.category || '').toLowerCase().includes(q);
          return nameMatch || localMatch || catMatch;
        });

        return {
          ...cat,
          count: matchingItems.length,
          items: matchingItems
        };
      })
      .filter(cat => cat.items.length > 0);
  }, [libraryData, debouncedSearch, selectedCategory]);

  const totalFilteredItems = useMemo(() => {
    return filteredCategories.reduce((sum, c) => sum + c.items.length, 0);
  }, [filteredCategories]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <FoodListHeader portionMode={portionMode} setPortionMode={setPortionMode} />

      <FoodFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        totalFilteredItems={totalFilteredItems}
        expandAll={expandAll}
        collapseAll={collapseAll}
        libraryData={libraryData}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading food library & micronutrient values...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchLibrary}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Categories & Items List */}
      {!loading && !error && filteredCategories.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 space-y-3">
          <div className="text-5xl">🔍</div>
          <h3 className="text-lg font-bold text-gray-800">No foods found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            No items matched "{searchQuery}". Try searching for another grain, vegetable, meat cut, or seed.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setTypeFilter('all'); }}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {!loading && !error && filteredCategories.map((category) => (
        <FoodCategorySection
          key={category.id}
          category={category}
          isExpanded={expandedCategories[category.id] !== false}
          onToggle={toggleCategory}
          portionMode={portionMode}
          onLog={setLogModalFood}
        />
      ))}

      {logModalFood && (
        <QuickLogModal
          key={logModalFood.id}
          food={logModalFood}
          logMealType={logMealType}
          setLogMealType={setLogMealType}
          logDate={logDate}
          setLogDate={setLogDate}
          onClose={() => setLogModalFood(null)}
        />
      )}
    </div>
  );
};

export default FoodList;
