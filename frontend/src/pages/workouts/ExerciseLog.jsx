import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Pencil, Trash2, Plus, X, Trophy } from 'lucide-react';
import MuscleMap from '../../components/workouts/MuscleMap';
import { addSet, updateSet, deleteSet } from '../../api/workouts';
import { formatSet, formatTarget, formatDuration, apiErrorMessage } from '../../utils/workouts';

const num = (v) => (v === '' || v == null ? null : Number(v));
const shown = (v) => (v == null ? '' : String(Math.round(v * 100) / 100));

// Input values (strings) from a saved set, for editing.
const valuesFromSet = (set) => ({
  weight: shown(set?.weight_kg),
  reps: shown(set?.reps),
  minutes: set?.duration_seconds ? shown(set.duration_seconds / 60) : '',
  seconds: shown(set?.duration_seconds),
  km: shown(set?.distance_km),
  level: shown(set?.level),
  warmup: set?.set_type === 'warmup',
});

// Turn typed values (falling back to the suggestion shown as placeholder) into an API payload.
// Returns null when the essential number is missing.
const toPayload = (kind, values, suggestion) => {
  const pick = (k) => (values[k] !== '' ? values[k] : suggestion?.[k] ?? '');
  const base = { set_type: values.warmup ? 'warmup' : 'working' };
  if (kind === 'cardio') {
    const minutes = num(pick('minutes'));
    if (!minutes) return null;
    return { ...base, duration_seconds: Math.round(minutes * 60), distance_km: num(pick('km')), level: num(pick('level')) };
  }
  if (kind === 'timed') {
    const seconds = num(pick('seconds'));
    if (!seconds) return null;
    return { ...base, duration_seconds: Math.round(seconds), weight_kg: num(pick('weight')) };
  }
  const reps = num(pick('reps'));
  if (!reps) return null;
  return { ...base, weight_kg: num(pick('weight')), reps: Math.round(reps) };
};

const Box = ({ label, unit, value, placeholder, onChange, step = 'any', width = 'w-[4.5rem]' }) => (
  <label className="flex items-center gap-1 text-xs text-gray-500">
    <input
      type="number"
      inputMode="decimal"
      min="0"
      step={step}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${width} h-10 rounded-xl bg-[#080A0F] border border-gray-200 text-center text-[15px] font-bold text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-400`}
    />
    {unit}
  </label>
);

// The number boxes for one set, depending on how the exercise is logged.
const SetInputs = ({ kind, values, suggestion, onChange, name }) => {
  const field = (k) => ({ value: values[k], placeholder: suggestion?.[k] || '', onChange: (v) => onChange({ ...values, [k]: v }) });
  if (kind === 'cardio') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Box label={`${name} minutes`} unit="min" {...field('minutes')} />
        <Box label={`${name} distance in km`} unit="km" {...field('km')} />
        <Box label={`${name} level, speed or incline`} unit="lvl" width="w-14" {...field('level')} />
      </div>
    );
  }
  if (kind === 'timed') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Box label={`${name} seconds`} unit="sec" step="1" {...field('seconds')} />
        <Box label={`${name} added weight in kg`} unit="kg" {...field('weight')} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Box label={`${name} weight in kg`} unit="kg" {...field('weight')} />
      <span className="text-gray-500">×</span>
      <Box label={`${name} reps`} unit="reps" step="1" width="w-14" {...field('reps')} />
    </div>
  );
};

