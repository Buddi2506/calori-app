import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, ArrowLeft } from 'lucide-react';
import Modal, { FieldLabel } from '../ui/Modal';
import Segmented from '../ui/Segmented';
import MuscleMap from './MuscleMap';
import { getExercises, getExerciseOptions, createExercise } from '../../api/workouts';
import { CATEGORY_LABELS, KIND_LABELS, BODY_PARTS, inBodyPart, musclesLabel, apiErrorMessage } from '../../utils/workouts';

const PART_TABS = [{ id: 'all', label: 'All' }, ...BODY_PARTS.map(({ id, label }) => ({ id, label }))];
// Starting "day type" for a new exercise created while browsing a body part
const CATEGORY_FOR_PART = { chest: 'push', shoulders: 'push', arms: 'push', back: 'pull', legs: 'legs', core: 'core', cardio: 'cardio' };

// Toggle chips for picking muscles.
const MuscleChips = ({ options, value, onChange, disabled = [] }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((m) => {
      const on = value.includes(m);
      const off = disabled.includes(m);
      return (
        <button
          key={m}
          type="button"
          disabled={off}
          aria-pressed={on}
          onClick={() => onChange(on ? value.filter((x) => x !== m) : [...value, m])}
          className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors disabled:opacity-30 ${
            on ? 'pill-active border-transparent' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-amber-400'
          }`}
        >
          {m}
        </button>
      );
    })}
  </div>
);

// Form for a user's own exercise; calls onCreated with the saved exercise.
const CustomExerciseForm = ({ initialName, initialCategory, onCreated, onBack }) => {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({
    name: initialName || '',
    kind: initialCategory === 'cardio' ? 'cardio' : 'strength',
    category: initialCategory && initialCategory !== 'all' ? initialCategory : 'push',
    equipment: '',
    primary_muscles: [],
    secondary_muscles: [],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { getExerciseOptions().then(setOptions).catch(() => setOptions(null)); }, []);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onCreated(await createExercise({ ...form, name: form.name.trim(), equipment: form.equipment.trim() || null }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save this exercise.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start -ml-2 px-2 py-1 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5">
        <ArrowLeft size={16} /> Back to list
      </button>
      {error && <p role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</p>}
      <div>
        <FieldLabel htmlFor="custom-ex-name">Name</FieldLabel>
        <input id="custom-ex-name" required maxLength={120} value={form.name} onChange={(e) => set('name')(e.target.value)}
          className="input-field text-sm" placeholder="e.g. Landmine Press" autoFocus />
      </div>
      <div>
        <FieldLabel>How you log it</FieldLabel>
        <Segmented
          label="How you log it"
          value={form.kind}
          onChange={(kind) => setForm((f) => ({ ...f, kind, category: kind === 'cardio' ? 'cardio' : f.category === 'cardio' ? 'push' : f.category }))}
          options={Object.entries(KIND_LABELS).map(([id, label]) => ({ id, label }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="custom-ex-category">Day type</FieldLabel>
          <select id="custom-ex-category" value={form.category} onChange={(e) => set('category')(e.target.value)} className="input-field text-sm">
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="custom-ex-equipment">Equipment</FieldLabel>
          <input id="custom-ex-equipment" value={form.equipment} onChange={(e) => set('equipment')(e.target.value)}
            className="input-field text-sm" placeholder="e.g. cable" />
        </div>
      </div>
      {options && (
        <>
          <div>
            <FieldLabel>Main muscles</FieldLabel>
            <MuscleChips options={options.muscles} value={form.primary_muscles} onChange={set('primary_muscles')} disabled={form.secondary_muscles} />
          </div>
          <div>
            <FieldLabel>Also works (optional)</FieldLabel>
            <MuscleChips options={options.muscles} value={form.secondary_muscles} onChange={set('secondary_muscles')} disabled={form.primary_muscles} />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <MuscleMap primary={form.primary_muscles} secondary={form.secondary_muscles} className="w-16 h-14 shrink-0" />
            <span className="text-xs text-gray-500">This is how the exercise will look in your lists.</span>
          </div>
        </>
      )}
      <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary h-11">
        {saving ? 'Saving…' : 'Save and add'}
      </button>
    </form>
  );
};

// Search the exercise list and pick one, browsing by body part. `cardioOnly` limits it to cardio.
const ExercisePicker = ({ title = 'Add exercise', initialPart = 'all', cardioOnly = false, excludeIds = [], onPick, onClose }) => {
  const [all, setAll] = useState(null);
  const [query, setQuery] = useState('');
  const [part, setPart] = useState(cardioOnly ? 'cardio' : initialPart);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getExercises().then(setAll).catch(() => setAll([]));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (all || []).filter((e) =>
      !excludeIds.includes(e.id) &&
      inBodyPart(e, part) &&
      (!q || e.name.toLowerCase().includes(q) || musclesLabel(e).includes(q) || (e.equipment || '').includes(q))
    );
  }, [all, query, part, excludeIds]);

  return (
    <Modal title={creating ? 'New exercise' : title} size="lg" onClose={onClose} bodyClassName="p-0">
      {creating ? (
        <div className="p-5 sm:p-6">
          <CustomExerciseForm initialName={query} initialCategory={CATEGORY_FOR_PART[part]} onCreated={onPick} onBack={() => setCreating(false)} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="p-4 sm:px-6 flex flex-col gap-3 border-b border-gray-100">
            <div className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-[#080A0F] border border-gray-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30">
              <Search size={17} className="text-gray-600 shrink-0" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search exercises"
                placeholder="Search — lat pulldown, squat, chest…"
                className="flex-1 min-w-0 h-11 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
                autoFocus
              />
            </div>
            {!cardioOnly && (
              <div className="overflow-x-auto -mx-1 px-1">
                <Segmented label="Body part" options={PART_TABS} value={part} onChange={setPart} className="w-max" />
              </div>
            )}
          </div>

          <ul className="p-2 sm:px-4 max-h-[50vh] overflow-y-auto">
            {all === null && <li className="p-6 text-center text-sm text-gray-500">Loading exercises…</li>}
            {all && shown.length === 0 && (
              <li className="p-6 text-center text-sm text-gray-500">No exercises match{query ? ` “${query}”` : ''}.</li>
            )}
            {shown.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => onPick(e)}
                  className="w-full text-left flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-100 transition-colors group"
                >
                  <span className="w-14 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <MuscleMap primary={e.primary_muscles} secondary={e.secondary_muscles} className="w-12 h-11" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-gray-900 truncate">
                      {e.name}{e.is_custom && <span className="ml-1.5 text-[10px] font-bold text-amber-400">Yours</span>}
                    </span>
                    <span className="block text-xs text-gray-500 truncate">
                      {[e.equipment, musclesLabel(e)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-amber-400 group-hover:border-amber-400 group-hover:text-[#030407] shrink-0">
                    <Plus size={16} />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="p-4 sm:px-6 border-t border-gray-100">
            <button onClick={() => setCreating(true)} className="btn-secondary w-full h-11 text-sm flex items-center justify-center gap-2">
              <Plus size={16} /> Can't find it? Create your own
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExercisePicker;
