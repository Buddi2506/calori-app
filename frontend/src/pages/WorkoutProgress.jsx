import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Search, ChevronRight, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import Segmented from '../components/ui/Segmented';
import WorkoutTabs from '../components/workouts/WorkoutTabs';
import MuscleMap from '../components/workouts/MuscleMap';
import ProgressGuide from '../components/workouts/ProgressGuide';
import { getProgressSummary, getExercisesDone, getSplit } from '../api/workouts';
import { formatDuration, formatPace, workoutColor } from '../utils/workouts';

const RANGES = [{ id: 4, label: '4 weeks' }, { id: 8, label: '8 weeks' }, { id: 12, label: '12 weeks' }];
const AXIS = { fontSize: 12, fill: '#8E8E98' };
const TOOLTIP = {
  contentStyle: { background: '#11141B', border: '1px solid #1F2430', borderRadius: 12, color: '#F2F4F8' },
  itemStyle: { color: '#F2F4F8' },
  labelStyle: { color: '#A1A1AA', fontWeight: 700 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

// The record worth showing in a list, by how the exercise is logged.
export const headlineRecord = (kind, records) => {
  if (!records) return null;
  if (kind === 'cardio') {
    const parts = [
      records.longest_distance_km && `${records.longest_distance_km.value} km`,
      records.best_pace_min_per_km && formatPace(records.best_pace_min_per_km.value),
      !records.longest_distance_km && records.longest_minutes && `${Math.round(records.longest_minutes.value)} min`,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  }
  if (kind === 'timed') return records.longest_hold_seconds ? `${formatDuration(records.longest_hold_seconds.value)} hold` : null;
  if (records.heaviest_kg?.value) {
    return `${records.heaviest_kg.value} kg${records.best_est_1rm_kg ? ` · est. max ${Math.round(records.best_est_1rm_kg.value)} kg` : ''}`;
  }
  return records.most_reps ? `${records.most_reps.value} reps` : null;
};

// Sets and workouts for the hovered week.
const WeekTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP.contentStyle} className="px-3 py-2 text-sm">
      <div className="font-bold text-gray-600">Week of {label}</div>
      <div>{d.Sets} sets · {d.Workouts} {d.Workouts === 1 ? 'workout' : 'workouts'}</div>
    </div>
  );
};

