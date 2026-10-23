import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import WorkoutTabs from '../components/workouts/WorkoutTabs';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import StartCard from './workouts/StartCard';
import WorkoutSessionView from './workouts/WorkoutSessionView';
import { getToday, getSplit, createWorkout } from '../api/workouts';
import { formatApiDate } from '../utils/formatters';
import { apiErrorMessage } from '../utils/workouts';

// Log a day's workout: start the suggested split day (or cardio), then log sets as you go.
const Workouts = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const currentDate = date ? parseISO(date) : new Date();
  const dateStr = formatApiDate(currentDate);
  const isToday = dateStr === formatApiDate(new Date());

  const [today, setToday] = useState(null);
  const [split, setSplit] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [openPicker, setOpenPicker] = useState(null); // opens the picker in a just-created workout
  const [toast, showToast] = useToast(4500);

  const load = useCallback(async () => {
    setError('');
    try {
      const [t, s] = await Promise.all([getToday(dateStr), getSplit()]);
      setToday(t);
      setSplit(s);
    } catch {
      setError('Could not load your workouts.');
    }
  }, [dateStr]);

  useEffect(() => {
    setToday(null);
    setOpenPicker(null);
    load();
  }, [load]);

  const goToDay = (d) => navigate(`/workouts/${formatApiDate(d)}`);

  const handleStart = async ({ dayId, cardio }) => {
    setStarting(true);
    try {
      const session = await createWorkout(
        dayId ? { date: dateStr, split_day_id: dayId } : { date: dateStr, name: cardio ? 'Cardio' : 'Workout' }
      );
      setOpenPicker(dayId ? null : cardio ? 'cardio' : 'exercise');
      setToday((t) => ({ ...t, sessions: [...t.sessions, session] }));
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not start the workout.'));
    } finally {
      setStarting(false);
    }
  };

  const sessions = today?.sessions || [];
  const planFor = (session) => split?.find((d) => d.id === session.split_day_id) || null;

  return (
    <div className="flex flex-col gap-5">
      <Toast message={toast} />
      <WorkoutTabs />

      <PageHeader
        eyebrow="Workouts"
        title={format(currentDate, 'EEEE, d MMM')}
        subtitle={
          !today ? 'Loading…'
            : sessions.length ? null // each workout below has its own heading
            : today.suggested_day ? `Up next: ${today.suggested_day.name}` : 'No workout logged'
        }
      >
        <Link to="/workouts/split" className="btn-secondary h-11 text-sm flex items-center gap-2">
          <Settings2 size={16} /> Edit split
        </Link>
        <div role="group" aria-label="Change day" className="flex gap-1.5">
          <button onClick={() => goToDay(subDays(currentDate, 1))} aria-label="Previous day"
            className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 hover:border-gray-200 flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => goToDay(new Date())} disabled={isToday}
            className="h-11 px-4 rounded-full bg-white border border-gray-100 text-[13px] font-bold text-gray-700 hover:text-gray-900 disabled:text-gray-500 disabled:cursor-default">
            Today
          </button>
          <button onClick={() => goToDay(addDays(currentDate, 1))} disabled={isToday} aria-label="Next day"
            className="w-11 h-11 rounded-full bg-white border border-gray-100 text-gray-700 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
        </div>
      </PageHeader>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between gap-3">
          {error}
          <button onClick={load} className="font-bold underline">Retry</button>
        </div>
      )}

      {!today || !split ? (
        !error && <div className="zentra-card h-56 animate-pulse" aria-label="Loading" />
      ) : sessions.length === 0 ? (
        <StartCard
          key={dateStr}
          split={split}
          suggestedDayId={today.suggested_day?.id}
          isToday={isToday}
          starting={starting}
          onStart={handleStart}
        />
      ) : (
        sessions.map((s) => (
          <WorkoutSessionView
            key={s.id}
            initialSession={s}
            plan={planFor(s)}
            openPicker={openPicker}
            onToast={showToast}
            onDeleted={(id) => setToday((t) => ({ ...t, sessions: t.sessions.filter((x) => x.id !== id) }))}
          />
        ))
      )}
    </div>
  );
};

export default Workouts;
