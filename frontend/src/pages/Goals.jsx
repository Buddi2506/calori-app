import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { getGoals, updateGoals } from '../api/goals';
import PageHeader from '../components/ui/PageHeader';
import MacroSplitBar from '../components/ui/MacroSplitBar';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const GOAL_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', section: 'energy' },
  { key: 'protein', label: 'Protein', unit: 'g', section: 'macro', dot: 'stripe-green' },
  { key: 'carbohydrates', label: 'Carbs', unit: 'g', section: 'macro', dot: 'stripe-blue' },
  { key: 'fat', label: 'Fat', unit: 'g', section: 'macro', dot: 'stripe-pink' },
  { key: 'fiber', label: 'Fiber', unit: 'g', section: 'macro', dot: 'stripe-amber' },
  { key: 'saturated_fat', label: 'Saturated fat', unit: 'g', section: 'limit' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', section: 'limit' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', section: 'limit' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', section: 'micro' },
  { key: 'iron', label: 'Iron', unit: 'mg', section: 'micro' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', section: 'micro' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', section: 'micro' },
  { key: 'zinc', label: 'Zinc', unit: 'mg', section: 'micro' },
  { key: 'vitamin_c', label: 'Vitamin C', unit: 'mg', section: 'micro' },
  { key: 'vitamin_d', label: 'Vitamin D', unit: 'mcg', section: 'micro' },
  { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'mcg', section: 'micro' },
];

const DEFAULTS = {
  calories: 2000, protein: 50, carbohydrates: 250, fat: 65, fiber: 30,
  saturated_fat: 20, sodium: 2300, potassium: 3500, iron: 18, calcium: 1000,
  vitamin_c: 90, vitamin_d: 20, vitamin_b12: 2.4, magnesium: 420, zinc: 11, cholesterol: 300,
};

const fieldsIn = (section) => GOAL_FIELDS.filter((f) => f.section === section);

// Number input with its unit shown inside the box.
const GoalInput = ({ field, value, onChange, large }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={`goal-${field.key}`} className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
      {field.dot && <span className={`w-2 h-2 rounded-full ${field.dot}`} aria-hidden="true" />}
      {field.label}
    </label>
    <div className="flex items-center rounded-2xl bg-[#080A0F] border border-gray-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 transition-colors">
      <input
        id={`goal-${field.key}`}
        type="number"
        name={field.key}
        value={value}
        min="0"
        step="any"
        onChange={onChange}
        className={`flex-1 min-w-0 bg-transparent outline-none px-4 font-bold text-gray-900 ${large ? 'h-14 text-3xl font-black' : 'h-11 text-base'}`}
      />
      <span className="pr-4 text-sm text-gray-500">{field.unit}</span>
    </div>
  </div>
);

const Section = ({ title, note, children }) => (
  <section className="zentra-card p-6 flex flex-col gap-5">
    <div>
      <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
      {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
    </div>
    {children}
  </section>
);

// How the protein / carbs / fat goals add up against the calorie goal.
const MacroCheck = ({ goals }) => {
  const fromMacros = Math.round((goals.protein || 0) * 4 + (goals.carbohydrates || 0) * 4 + (goals.fat || 0) * 9);
  const diff = fromMacros - (goals.calories || 0);
  const close = Math.abs(diff) <= (goals.calories || 0) * 0.05;
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-gray-600">
          Your macros add up to <span className="font-extrabold text-gray-900">{fromMacros.toLocaleString()} kcal</span>
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${close ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
          {close
            ? 'Matches your calorie goal'
            : `${Math.abs(diff).toLocaleString()} kcal ${diff > 0 ? 'over' : 'under'} your calorie goal`}
        </span>
      </div>
      <MacroSplitBar nutrients={goals} className="h-2" />
      <p className="text-xs text-gray-500">Protein and carbs count 4 kcal per gram, fat 9 kcal.</p>
    </div>
  );
};

const Goals = () => {
  const [goals, setGoals] = useState(DEFAULTS);
  const [savedGoals, setSavedGoals] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await getGoals();
        if (data) {
          // Keep only goal fields (drop id, updated_at)
          const cleaned = Object.fromEntries(GOAL_FIELDS.map((f) => [f.key, data[f.key] ?? DEFAULTS[f.key]]));
          setGoals(cleaned);
          setSavedGoals(cleaned);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const dirty = GOAL_FIELDS.some((f) => goals[f.key] !== savedGoals[f.key]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoals((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = Object.fromEntries(GOAL_FIELDS.map((f) => [f.key, goals[f.key]]));
      await updateGoals(payload);
      setSavedGoals(payload);
      showToast('Goals saved');
    } catch (err) {
      console.error(err);
      setError('Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveButton = (
    <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary h-11 min-w-[130px] flex items-center justify-center gap-2">
      <Check size={17} /> {saving ? 'Saving…' : dirty ? 'Save goals' : 'Saved'}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <Toast message={toast} />

      <PageHeader
        eyebrow="Goals"
        title="Daily goals"
        subtitle="Used by your Overview, Diary and Reports"
      >
        {dirty && <span className="text-xs font-bold text-amber-400">Unsaved changes</span>}
        {saveButton}
      </PageHeader>

      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="zentra-card h-64 animate-pulse" aria-label="Loading goals" />
      ) : (
        <>
          <Section title="Energy and macros">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5">
              <GoalInput field={fieldsIn('energy')[0]} value={goals.calories} onChange={handleChange} large />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fieldsIn('macro').map((f) => (
                  <GoalInput key={f.key} field={f} value={goals[f.key]} onChange={handleChange} />
                ))}
              </div>
            </div>
            <MacroCheck goals={goals} />
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5 items-start">
            <Section title="Daily limits" note="Try to stay under these">
              <div className="grid grid-cols-1 gap-3">
                {fieldsIn('limit').map((f) => (
                  <GoalInput key={f.key} field={f} value={goals[f.key]} onChange={handleChange} />
                ))}
              </div>
            </Section>

            <Section title="Vitamins and minerals" note="Defaults follow ICMR-NIN and WHO recommended daily allowances">
              <div className="grid grid-cols-2 gap-3">
                {fieldsIn('micro').map((f) => (
                  <GoalInput key={f.key} field={f} value={goals[f.key]} onChange={handleChange} />
                ))}
              </div>
            </Section>
          </div>

          <div className="flex justify-end">{saveButton}</div>
        </>
      )}
    </div>
  );
};

export default Goals;
