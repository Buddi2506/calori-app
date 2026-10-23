import React, { useState, useEffect, useMemo } from 'react';
import { getFoodLibrary } from '../api/foods';
import { useDebounce } from '../hooks/useDebounce';
import { formatApiDate } from '../utils/formatters';
import Segmented from '../components/ui/Segmented';
import FoodToolbar from './food-list/FoodToolbar';
import FoodCategorySection from './food-list/FoodCategorySection';
import FoodTile from './food-list/FoodTile';
import FoodDetailPanel from './food-list/FoodDetailPanel';
import QuickLogModal from './food-list/QuickLogModal';
import { SORTS } from './food-list/nutrition';

const PAGE_SIZE = 48; // ranked list shows this many at a time

const matchesQuery = (item, q) =>
  (item.name || '').toLowerCase().includes(q) ||
  (item.name_local || '').toLowerCase().includes(q) ||
  (item.category || '').toLowerCase().includes(q);

const FoodList = () => {
  const [libraryData, setLibraryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, filters and sort
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'raw', 'cooked'
  const [portionMode, setPortionMode] = useState('100g'); // '100g' or 'serving'
  const [sort, setSort] = useState('category');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [expandedCategories, setExpandedCategories] = useState({});
  const [detailFood, setDetailFood] = useState(null);

  // Quick Log Modal State (meal and date are remembered between logs)
  const [logModalFood, setLogModalFood] = useState(null);
  const [logMealType, setLogMealType] = useState('lunch');
  const [logDate, setLogDate] = useState(() => formatApiDate(new Date())); // local date, not UTC

  useEffect(() => {
    fetchLibrary();
  }, [typeFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, selectedCategory, typeFilter, sort]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = typeFilter !== 'all' ? { filter_type: typeFilter } : {};
      const data = await getFoodLibrary(params);
      setLibraryData(data);

      // Open the first 2 categories so the page renders quickly
      if (data && data.categories) {
        setExpandedCategories(Object.fromEntries(data.categories.map((cat, idx) => [cat.id, idx < 2])));
      }
    } catch (err) {
      console.error('Failed to load food library:', err);
      setError('Unable to load the food library. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Categories missing from the map count as open, so set each one explicitly
  const setAllExpanded = (open) => {
    if (!libraryData) return;
    setExpandedCategories(Object.fromEntries(libraryData.categories.map((c) => [c.id, open])));
  };

  const query = debouncedSearch.toLowerCase().trim();

  const filteredCategories = useMemo(() => {
    if (!libraryData || !libraryData.categories) return [];
    return libraryData.categories
      .filter((cat) => selectedCategory === 'all' || cat.id === selectedCategory)
      .map((cat) => {
        if (!query) return cat;
        const items = cat.items.filter((item) => matchesQuery(item, query));
        return { ...cat, count: items.length, items };
      })
      .filter((cat) => cat.items.length > 0);
  }, [libraryData, query, selectedCategory]);

  const totalFilteredItems = filteredCategories.reduce((sum, c) => sum + c.items.length, 0);

  // Any sort other than "By category" ranks every matching food in one list
  const sortDef = SORTS.find((s) => s.id === sort) || SORTS[0];
  const rankedItems = useMemo(() => {
    if (sort === 'category') return [];
    const items = filteredCategories.flatMap((c) => c.items);
    if (sort === 'name') return [...items].sort((a, b) => a.name.localeCompare(b.name));
    return [...items].sort((a, b) => sortDef.value(a, portionMode) - sortDef.value(b, portionMode));
  }, [filteredCategories, sort, sortDef, portionMode]);

  const openLog = (food) => {
    setDetailFood(null);
    setLogModalFood(food);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setTypeFilter('all');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Foods</span>
          <h1 className="text-[28px] font-black tracking-tight text-gray-900">Food library</h1>
          <span className="text-sm text-gray-600">
            {libraryData
              ? `${libraryData.total_items} foods in ${libraryData.total_categories} categories · tap a food for full nutrition`
              : 'Loading…'}
          </span>
        </div>
        <Segmented
          label="Show nutrition"
          value={portionMode}
          onChange={setPortionMode}
          options={[{ id: '100g', label: 'Per 100 g' }, { id: 'serving', label: 'Per serving' }]}
        />
      </div>

      <FoodToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sort={sort}
        setSort={setSort}
        categories={libraryData?.categories || []}
        totalItems={libraryData?.total_items || 0}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" aria-label="Loading foods">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="zentra-card !rounded-3xl h-[150px] animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="zentra-card p-6 text-center">
          <p className="font-semibold text-rose-700">{error}</p>
          <button onClick={fetchLibrary} className="btn-primary mt-3 text-sm">Retry</button>
        </div>
      )}

      {!loading && !error && totalFilteredItems === 0 && (
        <div className="zentra-card p-10 text-center flex flex-col items-center gap-3">
          <span className="text-5xl" aria-hidden="true">🔍</span>
          <h2 className="text-lg font-bold text-gray-900">No foods found</h2>
          <p className="text-sm text-gray-500 max-w-md">
            Nothing matched{searchQuery ? ` “${searchQuery}”` : ''}. Try another name, or the Telugu name.
          </p>
          <button onClick={clearFilters} className="btn-primary text-sm">Clear filters</button>
        </div>
      )}

      {!loading && !error && totalFilteredItems > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 text-sm -mb-1">
            <span className="text-gray-600">
              <span className="font-bold text-gray-900">{totalFilteredItems}</span> {totalFilteredItems === 1 ? 'food' : 'foods'}
              {sort !== 'category' && <> · ranked by <span className="font-bold text-amber-400">{sortDef.label.toLowerCase()}</span></>}
            </span>
            {sort === 'category' && !query && (
              <span className="flex gap-3 text-[13px] font-bold">
                <button onClick={() => setAllExpanded(true)} className="text-gray-600 hover:text-gray-900">Expand all</button>
                <button onClick={() => setAllExpanded(false)} className="text-gray-600 hover:text-gray-900">Collapse all</button>
              </span>
            )}
          </div>

          {sort === 'category' ? (
            <div className="flex flex-col gap-5">
              {filteredCategories.map((category) => (
                <FoodCategorySection
                  key={category.id}
                  category={category}
                  // While searching, every category with a match is shown open
                  isExpanded={query ? true : expandedCategories[category.id] !== false}
                  onToggle={toggleCategory}
                  portionMode={portionMode}
                  onOpen={setDetailFood}
                  onLog={openLog}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {rankedItems.slice(0, visibleCount).map((item, i) => (
                  <FoodTile
                    key={item.id}
                    item={item}
                    portionMode={portionMode}
                    rank={sort === 'name' ? null : i + 1}
                    onOpen={setDetailFood}
                    onLog={openLog}
                  />
                ))}
              </div>
              {visibleCount < rankedItems.length && (
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="self-center h-11 px-6 rounded-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 hover:border-amber-400 transition-colors"
                >
                  Show more ({rankedItems.length - visibleCount} left)
                </button>
              )}
            </>
          )}
        </>
      )}

      {detailFood && (
        <FoodDetailPanel
          key={detailFood.id}
          item={detailFood}
          portionMode={portionMode}
          onLog={openLog}
          onClose={() => setDetailFood(null)}
        />
      )}

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
