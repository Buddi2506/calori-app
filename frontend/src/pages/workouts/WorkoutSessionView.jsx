import React, { useState, useEffect, useMemo } from 'react';
import { Plus, HeartPulse, Check, RotateCcw, Trash2 } from 'lucide-react';
import ExerciseLog from './ExerciseLog';
import ExercisePicker from '../../components/workouts/ExercisePicker';
import ExerciseInfoModal from '../../components/workouts/ExerciseInfoModal';
import { getWorkout, getLastSets, updateWorkout, deleteWorkout } from '../../api/workouts';
import { formatDuration, bodyPartForName } from '../../utils/workouts';

const RECORD_LABELS = { weight: 'heaviest weight', est_1rm: 'best estimated max', reps: 'most reps', hold: 'longest hold' };

// Exercises to show: the plan's (in plan order) with whatever was logged for them,
// then anything else logged, then exercises added just now that have no sets yet.
const buildEntries = (session, plan, added) => {
  const groups = new Map(session.exercises.map((g) => [g.exercise.id, g]));
  const planned = (plan?.exercises || []).map((item) => ({
    exercise: item.exercise, plan: item, sets: groups.get(item.exercise.id)?.sets || [],
  }));
  const plannedIds = new Set(planned.map((e) => e.exercise.id));
  const unplanned = session.exercises
    .filter((g) => !plannedIds.has(g.exercise.id))
    .map((g) => ({ exercise: g.exercise, plan: null, sets: g.sets }));
  const shownIds = new Set([...plannedIds, ...unplanned.map((e) => e.exercise.id)]);
  const fresh = added.filter((ex) => !shownIds.has(ex.id)).map((ex) => ({ exercise: ex, plan: null, sets: [] }));
  return [...planned, ...unplanned, ...fresh];
};

const totals = (session) => {
  let sets = 0, volume = 0, cardioSeconds = 0;
  session.exercises.forEach((g) => g.sets.forEach((s) => {
    if (g.exercise.kind === 'cardio') cardioSeconds += s.duration_seconds || 0;
    else if (s.set_type === 'working') {
      sets += 1;
      volume += (s.weight_kg || 0) * (s.reps || 0);
    }
  }));
  return { sets, volume: Math.round(volume), cardioSeconds };
};

// One workout: its exercises, adding exercises or cardio, notes, and finishing.
const WorkoutSessionView = ({ initialSession, plan, openPicker, onDeleted, onToast }) => {
  const [session, setSession] = useState(initialSession);
  const [added, setAdded] = useState([]);
  const [last, setLast] = useState({});
  const [picker, setPicker] = useState(openPicker || null); // 'exercise' | 'cardio' | null
  const [info, setInfo] = useState(null);
  const [notes, setNotes] = useState(initialSession.notes || '');

  const finished = Boolean(session.finished_at);
  const allEntries = useMemo(() => buildEntries(session, plan, added), [session, plan, added]);
  // A finished workout shows only what was done; planned exercises left empty count as skipped
  const entries = finished ? allEntries.filter((e) => e.sets.length) : allEntries;
  const skipped = allEntries.length - entries.length;
  const idsKey = entries.map((e) => e.exercise.id).join(',');

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').map(Number) : [];
    getLastSets(ids, session.id).then(setLast).catch(() => setLast({}));
  }, [idsKey, session.id]);

  const reload = async () => setSession(await getWorkout(session.id));

  const handleSetLogged = async (saved, exercise) => {
    if (saved.records?.length) {
      onToast(`New PR on ${exercise.name}: ${saved.records.map((r) => RECORD_LABELS[r] || r).join(' and ')}`);
    }
    await reload();
  };

  // Records are worked out by the server, so editing or deleting a set can change them; reload.
  const handleSetChanged = () => reload();

  const saveNotes = async () => {
    if ((session.notes || '') === notes) return;
    setSession(await updateWorkout(session.id, { notes: notes.trim() || null }));
  };

  const setFinished = async (value) => {
    // Send the notes too, in case they were typed just before tapping Finish
    setSession(await updateWorkout(session.id, { finished: value, notes: notes.trim() || null }));
    if (value) onToast(`${session.name} finished`);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${session.name} workout and all its sets?`)) return;
    await deleteWorkout(session.id);
    onDeleted(session.id);
  };

  const t = totals(session);
  const summary = [
    t.sets ? `${t.sets} working ${t.sets === 1 ? 'set' : 'sets'}` : null,
    t.volume ? `${t.volume.toLocaleString()} kg volume` : null,
    t.cardioSeconds ? `${formatDuration(t.cardioSeconds)} cardio` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            {session.name}
            {finished && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <Check size={13} /> Finished
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600">{summary || 'Nothing logged yet'}</p>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="zentra-card p-8 text-center text-sm text-gray-500">
          Add an exercise or some cardio to start logging.
        </div>
      )}

      {entries.map((entry) => (
        <ExerciseLog
          key={entry.exercise.id}
          entry={entry}
          sessionId={session.id}
          last={last[entry.exercise.id]}
          finished={finished}
          onSetLogged={handleSetLogged}
          onSetChanged={handleSetChanged}
          onInfo={() => setInfo(entry.exercise)}
        />
      ))}

      {finished && skipped > 0 && (
        <p className="text-sm text-gray-500 -mt-1">
          {skipped} planned {skipped === 1 ? 'exercise' : 'exercises'} skipped
        </p>
      )}

      {!finished && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setPicker('exercise')} className="btn-secondary h-12 text-sm flex items-center justify-center gap-2">
            <Plus size={17} /> Add exercise
          </button>
          <button onClick={() => setPicker('cardio')} className="btn-secondary h-12 text-sm flex items-center justify-center gap-2">
            <HeartPulse size={17} /> Add cardio
          </button>
        </div>
      )}

      <section className="zentra-card p-5 flex flex-col gap-3">
        <label htmlFor={`notes-${session.id}`} className="text-sm font-bold text-gray-600">Notes</label>
        <textarea
          id={`notes-${session.id}`}
          rows={2}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="How did it feel? Anything to change next time?"
          className="input-field text-sm resize-y"
        />
        <div className="flex flex-wrap items-center gap-2">
          {finished ? (
            <button onClick={() => setFinished(false)} className="btn-secondary h-11 text-sm flex items-center gap-2">
              <RotateCcw size={16} /> Reopen to edit
            </button>
          ) : (
            <button onClick={() => setFinished(true)} disabled={!session.exercises.length} className="btn-primary h-11 flex items-center gap-2">
              <Check size={17} /> Finish workout
            </button>
          )}
          <button onClick={handleDelete} className="ml-auto h-11 px-3 rounded-full text-sm font-bold text-gray-500 hover:text-rose-600 flex items-center gap-1.5">
            <Trash2 size={15} /> Delete workout
          </button>
        </div>
      </section>

      {picker && (
        <ExercisePicker
          title={picker === 'cardio' ? 'Add cardio' : 'Add exercise'}
          cardioOnly={picker === 'cardio'}
          initialPart={bodyPartForName(session.name)}
          excludeIds={entries.map((e) => e.exercise.id)}
          onClose={() => setPicker(null)}
          onPick={(exercise) => {
            setAdded((a) => [...a, exercise]);
            setPicker(null);
          }}
        />
      )}
      {info && <ExerciseInfoModal exercise={info} onClose={() => setInfo(null)} />}
    </div>
  );
};

export default WorkoutSessionView;
