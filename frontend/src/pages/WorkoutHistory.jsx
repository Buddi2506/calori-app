import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, endOfMonth } from 'date-fns';
import { Check } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import WorkoutTabs from '../components/workouts/WorkoutTabs';
import { PeriodNav } from './reports/shared';
import { listWorkouts, getSplit } from '../api/workouts';
import { formatApiDate } from '../utils/formatters';
import { workoutColor, CARDIO_COLOR, OTHER_COLOR, VOLUME_EXPLANATION } from '../utils/workouts';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const summaryLine = (w) => [
  w.exercise_count ? `${w.exercise_count} ${w.exercise_count === 1 ? 'exercise' : 'exercises'}` : null,
  w.working_sets ? `${w.working_sets} sets` : null,
  w.volume_kg ? `${Math.round(w.volume_kg).toLocaleString()} kg volume` : null,
  w.cardio_minutes ? `${Math.round(w.cardio_minutes)} min cardio` : null,
].filter(Boolean).join(' · ') || 'Nothing logged';

// Month calendar of workouts, coloured by split day, plus the month's totals and a list.
const WorkoutHistory = () => {
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [workouts, setWorkouts] = useState(null);
  const [splitNames, setSplitNames] = useState([]);

  useEffect(() => {
    getSplit().then((s) => setSplitNames(s.filter((d) => !d.is_rest).map((d) => d.name))).catch(() => {});
  }, []);

  useEffect(() => {
    setWorkouts(null);
    listWorkouts(formatApiDate(month), formatApiDate(endOfMonth(month)))
      .then(setWorkouts)
      .catch(() => setWorkouts([]));
  }, [month]);

  const shift = (delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const isCurrent = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  const byDate = {};
  (workouts || []).forEach((w) => { (byDate[w.date] = byDate[w.date] || []).push(w); });
  const days = endOfMonth(month).getDate();
  const leading = (month.getDay() + 6) % 7; // Monday first
  const today = formatApiDate(now);
  const totals = (workouts || []).reduce((t, w) => ({
    days: t.days,
    sets: t.sets + w.working_sets,
    volume: t.volume + w.volume_kg,
    cardio: t.cardio + w.cardio_minutes,
  }), { days: Object.keys(byDate).length, sets: 0, volume: 0, cardio: 0 });

  const legend = [
    ...splitNames.map((n) => ({ name: n, color: workoutColor(n, splitNames) })),
    { name: 'Cardio', color: CARDIO_COLOR },
    { name: 'Other', color: OTHER_COLOR },
  ];

  return (
    <div className="flex flex-col gap-5">
      <WorkoutTabs />
      <PageHeader eyebrow="Workouts" title="History" subtitle="Every workout you've logged, by month" />

      <PeriodNav
        label={format(month, 'MMMM yyyy')}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onReset={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))}
        resetLabel="This month"
        atLatest={isCurrent}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Days trained" value={workouts ? totals.days : '–'} accent="stripe-amber" />
        <StatCard label="Working sets" value={workouts ? totals.sets : '–'} accent="stripe-green" />
        <StatCard label="Volume" value={workouts ? Math.round(totals.volume).toLocaleString() : '–'} unit="kg"
          note="Weight × reps, all working sets" title={VOLUME_EXPLANATION} accent="stripe-blue" />
        <StatCard label="Cardio" value={workouts ? Math.round(totals.cardio) : '–'} unit="min" accent="stripe-pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
        <section className="zentra-card p-5 sm:p-6 flex flex-col gap-3">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAYS.map((d) => <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>)}
          </div>
          <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label={`Workouts in ${format(month, 'MMMM yyyy')}`}>
            {Array.from({ length: leading }).map((_, i) => <li key={`b${i}`} aria-hidden="true" />)}
            {Array.from({ length: days }).map((_, i) => {
              const date = formatApiDate(new Date(month.getFullYear(), month.getMonth(), i + 1));
              const list = byDate[date] || [];
              const future = date > today;
              return (
                <li key={date}>
                  <Link
                    to={`/workouts/${date}`}
                    aria-label={`${format(parseISO(date), 'd MMMM')}: ${list.length ? list.map((w) => w.name).join(', ') : 'no workout'}`}
                    className={`min-h-[52px] sm:min-h-[64px] rounded-xl p-1 sm:p-1.5 flex flex-col gap-1 ring-1 ring-inset transition-colors ${
                      list.length ? 'bg-gray-50 ring-gray-200 hover:ring-amber-400' : 'ring-gray-100 hover:ring-gray-300'
                    } ${future ? 'opacity-40 pointer-events-none' : ''} ${date === today ? '!ring-2 !ring-amber-400' : ''}`}
                  >
                    <span className={`text-[11px] font-bold ${list.length ? 'text-gray-900' : 'text-gray-500'}`}>{i + 1}</span>
                    {list.map((w) => (
                      <span
                        key={w.id}
                        className="h-1.5 sm:h-auto sm:px-1.5 sm:py-0.5 rounded-full sm:rounded-md text-[10px] font-bold text-[#0B0C10] truncate"
                        style={{ background: workoutColor(w.name, splitNames) }}
                      >
                        <span className="hidden sm:inline">{w.name}</span>
                      </span>
                    ))}
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {legend.map((l) => (
              <span key={l.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />{l.name}
              </span>
            ))}
          </div>
        </section>

        <section className="zentra-card p-5 sm:p-6 flex flex-col gap-1">
          <h2 className="text-base font-extrabold text-gray-900 mb-2">Workouts</h2>
          {workouts === null ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : workouts.length === 0 ? (
            <p className="text-sm text-gray-500">No workouts in {format(month, 'MMMM')}.</p>
          ) : (
            <ul className="flex flex-col">
              {[...workouts].reverse().map((w) => (
                <li key={w.id}>
                  <Link to={`/workouts/${w.date}`} className="flex items-center gap-3 py-2.5 border-t border-gray-100 first:border-t-0 group">
                    <span className="w-1.5 h-9 rounded-full shrink-0" style={{ background: workoutColor(w.name, splitNames) }} aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-gray-900 group-hover:text-amber-400">
                        {w.name} <span className="font-normal text-gray-500">· {format(parseISO(w.date), 'EEE d MMM')}</span>
                      </span>
                      <span className="block text-xs text-gray-500 truncate">{summaryLine(w)}</span>
                    </span>
                    {w.finished && <Check size={16} className="text-emerald-700 shrink-0" aria-label="Finished" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default WorkoutHistory;