const Card = ({ title, note, children, className = '' }) => (
  <section className={`zentra-card p-5 sm:p-6 flex flex-col gap-4 ${className}`}>
    <div>
      <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
      {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
    </div>
    {children}
  </section>
);

// Training over recent weeks, muscles worked, and every exercise with its records.
const WorkoutProgress = () => {
  const [weeks, setWeeks] = useState(8);
  const [summary, setSummary] = useState(null);
  const [exercises, setExercises] = useState(null);
  const [splitNames, setSplitNames] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getExercisesDone().then(setExercises).catch(() => setExercises([]));
    getSplit().then((s) => setSplitNames(s.filter((d) => !d.is_rest).map((d) => d.name))).catch(() => {});
  }, []);

  useEffect(() => {
    setSummary(null);
    getProgressSummary(weeks).then(setSummary).catch(() => setSummary({ weeks: [], by_split_day: [], muscle_sets: {} }));
  }, [weeks]);

  const chartData = (summary?.weeks || []).map((w) => ({
    week: format(parseISO(w.week_start), 'd MMM'),
    Workouts: w.workouts,
    Sets: w.working_sets,
    'Cardio min': Math.round(w.cardio_minutes),
  }));
  const muscles = Object.entries(summary?.muscle_sets || {});
  const maxSets = Math.max(1, ...muscles.map(([, n]) => n));
  const intensity = Object.fromEntries(muscles.map(([m, n]) => [m, n / maxSets]));
  const hasCardio = chartData.some((d) => d['Cardio min'] > 0);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (exercises || []).filter((e) => !q || e.exercise.name.toLowerCase().includes(q));
  }, [exercises, query]);

  return (
    <div className="flex flex-col gap-5">
      <WorkoutTabs />
      <PageHeader eyebrow="Workouts" title="Progress" subtitle="How your training is adding up">
        <ProgressGuide />
        <Segmented label="Time range" options={RANGES} value={weeks} onChange={setWeeks} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Working sets per week">
          {summary && !chartData.some((d) => d.Sets > 0) ? (
            <p className="text-sm text-gray-500">No strength sets logged in these weeks.</p>
          ) : summary ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2430" vertical={false} />
                <XAxis dataKey="week" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                <Tooltip {...TOOLTIP} content={<WeekTooltip />} />
                <Bar dataKey="Sets" fill="#D4FF24" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] animate-pulse rounded-2xl bg-gray-50" />}
        </Card>

        <Card title="Cardio minutes per week">
          {summary ? (
            hasCardio ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2430" vertical={false} />
                  <XAxis dataKey="week" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                  <Tooltip {...TOOLTIP} />
                  <Bar dataKey="Cardio min" fill="#1558C9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-500">No cardio logged in these weeks.</p>
          ) : <div className="h-[220px] animate-pulse rounded-2xl bg-gray-50" />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
        <Card title="Muscles worked" note={`Working sets where it was a main muscle, last ${weeks} weeks`}>
          {muscles.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] gap-5 items-center">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 flex justify-center">
                <MuscleMap intensity={intensity} label="Heat map of muscles worked" className="w-48 h-44" />
              </div>
              <ul className="flex flex-col gap-2">
                {muscles.map(([m, n]) => (
                  <li key={m} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-gray-700 capitalize">{m}</span>
                    <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(n / maxSets) * 100}%` }} />
                    </span>
                    <span className="w-8 text-right font-bold text-gray-900">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{summary ? 'No strength sets logged in these weeks.' : 'Loading…'}</p>
          )}
        </Card>

        <Card title="Workouts by day" note={`Last ${weeks} weeks`}>
          {summary?.by_split_day?.length ? (
            <ul className="flex flex-col gap-2">
              {summary.by_split_day.map((d) => (
                <li key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: workoutColor(d.name, splitNames) }} />
                  <span className="flex-1 text-gray-800">{d.name}</span>
                  <span className="font-bold text-gray-900">{d.workouts}×</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{summary ? 'No workouts in these weeks.' : 'Loading…'}</p>
          )}
        </Card>
      </div>

      <Card title="Exercises" note="Tap one for its charts and personal records">
        {exercises && exercises.length > 6 && (
          <div className="flex items-center gap-3 h-11 px-4 rounded-2xl bg-[#080A0F] border border-gray-200 focus-within:border-amber-400">
            <Search size={16} className="text-gray-600" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search your exercises"
              placeholder="Find an exercise" className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500" />
          </div>
        )}
        {exercises === null ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : exercises.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing logged yet. <Link to="/workouts" className="font-bold text-amber-400">Log a workout</Link> and your exercises show up here.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {shown.map((e) => {
              const best = headlineRecord(e.exercise.kind, e.records);
              return (
                <li key={e.exercise.id}>
                  <Link to={`/workouts/progress/${e.exercise.id}`} className="flex items-center gap-3 py-3 border-t border-gray-100 group">
                    <span className="w-12 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <MuscleMap primary={e.exercise.primary_muscles} secondary={e.exercise.secondary_muscles} className="w-10 h-9" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-gray-900 group-hover:text-amber-400 truncate">{e.exercise.name}</span>
                      <span className="block text-xs text-gray-500 truncate">
                        {e.workouts} {e.workouts === 1 ? 'workout' : 'workouts'} · last {format(parseISO(e.last_date), 'd MMM')}
                      </span>
                    </span>
                    {best && (
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-900 shrink-0">
                        <Trophy size={13} className="text-amber-400" aria-label="Best" /> {best}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-500 shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default WorkoutProgress;
