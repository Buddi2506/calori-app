import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Trophy } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import Segmented from '../components/ui/Segmented';
import MuscleMap from '../components/workouts/MuscleMap';
import ProgressGuide from '../components/workouts/ProgressGuide';
import { getExerciseProgress } from '../api/workouts';
import { CATEGORY_LABELS, formatDuration, formatPace, VOLUME_EXPLANATION } from '../utils/workouts';

const RANGES = [{ id: 90, label: '3M' }, { id: 180, label: '6M' }, { id: 365, label: '1Y' }, { id: 3650, label: 'All' }];
const AXIS = { fontSize: 12, fill: '#8E8E98' };
const TOOLTIP = {
  contentStyle: { background: '#1A1B21', border: '1px solid #2A2C34', borderRadius: 12, color: '#F4F4F5' },
  itemStyle: { color: '#F4F4F5' },
  labelStyle: { color: '#A1A1AA', fontWeight: 700 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

// Which records to show, and how, for each way of logging.
const RECORD_CARDS = {
  strength: [
    { key: 'heaviest_kg', label: 'Heaviest weight', show: (v) => `${v} kg` },
    { key: 'best_est_1rm_kg', label: 'Best estimated max', show: (v) => `${Math.round(v)} kg`, note: 'One-rep max worked out from your sets' },
    { key: 'best_volume_kg', label: 'Best volume', show: (v) => `${Math.round(v).toLocaleString()} kg`, note: 'Most in one workout (weight × reps, added up)' },
    { key: 'most_reps', label: 'Most reps in a set', show: (v) => `${v}` },
  ],
  timed: [{ key: 'longest_hold_seconds', label: 'Longest hold', show: (v) => formatDuration(v) }],
  cardio: [
    { key: 'longest_minutes', label: 'Longest session', show: (v) => `${Math.round(v)} min` },
    { key: 'longest_distance_km', label: 'Longest distance', show: (v) => `${v} km` },
    { key: 'best_pace_min_per_km', label: 'Best pace', show: (v) => formatPace(v) },
  ],
};

const ChartCard = ({ title, note, children }) => (
  <section className="zentra-card p-5 sm:p-6 flex flex-col gap-3">
    <div>
      <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
      {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
    </div>
    <ResponsiveContainer width="100%" height={240}>{children}</ResponsiveContainer>
  </section>
);

const axes = (unit) => [
  <CartesianGrid key="g" strokeDasharray="3 3" stroke="#2A2C34" vertical={false} />,
  <XAxis key="x" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />,
  <YAxis key="y" tick={AXIS} axisLine={false} tickLine={false} width={44} unit={unit} domain={['auto', 'auto']} />,
  <Tooltip key="t" {...TOOLTIP} />,
];

// What one workout looked like for this exercise, as a line of text.
const sessionLine = (kind, p) => {
  if (kind === 'cardio') return [`${Math.round(p.minutes)} min`, p.distance_km && `${p.distance_km} km`, formatPace(p.pace_min_per_km)].filter(Boolean).join(' · ');
  if (kind === 'timed') return `Best ${formatDuration(p.best_seconds)} · ${p.sets} ${p.sets === 1 ? 'set' : 'sets'}`;
  const top = p.top_weight_kg ? `${p.top_weight_kg} kg × ${p.top_reps}` : `${p.max_reps} reps`;
  return `Top ${top} · ${p.sets} sets${p.volume_kg ? ` · ${Math.round(p.volume_kg).toLocaleString()} kg volume` : ''}`;
};

// Charts and personal records for one exercise.
const ExerciseProgress = () => {
  const { exerciseId } = useParams();
  const [days, setDays] = useState(365);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    getExerciseProgress(exerciseId, days).then(setData).catch(() => setError('Could not load this exercise.'));
  }, [exerciseId, days]);

  const ex = data?.exercise;
  const kind = ex?.kind;
  const points = (data?.points || []).map((p) => ({ ...p, label: format(parseISO(p.date), 'd MMM') }));
  const cards = kind ? RECORD_CARDS[kind].filter((c) => data.records[c.key]) : [];

  return (
    <div className="flex flex-col gap-5">
      <Link to="/workouts/progress" className="self-start -mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Progress
      </Link>

      {error && <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}

      {!data ? (
        !error && <div className="zentra-card h-64 animate-pulse" aria-label="Loading" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <span className="w-20 h-[4.5rem] rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
              <MuscleMap primary={ex.primary_muscles} secondary={ex.secondary_muscles} className="w-[4.5rem] h-16" />
            </span>
            <div className="flex-1 min-w-[200px]">
              <PageHeader
                eyebrow={`${CATEGORY_LABELS[ex.category]} · ${ex.primary_muscles.join(', ')}`}
                title={ex.name}
                subtitle={`${points.length} ${points.length === 1 ? 'workout' : 'workouts'} in this period`}
              >
                <ProgressGuide />
                <Segmented label="Time range" options={RANGES} value={days} onChange={setDays} />
              </PageHeader>
            </div>
          </div>

          {cards.length > 0 && (
            <div className={`grid grid-cols-2 ${cards.length >= 4 ? 'lg:grid-cols-4' : cards.length === 3 ? 'lg:grid-cols-3' : ''} gap-4`}>
              {cards.map((c) => {
                const r = data.records[c.key];
                return (
                  <section key={c.key} className="zentra-card p-5 flex flex-col gap-1.5">
                    <h2 className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                      <Trophy size={14} className="text-amber-400" aria-hidden="true" /> {c.label}
                    </h2>
                    <span className="text-3xl font-black tracking-tight text-gray-900">{c.show(r.value)}</span>
                    <span className="text-xs text-gray-500">
                      <Link to={`/workouts/${r.date}`} className="hover:text-gray-900">{format(parseISO(r.date), 'd MMM yyyy')}</Link>
                      {c.note && <> · {c.note}</>}
                    </span>
                  </section>
                );
              })}
            </div>
          )}

          {points.length === 0 ? (
            <div className="zentra-card p-10 text-center text-sm text-gray-500">
              No workouts with this exercise in this period. Try a longer range.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {kind === 'strength' && (
                <>
                  <ChartCard title="Strength over time">
                    <LineChart data={points}>
                      {axes(' kg')}
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="est_1rm_kg" name="Estimated max" stroke="#FBBF24" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="top_weight_kg" name="Heaviest set" stroke="#60A5FA" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartCard>
                  <ChartCard title="Volume per workout" note={VOLUME_EXPLANATION}>
                    <BarChart data={points}>
                      {axes(' kg')}
                      <Bar dataKey="volume_kg" name="Volume" fill="#34D399" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartCard>
                </>
              )}
              {kind === 'timed' && (
                <ChartCard title="Longest hold per workout">
                  <BarChart data={points}>
                    {axes(' s')}
                    <Bar dataKey="best_seconds" name="Seconds" fill="#FBBF24" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartCard>
              )}
              {kind === 'cardio' && (
                <>
                  <ChartCard title="Minutes per session">
                    <BarChart data={points}>
                      {axes(' min')}
                      <Bar dataKey="minutes" name="Minutes" fill="#22D3EE" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartCard>
                  {points.some((p) => p.pace_min_per_km) && (
                    <ChartCard title="Pace (lower is faster)">
                      <LineChart data={points}>
                        {axes('')}
                        <Line type="monotone" dataKey="pace_min_per_km" name="Min per km" stroke="#FBBF24" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                      </LineChart>
                    </ChartCard>
                  )}
                </>
              )}
            </div>
          )}

          {points.length > 0 && (
            <section className="zentra-card p-5 sm:p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-2">Workouts</h2>
              <ul className="flex flex-col">
                {[...points].reverse().map((p) => (
                  <li key={p.session_id}>
                    <Link to={`/workouts/${p.date}`} className="flex items-center gap-3 py-2.5 border-t border-gray-100 first:border-t-0 group">
                      <span className="w-24 shrink-0 text-sm font-bold text-gray-900 group-hover:text-amber-400">{format(parseISO(p.date), 'EEE d MMM')}</span>
                      <span className="flex-1 min-w-0 text-sm text-gray-600 truncate">{sessionLine(kind, p)}</span>
                      {kind === 'strength' && p.est_1rm_kg && <span className="text-xs text-gray-500 shrink-0">est. max {Math.round(p.est_1rm_kg)} kg</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ExerciseProgress;
