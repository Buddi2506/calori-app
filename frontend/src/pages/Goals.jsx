import React, { useState, useEffect } from 'react';
import { getGoals, updateGoals } from '../api/goals';

const GOAL_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', section: 'energy' },
  { key: 'protein', label: 'Protein', unit: 'g', section: 'macro' },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g', section: 'macro' },
  { key: 'fat', label: 'Fat', unit: 'g', section: 'macro' },
  { key: 'fiber', label: 'Fiber', unit: 'g', section: 'macro' },
  { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g', section: 'macro' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', section: 'micro' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', section: 'micro' },
  { key: 'iron', label: 'Iron', unit: 'mg', section: 'micro' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', section: 'micro' },
  { key: 'vitamin_c', label: 'Vitamin C', unit: 'mg', section: 'micro' },
  { key: 'vitamin_d', label: 'Vitamin D', unit: 'mcg', section: 'micro' },
  { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'mcg', section: 'micro' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', section: 'micro' },
  { key: 'zinc', label: 'Zinc', unit: 'mg', section: 'micro' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', section: 'micro' },
];

const DEFAULTS = {
  calories: 2000, protein: 50, carbohydrates: 250, fat: 65, fiber: 30,
  saturated_fat: 20, sodium: 2300, potassium: 3500, iron: 18, calcium: 1000,
  vitamin_c: 90, vitamin_d: 20, vitamin_b12: 2.4, magnesium: 420, zinc: 11, cholesterol: 300,
};

const Goals = () => {
  const [goals, setGoals] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await getGoals();
        if (data) {
          // Strip non-goal fields (id, updated_at) before setting state
          const cleaned = {};
          GOAL_FIELDS.forEach(f => {
            cleaned[f.key] = data[f.key] ?? DEFAULTS[f.key];
          });
          setGoals(cleaned);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoals(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Only send known goal fields — strip id, updated_at, etc.
      const payload = {};
      GOAL_FIELDS.forEach(f => { payload[f.key] = goals[f.key]; });
      await updateGoals(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const energy = GOAL_FIELDS.filter(f => f.section === 'energy');
  const macros = GOAL_FIELDS.filter(f => f.section === 'macro');
  const micros = GOAL_FIELDS.filter(f => f.section === 'micro');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">🎯 Nutrition Goals</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Set your personalized daily targets across all macro & micronutrients.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary min-w-[130px] self-start sm:self-auto ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Saving...
            </span>
          ) : saved ? '✅ Saved!' : 'Save Goals'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Energy */}
      <div className="zentra-card p-6 md:p-8">
        <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
          <span>⚡</span> Energy Target
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {energy.map(f => (
            <GoalInput key={f.key} field={f} value={goals[f.key]} onChange={handleChange} />
          ))}
        </div>
      </div>

      {/* Macronutrients */}
      <div className="zentra-card p-6 md:p-8">
        <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
          <span>🥩</span> Macronutrients
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {macros.map(f => (
            <GoalInput key={f.key} field={f} value={goals[f.key]} onChange={handleChange} />
          ))}
        </div>
      </div>

      {/* Micronutrients */}
      <div className="zentra-card p-6 md:p-8">
        <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
          <span>💊</span> Micronutrients & Minerals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {micros.map(f => (
            <GoalInput key={f.key} field={f} value={goals[f.key]} onChange={handleChange} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6 font-medium">
          * Targets are aligned with Indian Council of Medical Research (ICMR-NIN) and WHO recommended daily allowances (RDA).
        </p>
      </div>

      {/* Save button at bottom */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary min-w-[150px] ${saving ? 'opacity-70' : ''}`}
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Goals'}
        </button>
      </div>
    </div>
  );
};

const GoalInput = ({ field, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-gray-700">
      {field.label}
      <span className="text-gray-400 font-normal ml-1">({field.unit})</span>
    </label>
    <input
      type="number"
      name={field.key}
      value={value}
      min="0"
      step="any"
      onChange={onChange}
      className="w-full bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-2xs"
    />
  </div>
);

export default Goals;
