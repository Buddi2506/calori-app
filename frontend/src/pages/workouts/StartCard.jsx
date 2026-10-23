import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Play, HeartPulse, Plus, Settings2, Moon } from 'lucide-react';
import MuscleMap from '../../components/workouts/MuscleMap';
import Segmented from '../../components/ui/Segmented';
import { getLastSets } from '../../api/workouts';
import { formatSet, formatTarget } from '../../utils/workouts';

// Before a workout starts: pick the split day (the next one in rotation is preselected),
// see the plan with last time's numbers, then start. Also the way in for cardio-only days.
// On a rest day it shows a rest card first, with the option to train anyway.
const StartCard = ({ split: fullSplit, suggestedDayId, nextTrainingDayId, isToday, onStart, starting }) => {
  const split = fullSplit.filter((d) => !d.is_rest);
  const suggested = fullSplit.find((d) => d.id === suggestedDayId);
  const restDay = Boolean(suggested?.is_rest);
  const [trainAnyway, setTrainAnyway] = useState(false);
  const firstPick = restDay ? nextTrainingDayId : suggestedDayId;
  const [dayId, setDayId] = useState(firstPick ?? split[0]?.id ?? null);
  const [last, setLast] = useState({});
  const day = split.find((d) => d.id === dayId);

  useEffect(() => {
    const ids = (day?.exercises || []).map((e) => e.exercise.id);
    getLastSets(ids).then(setLast).catch(() => setLast({}));
  }, [day]);

  if (restDay && !trainAnyway) {
    const next = split.find((d) => d.id === nextTrainingDayId);
    return (
      <section className="zentra-card p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0" aria-hidden="true">
            <Moon size={22} />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{isToday ? 'Today' : 'This day'} · in your rotation</span>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Rest day</h2>
            <p className="text-sm text-gray-500 mt-1">
              Recovery is when muscles grow. {next ? <>Next up: <span className="font-bold text-gray-900">{next.name}</span>.</> : null}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onStart({ cardio: true })} disabled={starting} className="btn-secondary h-11 text-sm flex items-center gap-2">
            <HeartPulse size={17} /> Light cardio
          </button>
          <button onClick={() => setTrainAnyway(true)} className="btn-secondary h-11 text-sm flex items-center gap-2">
            <Play size={16} /> Train anyway
          </button>
        </div>
      </section>
    );
  }

  if (!split.length) {
    return (
      <section className="zentra-card p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Set up your split first</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tell Calori your workout days, like Push, Pull and Legs, and what you do on each.
            Then it suggests the next day every time you train.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/workouts/split" className="btn-primary h-11 flex items-center gap-2"><Settings2 size={17} /> Set up split</Link>
          <button onClick={() => onStart({ cardio: true })} disabled={starting} className="btn-secondary h-11 text-sm flex items-center gap-2">
            <HeartPulse size={17} /> Just cardio
          </button>
          <button onClick={() => onStart({})} disabled={starting} className="btn-secondary h-11 text-sm flex items-center gap-2">
            <Plus size={17} /> Workout without a plan
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="zentra-card p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {isToday ? 'Today' : 'This day'}{dayId === firstPick ? (restDay ? ' · next after your rest day' : ' · next in your rotation') : ''}
          </span>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">{day?.name}</h2>
        </div>
        {split.length > 1 && (
          <div className="overflow-x-auto max-w-full">
            <Segmented label="Split day" value={dayId} onChange={setDayId} options={split.map((d) => ({ id: d.id, label: d.name }))} className="w-max" />
          </div>
        )}
      </div>

      {day?.exercises.length ? (
        <ul className="flex flex-col">
          {day.exercises.map((item) => {
            const prev = last[item.exercise.id];
            const working = prev?.sets.filter((s) => s.set_type === 'working') || [];
            return (
              <li key={item.id} className="flex items-center gap-3 py-2.5 border-t border-gray-100 first:border-t-0">
                <span className="w-12 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <MuscleMap primary={item.exercise.primary_muscles} secondary={item.exercise.secondary_muscles} className="w-10 h-9" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-gray-900 truncate">{item.exercise.name}</span>
                  <span className="block text-xs text-gray-500 truncate">
                    {working.length
                      ? `Last ${format(parseISO(prev.date), 'd MMM')}: ${working.map((s) => formatSet(s, item.exercise.kind)).join(', ')}`
                      : 'First time'}
                  </span>
                </span>
                <span className="text-xs font-bold text-gray-600 shrink-0">{formatTarget(item)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">
          No exercises planned for {day?.name}. <Link to="/workouts/split" className="font-bold text-amber-400">Add some</Link>, or start and add them as you go.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => onStart({ dayId })} disabled={starting} className="btn-primary h-12 px-6 flex items-center gap-2">
          <Play size={17} /> {starting ? 'Starting…' : `Start ${day?.name}`}
        </button>
        <button onClick={() => onStart({ cardio: true })} disabled={starting} className="btn-secondary h-12 text-sm flex items-center gap-2">
          <HeartPulse size={17} /> Just cardio
        </button>
      </div>
    </section>
  );
};

export default StartCard;