const SetNumber = ({ n, warmup, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={!onToggle}
    title={onToggle ? 'Tap to mark as warm-up' : undefined}
    aria-label={warmup ? `Set ${n}, warm-up` : `Set ${n}`}
    className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
      warmup ? 'bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-300' : 'bg-gray-100 text-gray-900'
    }`}
  >
    {warmup ? 'W' : n}
  </button>
);

// A set that's already logged: shown as text, editable in place.
const LoggedSet = ({ set, kind, sessionId, name, isPr, onChanged, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => valuesFromSet(set));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const payload = toPayload(kind, values);
    if (!payload) return;
    setBusy(true);
    try {
      const updated = await updateSet(sessionId, set.id, payload);
      setEditing(false);
      onChanged(updated);
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not save this set.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteSet(sessionId, set.id);
      onChanged(null);
    } catch {
      alert('Could not delete this set.');
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
      <SetNumber n={set.set_number} warmup={editing ? values.warmup : set.set_type === 'warmup'}
        onToggle={editing ? () => setValues((v) => ({ ...v, warmup: !v.warmup })) : null} />
      {editing ? (
        <>
          <SetInputs kind={kind} values={values} onChange={setValues} name={name} />
          <span className="flex gap-1 ml-auto">
            <button onClick={save} disabled={busy} aria-label="Save set" className="w-10 h-10 rounded-full bg-amber-400 text-[#030407] flex items-center justify-center"><Check size={18} /></button>
            <button onClick={() => { setEditing(false); setValues(valuesFromSet(set)); }} aria-label="Cancel" className="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
          </span>
        </>
      ) : (
        <>
          <span className="flex-1 min-w-0 text-[15px] font-bold text-gray-900">
            {formatSet(set, kind)}
            {isPr && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-[#030407] text-[11px] font-black align-middle">
                <Trophy size={11} /> PR
              </span>
            )}
          </span>
          <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center" aria-label="Logged"><Check size={16} /></span>
          {!disabled && (
            <span className="flex">
              <button onClick={() => setEditing(true)} aria-label={`Edit set ${set.set_number}`} className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"><Pencil size={15} /></button>
              <button onClick={remove} disabled={busy} aria-label={`Delete set ${set.set_number}`} className="p-2 rounded-full text-gray-500 hover:text-rose-600 hover:bg-gray-100"><Trash2 size={15} /></button>
            </span>
          )}
        </>
      )}
    </li>
  );
};

// A set still to do: boxes prefilled (as placeholders) from last time, and a tick to log it.
const DraftSet = ({ n, kind, suggestion, sessionId, exerciseId, name, onLogged, onRemove }) => {
  const [values, setValues] = useState(() => ({ ...valuesFromSet(null), warmup: false }));
  const [busy, setBusy] = useState(false);
  const payload = toPayload(kind, values, suggestion);

  const log = async () => {
    if (!payload) return;
    setBusy(true);
    try {
      const saved = await addSet(sessionId, { exercise_id: exerciseId, ...payload });
      onLogged(saved);
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not log this set.'));
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
      <SetNumber n={n} warmup={values.warmup} onToggle={() => setValues((v) => ({ ...v, warmup: !v.warmup }))} />
      <SetInputs kind={kind} values={values} suggestion={suggestion} onChange={setValues} name={name} />
      <span className="flex gap-1 ml-auto">
        <button
          onClick={log}
          disabled={!payload || busy}
          aria-label={`Log set ${n}`}
          className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-amber-400 hover:border-amber-400 hover:text-[#030407] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-colors"
        >
          <Check size={18} />
        </button>
        {onRemove && (
          <button onClick={onRemove} aria-label="Remove this empty set" className="w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
        )}
      </span>
    </li>
  );
};

// One exercise in a workout: its target, last time's numbers, logged sets and sets still to do.
const ExerciseLog = ({ entry, sessionId, last, finished, onSetLogged, onSetChanged, onInfo }) => {
  const { exercise, plan, sets } = entry;
  const kind = exercise.kind;
  const [extra, setExtra] = useState(0);
  const target = plan?.target_sets || 0;
  // Warm-ups don't count toward the plan, and aren't used to prefill working sets.
  const workingToday = sets.filter((s) => s.set_type === 'working');
  const lastWorking = (last?.sets || []).filter((s) => s.set_type === 'working');
  // Planned: one row per set still to do. Unplanned: always one "next set" row (cardio: only until logged).
  const base = target ? Math.max(target - workingToday.length, 0) : kind === 'cardio' && sets.length ? 0 : 1;
  const draftCount = finished ? 0 : base + extra;

  // Placeholder for the i-th row still to do: last time's matching working set, else the last
  // working set logged today, else last time's final working set
  const suggestionFor = (i) => {
    const fromLast = lastWorking[workingToday.length + i] || null;
    const source = fromLast || workingToday[workingToday.length - 1] || lastWorking[lastWorking.length - 1] || null;
    return source ? valuesFromSet(source) : null;
  };

  const lastText = last?.sets?.length
    ? `${format(parseISO(last.date), 'd MMM')}: ${last.sets.filter((s) => s.set_type === 'working').map((s) => formatSet(s, kind)).join(', ')}`
    : null;
  const cardioTotal = kind === 'cardio' && sets.length ? formatDuration(sets.reduce((t, s) => t + (s.duration_seconds || 0), 0)) : null;

  return (
    <section className="zentra-card !rounded-3xl p-4 sm:p-5 flex flex-col gap-2">
      <header className="flex items-start gap-3">
        <button onClick={onInfo} aria-label={`About ${exercise.name}`} className="w-14 h-12 rounded-xl bg-gray-50 border border-gray-100 hover:border-amber-400 flex items-center justify-center shrink-0 transition-colors">
          <MuscleMap primary={exercise.primary_muscles} secondary={exercise.secondary_muscles} className="w-12 h-11" />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={onInfo} className="text-left text-base font-extrabold text-gray-900 hover:text-amber-400 leading-snug">{exercise.name}</button>
          <p className="text-xs text-gray-500">
            {[formatTarget(plan), exercise.primary_muscles.join(', ')].filter(Boolean).join(' · ')}
          </p>
          {lastText && <p className="text-xs text-gray-600 mt-0.5"><span className="font-bold">Last time</span> {lastText}</p>}
        </div>
        {(sets.length > 0 || target > 0) && (
          <span className="text-xs font-bold text-gray-500 shrink-0 mt-1">
            {cardioTotal || (() => {
              const done = sets.filter((s) => s.set_type === 'working').length;
              return target ? `${done}/${target} sets` : `${done} ${done === 1 ? 'set' : 'sets'}`;
            })()}
          </span>
        )}
      </header>

      <ul className="flex flex-col">
        {sets.map((s) => (
          <LoggedSet
            key={s.id}
            set={s}
            kind={kind}
            name={exercise.name}
            sessionId={sessionId}
            isPr={s.records?.length > 0}
            disabled={finished}
            onChanged={onSetChanged}
          />
        ))}
        {Array.from({ length: draftCount }).map((_, i) => {
          const n = sets.length + i + 1;
          return (
            <DraftSet
              key={`draft-${n}`}
              n={n}
              kind={kind}
              name={exercise.name}
              suggestion={suggestionFor(i)}
              sessionId={sessionId}
              exerciseId={exercise.id}
              onLogged={(saved) => { if (i >= base) setExtra((x) => Math.max(0, x - 1)); onSetLogged(saved, exercise); }}
              onRemove={i >= base ? () => setExtra((x) => x - 1) : null}
            />
          );
        })}
      </ul>

      {!finished && (
        <button onClick={() => setExtra((x) => x + 1)} className="self-start h-9 px-3 -ml-1 rounded-full text-[13px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1.5">
          <Plus size={15} /> {kind === 'cardio' ? 'Add another' : 'Add set'}
        </button>
      )}
    </section>
  );
};

export default ExerciseLog;
