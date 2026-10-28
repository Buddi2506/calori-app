import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, ChevronUp, ChevronDown, Trash2, ArrowLeft, Moon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import MuscleMap from '../components/workouts/MuscleMap';
import ExercisePicker from '../components/workouts/ExercisePicker';
import ExerciseInfoModal from '../components/workouts/ExerciseInfoModal';
import { getSplit, saveSplit, getExercises } from '../api/workouts';
import { SPLIT_TEMPLATES, bodyPartForName, apiErrorMessage } from '../utils/workouts';

let nextKey = 1;
const key = () => nextKey++;

const fromServer = (days) => days.map((d) => ({
  key: key(),
  id: d.id,
  name: d.name,
  is_rest: d.is_rest,
  exercises: d.exercises.map((item) => ({
    key: key(),
    exercise: item.exercise,
    target_sets: item.target_sets,
    target_reps_min: item.target_reps_min,
    target_reps_max: item.target_reps_max,
  })),
}));

const toPayload = (days) => days.map((d) => (d.is_rest ? { ...(d.id ? { id: d.id } : {}), is_rest: true, name: 'Rest', exercises: [] } : {
  ...(d.id ? { id: d.id } : {}),
  name: d.name.trim(),
  exercises: d.exercises.map((e) => ({
    exercise_id: e.exercise.id,
    target_sets: e.target_sets || null,
    target_reps_min: e.target_reps_min || null,
    target_reps_max: e.target_reps_max || null,
  })),
}));

const restDay = () => ({ key: key(), name: 'Rest', is_rest: true, exercises: [] });

const move = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const NumberBox = ({ label, value, onChange, width = 'w-14' }) => (
  <input
    type="number"
    inputMode="numeric"
    min="1"
    aria-label={label}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10) || 1))}
    className={`${width} h-9 rounded-xl bg-[#080A0F] border border-gray-200 text-center text-sm font-bold text-gray-900 focus:outline-none focus:border-amber-400`}
  />
);

const IconButton = ({ label, onClick, disabled, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`p-1.5 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:hover:bg-transparent transition-colors ${danger ? 'hover:text-rose-600' : 'hover:text-gray-900'}`}
  >
    {children}
  </button>
);

const ExerciseRow = ({ item, index, count, onChange, onMove, onRemove, onInfo }) => {
  const isStrength = item.exercise.kind === 'strength';
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 border-t border-gray-100 first:border-t-0">
      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <button type="button" onClick={onInfo} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
          <span className="w-12 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
            <MuscleMap primary={item.exercise.primary_muscles} secondary={item.exercise.secondary_muscles} className="w-10 h-9" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gray-900 group-hover:text-amber-400 truncate">{item.exercise.name}</span>
            <span className="block text-xs text-gray-500 truncate">{item.exercise.primary_muscles.join(', ')}</span>
          </span>
        </button>
        <div className="flex items-center shrink-0">
          <IconButton label="Move up" onClick={() => onMove(index - 1)} disabled={index === 0}><ChevronUp size={16} /></IconButton>
          <IconButton label="Move down" onClick={() => onMove(index + 1)} disabled={index === count - 1}><ChevronDown size={16} /></IconButton>
          <IconButton label={`Remove ${item.exercise.name}`} onClick={onRemove} danger><Trash2 size={15} /></IconButton>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 pl-[3.75rem] sm:pl-0">
        <NumberBox label={`Sets for ${item.exercise.name}`} value={item.target_sets} onChange={(v) => onChange({ target_sets: v })} width="w-12" />
        sets
        {isStrength && (
          <>
            <span className="mx-0.5">×</span>
            <NumberBox label={`Minimum reps for ${item.exercise.name}`} value={item.target_reps_min} onChange={(v) => onChange({ target_reps_min: v })} width="w-12" />
            –
            <NumberBox label={`Maximum reps for ${item.exercise.name}`} value={item.target_reps_max} onChange={(v) => onChange({ target_reps_max: v })} width="w-12" />
            reps
          </>
        )}
      </div>
    </li>
  );
};

