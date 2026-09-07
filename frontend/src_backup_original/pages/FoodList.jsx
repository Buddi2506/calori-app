import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Check, 
  Sparkles, 
  Filter, 
  Flame, 
  Apple, 
  Layers, 
  ArrowRight,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';
import { getFoodLibrary } from '../api/foods';
import { addDiaryEntry } from '../api/diary';
import { useDebounce } from '../hooks/useDebounce';

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

  // Quick Log Modal State
  const [logModalFood, setLogModalFood] = useState(null);
  const [logMealType, setLogMealType] = useState('lunch');
  const [logQuantity, setLogQuantity] = useState(1);
  const [logUnit, setLogUnit] = useState('g');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [loggingSuccess, setLoggingSuccess] = useState(false);
  const [loggingLoading, setLoggingLoading] = useState(false);

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

      // Default expand the first 3 categories
      if (data && data.categories) {
        const initialExpanded = {};
        data.categories.forEach((cat, idx) => {
          initialExpanded[cat.id] = idx < 4;
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

  const collapseAll = () => {
    setExpandedCategories({});
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

  // Quick Log Handling
  const handleOpenLogModal = (food) => {
    setLogModalFood(food);
    const unit = food.serving_unit || 'g';
    if (unit !== 'g' && unit !== 'ml') {
      setLogUnit(unit);
      setLogQuantity(1);
    } else {
      setLogUnit('g');
      setLogQuantity(100);
    }
    setLoggingSuccess(false);
  };

  const handleConfirmLog = async (e) => {
    e.preventDefault();
    if (!logModalFood) return;

    try {
      setLoggingLoading(true);
      await addDiaryEntry({
        date: logDate,
        meal_type: logMealType,
        food_id: logModalFood.id,
        quantity_display: parseFloat(logQuantity) || 1,
        quantity_unit: logUnit
      });
      setLoggingSuccess(true);
      setTimeout(() => {
        setLogModalFood(null);
        setLoggingSuccess(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to log food:', err);
      alert('Could not log food. Please try again.');
    } finally {
      setLoggingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-700 via-green-700 to-teal-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-green-900/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none text-9xl">
          🥗
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} /> Item List & Micro Values
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Comprehensive Food Library
          </h1>
          <p className="text-green-100 text-sm md:text-base max-w-2xl">
            Browse authentic South Indian & Indian foods across categories. Inspect real-time macros, minerals, and vitamins for 100g, 100ml, scoops, and standard piece weights.
          </p>
        </div>

        {/* Portion Toggle Header Control */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex flex-col gap-1.5 self-start md:self-center">
          <span className="text-[11px] font-semibold text-green-200 uppercase tracking-wider px-2">
            Calculate Nutrition As:
          </span>
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => setPortionMode('100g')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                portionMode === '100g'
                  ? 'bg-white text-gray-900 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Per 100g / 100ml
            </button>
            <button
              onClick={() => setPortionMode('serving')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                portionMode === 'serving'
                  ? 'bg-white text-gray-900 shadow-md scale-[1.02]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Per 1 Serving (Piece/Scoop/Cup)
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-colors"
              placeholder="Search by food name or Telugu (e.g. arikelu, gongura, chicken breast, whey)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Type Filter (All / Raw / Cooked) */}
          <div className="md:col-span-3 flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Variants
            </button>
            <button
              onClick={() => setTypeFilter('raw')}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                typeFilter === 'raw' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🥩 Raw Only
            </button>
            <button
              onClick={() => setTypeFilter('cooked')}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                typeFilter === 'cooked' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🍲 Cooked Only
            </button>
          </div>

          {/* Expand / Collapse All */}
          <div className="md:col-span-3 flex items-center justify-end gap-2 text-xs">
            <span className="text-gray-500 font-medium mr-auto md:mr-0">
              Showing <span className="font-bold text-gray-800">{totalFilteredItems}</span> foods
            </span>
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Category Pills Scroller */}
        {libraryData && libraryData.categories && (
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>🌐</span>
              <span>All Categories</span>
              <span className="opacity-75 text-[10px]">({libraryData.total_items})</span>
            </button>

            {libraryData.categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-primary'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.title.split('(')[0].trim()}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

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

      {!loading && !error && filteredCategories.map((category) => {
        const isExpanded = expandedCategories[category.id] !== false;

        return (
          <div
            key={category.id}
            className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden transition-all"
          >
            {/* Category Accordion Header */}
            <div
              onClick={() => toggleCategory(category.id)}
              className="p-4 md:p-5 bg-gradient-to-r from-gray-50 via-gray-50/70 to-white flex items-center justify-between cursor-pointer select-none hover:bg-green-50/40 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-gray-100">
                  {category.icon}
                </span>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    {category.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Category: <span className="font-semibold text-gray-700">{category.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-200/80 text-gray-700 text-xs font-bold rounded-full">
                  {category.count} items
                </span>
                <div className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>
            </div>

            {/* Category Items Cards Grid */}
            {isExpanded && (
              <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-50/30">
                {category.items.map((item) => {
                  const nutrients = (portionMode === 'serving' ? item.per_serving : item.per_100g) || item.per_100g || {};
                  const isRaw = (item.name || '').toLowerCase().includes('(raw)');
                  const isCooked = (item.name || '').toLowerCase().includes('(cooked') || 
                                   (item.name || '').toLowerCase().includes('(boiled') ||
                                   (item.name || '').toLowerCase().includes('(steamed');
                  const isFruit = (item.category || '').toLowerCase().includes('fruit');
                  const isSeed = (item.category || '').toLowerCase().includes('seed');
                  const isScoop = item.serving_unit === 'scoop';

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 hover:border-green-400 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      {/* Top Header of Item */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            {item.name_local && (
                              <p className="text-xs font-medium text-orange-600 mt-0.5">
                                {item.name_local}
                              </p>
                            )}
                          </div>

                          {/* Quick Log Button */}
                          <button
                            onClick={() => handleOpenLogModal(item)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all border border-green-200 hover:border-transparent flex-shrink-0 shadow-xs"
                            title="Log to today's diary"
                          >
                            <Plus size={14} />
                            <span>Log</span>
                          </button>
                        </div>

                        {/* Badges Bar */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                          {isRaw && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold uppercase tracking-wider">
                              🥩 Raw Weight
                            </span>
                          )}
                          {isCooked && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold uppercase tracking-wider">
                              🍲 Cooked / Boiled
                            </span>
                          )}
                          {isFruit && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold uppercase tracking-wider">
                              🍎 Fruit
                            </span>
                          )}
                          {isSeed && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider">
                              🌱 Seeds & Nuts
                            </span>
                          )}
                          {isScoop && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold uppercase tracking-wider">
                              💪 1 Scoop
                            </span>
                          )}

                          <span className="text-gray-500 font-medium ml-auto">
                            Serving: <span className="text-gray-800 font-semibold">1 {item.serving_unit} ({item.serving_unit_weight_g}g)</span>
                          </span>
                        </div>
                      </div>

                      {/* Nutrient Content Box */}
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                        {/* Macro Summary Row */}
                        <div className="bg-gray-50/80 rounded-xl p-3 flex items-center justify-between gap-2 border border-gray-100">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Energy ({portionMode === 'serving' ? `1 ${item.serving_unit}` : item.base_unit})
                            </span>
                            <span className="text-xl font-black text-gray-900 flex items-center gap-1">
                              {nutrients.calories ?? 0} <span className="text-xs font-semibold text-gray-500">kcal</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-right text-xs">
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Protein</span>
                              <span className="font-bold text-emerald-700">{nutrients.protein ?? 0}g</span>
                            </div>
                            <div className="w-[1px] h-7 bg-gray-200" />
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Carbs</span>
                              <span className="font-bold text-amber-700">{nutrients.carbohydrates ?? 0}g</span>
                            </div>
                            <div className="w-[1px] h-7 bg-gray-200" />
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Fat</span>
                              <span className="font-bold text-indigo-700">{nutrients.fat ?? 0}g</span>
                            </div>
                            {(nutrients.fiber ?? 0) > 0 && (
                              <>
                                <div className="w-[1px] h-7 bg-gray-200" />
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-semibold">Fiber</span>
                                  <span className="font-bold text-teal-700">{nutrients.fiber ?? 0}g</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Micronutrients Grid */}
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Key Micronutrients ({portionMode === 'serving' ? `1 ${item.serving_unit}` : item.base_unit}):
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs">
                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Iron (Fe)</span>
                              <span className={`font-semibold ${(nutrients.iron ?? 0) > 2 ? 'text-rose-700' : 'text-gray-800'}`}>
                                {nutrients.iron ?? 0} mg
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Calcium (Ca)</span>
                              <span className={`font-semibold ${(nutrients.calcium ?? 0) > 50 ? 'text-amber-800' : 'text-gray-800'}`}>
                                {nutrients.calcium ?? 0} mg
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Potassium (K)</span>
                              <span className="font-semibold text-gray-800">
                                {nutrients.potassium ?? 0} mg
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Sodium (Na)</span>
                              <span className="font-semibold text-gray-800">
                                {nutrients.sodium ?? 0} mg
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Magnesium</span>
                              <span className="font-semibold text-gray-800">
                                {nutrients.magnesium ?? 0} mg
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Zinc (Zn)</span>
                              <span className="font-semibold text-gray-800">
                                {nutrients.zinc ?? 0} mg
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Vitamin C</span>
                              <span className={`font-semibold ${(nutrients.vitamin_c ?? 0) > 10 ? 'text-green-700' : 'text-gray-800'}`}>
                                {nutrients.vitamin_c ?? 0} mg
                              </span>
                            </div>

                            <div className="bg-white p-1.5 rounded-lg border border-gray-100 flex flex-col">
                              <span className="text-[10px] text-gray-400">Sat. Fat</span>
                              <span className="font-semibold text-gray-800">
                                {nutrients.saturated_fat ?? 0} g
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Quick Log Modal */}
      {logModalFood && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Quick Log to Diary</span>
                <h3 className="text-xl font-bold text-gray-900">{logModalFood.name}</h3>
                {logModalFood.name_local && (
                  <p className="text-sm font-medium text-orange-600">{logModalFood.name_local}</p>
                )}
              </div>
              <button
                onClick={() => setLogModalFood(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {loggingSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-14 h-14 bg-green-100 text-primary rounded-full flex items-center justify-center mx-auto text-2xl">
                  <Check size={28} />
                </div>
                <p className="font-bold text-gray-800 text-lg">Logged Successfully!</p>
                <p className="text-xs text-gray-500">Added to your {logMealType} diary.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmLog} className="space-y-4">
                {/* Date and Meal Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Meal Period</label>
                    <select
                      className="input-field text-sm bg-gray-50"
                      value={logMealType}
                      onChange={(e) => setLogMealType(e.target.value)}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      className="input-field text-sm bg-gray-50"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      className="input-field text-base font-bold bg-gray-50"
                      value={logQuantity}
                      onChange={(e) => setLogQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Unit</label>
                    <select
                      className="input-field text-sm bg-gray-50"
                      value={logUnit}
                      onChange={(e) => setLogUnit(e.target.value)}
                    >
                      <option value="g">Grams (g)</option>
                      {logModalFood.serving_unit && logModalFood.serving_unit !== 'g' && (
                        <option value={logModalFood.serving_unit}>
                          1 {logModalFood.serving_unit.charAt(0).toUpperCase() + logModalFood.serving_unit.slice(1)} ({logModalFood.serving_unit_weight_g}g)
                        </option>
                      )}
                      <option value="cup">Cup (~150g)</option>
                      <option value="tbsp">Tablespoon (15g)</option>
                      <option value="tsp">Teaspoon (5g)</option>
                      <option value="ml">Milliliters (ml)</option>
                    </select>
                  </div>
                </div>

                {/* Calculated Live Calories */}
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Total Nutrition for this entry:</span>
                  <span className="text-sm font-black text-emerald-900">
                    {(() => {
                      const qty = parseFloat(logQuantity) || 0;
                      let grams = qty;
                      if (logUnit === logModalFood.serving_unit && logModalFood.serving_unit_weight_g) {
                        grams = qty * logModalFood.serving_unit_weight_g;
                      } else if (logUnit === 'cup') {
                        grams = qty * 150;
                      } else if (logUnit === 'tbsp') {
                        grams = qty * 15;
                      } else if (logUnit === 'tsp') {
                        grams = qty * 5;
                      }
                      const cal = Math.round(((logModalFood.calories || 0) * grams) / 100);
                      const pro = (((logModalFood.protein || 0) * grams) / 100).toFixed(1);
                      return `${cal} kcal • ${pro}g Protein (${Math.round(grams)}g)`;
                    })()}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLogModalFood(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loggingLoading}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-md shadow-green-900/10"
                  >
                    {loggingLoading ? 'Logging...' : '+ Add to Diary'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodList;