// Edit the workout split: its days in rotation order and each day's planned exercises.
const WorkoutSplit = () => {
  const [days, setDays] = useState(null);
  const [savedJson, setSavedJson] = useState('[]');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(null); // day key the exercise picker is open for
  const [info, setInfo] = useState(null);
  const [restAfterRound, setRestAfterRound] = useState(true);
  const [toast, showToast] = useToast();
  const exercisesByName = useRef(null);

  useEffect(() => {
    getSplit()
      .then((data) => {
        const loaded = fromServer(data);
        setDays(loaded);
        setSavedJson(JSON.stringify(toPayload(loaded)));
      })
      .catch(() => setError('Could not load your split.'));
    getExercises().then((list) => { exercisesByName.current = new Map(list.map((e) => [e.name, e])); });
  }, []);

  const dirty = days !== null && JSON.stringify(toPayload(days)) !== savedJson;

  const updateDay = (dayKey, fn) => setDays((ds) => ds.map((d) => (d.key === dayKey ? fn(d) : d)));

  const applyTemplate = (template) => {
    if (days.length && !window.confirm(`Replace your current split with “${template.label}”?`)) return;
    const byName = exercisesByName.current || new Map();
    const trainingIds = days.filter((d) => !d.is_rest).map((d) => d.id);
    const restIds = days.filter((d) => d.is_rest).map((d) => d.id);
    const trainingDays = template.days.map((d, i) => ({
      key: key(),
      id: trainingIds[i], // reuse existing day ids so past workouts stay linked
      name: d.name,
      exercises: d.exercises
        .filter((e) => byName.has(e.name))
        .map((e) => ({ key: key(), exercise: byName.get(e.name), ...e, name: undefined })),
    }));
    setDays(restAfterRound ? [...trainingDays, { ...restDay(), id: restIds[0] }] : trainingDays);
  };

  const addDay = () => setDays((ds) => [...ds, { key: key(), name: `Day ${ds.filter((d) => !d.is_rest).length + 1}`, exercises: [] }]);
  const addRestDay = () => setDays((ds) => [...ds, restDay()]);

  const handleSave = async () => {
    const training = days.filter((d) => !d.is_rest);
    if (days.length && !training.length) return setError('Add at least one training day.');
    const names = training.map((d) => d.name.trim().toLowerCase());
    if (names.some((n) => !n)) return setError('Every day needs a name.');
    if (new Set(names).size !== names.length) return setError('Each day needs a different name.');
    const badRange = days.flatMap((d) => d.exercises).find((e) => e.target_reps_min && e.target_reps_max && e.target_reps_min > e.target_reps_max);
    if (badRange) return setError(`${badRange.exercise.name}: the first rep number should be the smaller one.`);

    setSaving(true);
    setError('');
    try {
      const saved = fromServer(await saveSplit(toPayload(days)));
      setDays(saved);
      setSavedJson(JSON.stringify(toPayload(saved)));
      showToast('Split saved');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save your split.'));
    } finally {
      setSaving(false);
    }
  };

  const pickingDay = days?.find((d) => d.key === picking);

  return (
    <div className="flex flex-col gap-5">
      <Toast message={toast} />

      <Link to="/workouts" className="self-start -mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Workouts
      </Link>

      <PageHeader
        eyebrow="Workouts"
        title="Your split"
        subtitle="Days rotate in order. Rest days pass on their own; a training day waits until you do it."
      >
        {dirty && <span className="text-xs font-bold text-amber-400">Unsaved changes</span>}
        <button onClick={handleSave} disabled={!dirty || saving || !days} className="btn-primary h-11 min-w-[120px] flex items-center justify-center gap-2">
          <Check size={17} /> {saving ? 'Saving…' : dirty ? 'Save split' : 'Saved'}
        </button>
      </PageHeader>

      {error && <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}

      {days === null ? (
        <div className="zentra-card h-48 animate-pulse" aria-label="Loading split" />
      ) : (
        <>
          {(() => {
            const templateButtons = (
              <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none self-start">
                <input type="checkbox" checked={restAfterRound} onChange={(e) => setRestAfterRound(e.target.checked)} className="w-4 h-4 accent-amber-400" />
                Add a rest day after each round
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SPLIT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="text-left p-3.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-amber-400 transition-colors"
                  >
                    <span className="block text-sm font-bold text-gray-900">{t.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {t.days.length} {t.days.length === 1 ? 'day' : 'days'}{restAfterRound ? ' + rest' : ''} · {t.days.reduce((n, d) => n + d.exercises.length, 0)} exercises
                    </span>
                  </button>
                ))}
              </div>
              </div>
            );
            // With no split yet the templates are the way in; afterwards they fold away.
            return days.length ? (
              <details className="zentra-card p-5 group">
                <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-bold text-gray-700 hover:text-gray-900">
                  Start again from a template
                  <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-3">{templateButtons}</div>
              </details>
            ) : (
              <section className="zentra-card p-5 flex flex-col gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Pick a starting point</h2>
                  <p className="text-xs text-gray-500 mt-0.5">You can change every day and exercise afterwards.</p>
                </div>
                {templateButtons}
              </section>
            );
          })()}

          {days.map((day, di) => (day.is_rest ? (
            <section key={day.key} className="rounded-[28px] border border-dashed border-gray-300 px-5 py-3.5 flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0" aria-hidden="true">
                <Moon size={16} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-base font-extrabold text-gray-900">Rest day</span>
                <span className="block text-xs text-gray-500">No training; the rotation moves on the next day</span>
              </span>
              <IconButton label="Move rest day up" onClick={() => setDays((ds) => move(ds, di, di - 1))} disabled={di === 0}><ChevronUp size={18} /></IconButton>
              <IconButton label="Move rest day down" onClick={() => setDays((ds) => move(ds, di, di + 1))} disabled={di === days.length - 1}><ChevronDown size={18} /></IconButton>
              <IconButton label="Delete rest day" danger onClick={() => setDays((ds) => ds.filter((d) => d.key !== day.key))}><Trash2 size={16} /></IconButton>
            </section>
          ) : (
            <section key={day.key} className="zentra-card p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-amber-400 text-[#030407] text-sm font-black flex items-center justify-center shrink-0">
                  {days.slice(0, di + 1).filter((d) => !d.is_rest).length}
                </span>
                <input
                  value={day.name}
                  onChange={(e) => updateDay(day.key, (d) => ({ ...d, name: e.target.value }))}
                  aria-label={`Name of day ${di + 1}`}
                  maxLength={60}
                  className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-transparent border border-transparent hover:border-gray-200 focus:border-amber-400 focus:outline-none text-lg font-extrabold text-gray-900"
                />
                <IconButton label="Move day up" onClick={() => setDays((ds) => move(ds, di, di - 1))} disabled={di === 0}><ChevronUp size={18} /></IconButton>
                <IconButton label="Move day down" onClick={() => setDays((ds) => move(ds, di, di + 1))} disabled={di === days.length - 1}><ChevronDown size={18} /></IconButton>
                <IconButton
                  label={`Delete ${day.name}`}
                  danger
                  onClick={() => {
                    if (day.exercises.length && !window.confirm(`Delete ${day.name || 'this day'}? Past workouts stay in your history.`)) return;
                    setDays((ds) => ds.filter((d) => d.key !== day.key));
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>

              {day.exercises.length > 0 ? (
                <ul className="flex flex-col">
                  {day.exercises.map((item, ei) => (
                    <ExerciseRow
                      key={item.key}
                      item={item}
                      index={ei}
                      count={day.exercises.length}
                      onInfo={() => setInfo(item.exercise)}
                      onChange={(changes) => updateDay(day.key, (d) => ({
                        ...d, exercises: d.exercises.map((x) => (x.key === item.key ? { ...x, ...changes } : x)),
                      }))}
                      onMove={(to) => updateDay(day.key, (d) => ({ ...d, exercises: move(d.exercises, ei, to) }))}
                      onRemove={() => updateDay(day.key, (d) => ({ ...d, exercises: d.exercises.filter((x) => x.key !== item.key) }))}
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-sm text-gray-500">No exercises yet.</p>
              )}

              <button onClick={() => setPicking(day.key)} className="btn-secondary h-10 text-sm flex items-center justify-center gap-2">
                <Plus size={16} /> Add exercise
              </button>
            </section>
          )))}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={addDay}
              disabled={days.length >= 14}
              className="h-12 rounded-[28px] border border-dashed border-gray-300 text-sm font-bold text-gray-700 hover:border-amber-400 hover:text-gray-900 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Plus size={17} /> Add a day
            </button>
            <button
              onClick={addRestDay}
              disabled={days.length >= 14}
              className="h-12 rounded-[28px] border border-dashed border-gray-300 text-sm font-bold text-gray-700 hover:border-amber-400 hover:text-gray-900 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Moon size={16} /> Add rest day
            </button>
          </div>
        </>
      )}

      {pickingDay && (
        <ExercisePicker
          title={`Add to ${pickingDay.name || 'this day'}`}
          initialPart={bodyPartForName(pickingDay.name)}
          excludeIds={pickingDay.exercises.map((e) => e.exercise.id)}
          onClose={() => setPicking(null)}
          onPick={(exercise) => {
            const strength = exercise.kind === 'strength';
            updateDay(pickingDay.key, (d) => ({
              ...d,
              exercises: [...d.exercises, {
                key: key(), exercise, target_sets: 3,
                target_reps_min: strength ? 8 : null, target_reps_max: strength ? 12 : null,
              }],
            }));
            setPicking(null);
          }}
        />
      )}

      {info && <ExerciseInfoModal exercise={info} onClose={() => setInfo(null)} />}
    </div>
  );
};

export default WorkoutSplit;
