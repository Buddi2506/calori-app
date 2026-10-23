// Formatting and starter templates for workout tracking.

export const CATEGORY_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core', cardio: 'Cardio' };
export const KIND_LABELS = { strength: 'Weight × reps', timed: 'Timed hold', cardio: 'Cardio' };

const trim = (n) => Number((Math.round((n || 0) * 100) / 100).toFixed(2));

// 1:05:30 / 20:00 / 0:45
export const formatDuration = (seconds) => {
  const s = Math.round(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

// One set as text: "80 kg × 8", "Bodyweight × 12", "1:00 hold", "20:00 · 3.2 km · level 6"
export const formatSet = (set, kind) => {
  if (kind === 'cardio') {
    return [
      formatDuration(set.duration_seconds),
      set.distance_km ? `${trim(set.distance_km)} km` : null,
      set.level != null ? `level ${trim(set.level)}` : null,
    ].filter(Boolean).join(' · ');
  }
  if (kind === 'timed') {
    return `${formatDuration(set.duration_seconds)} hold${set.weight_kg ? ` + ${trim(set.weight_kg)} kg` : ''}`;
  }
  return `${set.weight_kg ? `${trim(set.weight_kg)} kg` : 'Bodyweight'} × ${set.reps}`;
};

// "3 × 8–12", "3 × 10", "3 sets"
export const formatTarget = (item) => {
  if (!item?.target_sets) return null;
  const { target_sets: sets, target_reps_min: min, target_reps_max: max } = item;
  if (min && max && min !== max) return `${sets} × ${min}–${max}`;
  if (min || max) return `${sets} × ${min || max}`;
  return `${sets} sets`;
};

export const musclesLabel = (exercise) =>
  (exercise.primary_muscles || []).join(', ') || CATEGORY_LABELS[exercise.category] || '';

const ex = (name, sets = 3, min = 8, max = 12) => ({ name, target_sets: sets, target_reps_min: min, target_reps_max: max });
const timed = (name, sets = 3) => ({ name, target_sets: sets, target_reps_min: null, target_reps_max: null });

const PUSH = [
  ex('Barbell Bench Press', 4, 6, 10), ex('Incline Dumbbell Press'), ex('Seated Dumbbell Shoulder Press'),
  ex('Dumbbell Lateral Raise', 3, 12, 15), ex('Triceps Pushdown (Rope)', 3, 10, 15), ex('Overhead Cable Triceps Extension', 3, 10, 15),
];
const PULL = [
  ex('Lat Pulldown (Wide Grip)'), ex('Seated Cable Row'), ex('One-Arm Dumbbell Row'),
  ex('Face Pull', 3, 12, 15), ex('Barbell Curl'), ex('Hammer Curl', 3, 10, 12),
];
const LEGS = [
  ex('Barbell Back Squat', 4, 6, 10), ex('Leg Press', 3, 10, 12), ex('Romanian Deadlift'),
  ex('Leg Extension', 3, 12, 15), ex('Lying Leg Curl', 3, 10, 12), ex('Standing Calf Raise', 4, 12, 15),
];
const ABS = [ex('Hanging Leg Raise', 3, 10, 15), ex('Cable Crunch', 3, 12, 15), timed('Plank'), ex('Russian Twist', 3, 20, 30)];

// Starter splits; exercise names must match the built-in list.
export const SPLIT_TEMPLATES = [
  { id: 'ppl-abs', label: 'Push · Pull · Legs & Abs', days: [
    { name: 'Push', exercises: PUSH }, { name: 'Pull', exercises: PULL },
    { name: 'Legs & Abs', exercises: [...LEGS.slice(0, 5), ...ABS.slice(0, 3)] },
  ] },
  { id: 'ppla', label: 'Push · Pull · Legs · Abs', days: [
    { name: 'Push', exercises: PUSH }, { name: 'Pull', exercises: PULL },
    { name: 'Legs', exercises: LEGS }, { name: 'Abs', exercises: ABS },
  ] },
  { id: 'upper-lower', label: 'Upper · Lower', days: [
    { name: 'Upper', exercises: [ex('Barbell Bench Press', 4, 6, 10), ex('Barbell Bent-Over Row'), ex('Overhead Barbell Press'),
      ex('Lat Pulldown (Wide Grip)'), ex('Dumbbell Curl'), ex('Triceps Pushdown (Bar)')] },
    { name: 'Lower', exercises: [ex('Barbell Back Squat', 4, 6, 10), ex('Romanian Deadlift'), ex('Leg Press'),
      ex('Seated Leg Curl'), ex('Standing Calf Raise', 4, 12, 15), timed('Plank')] },
  ] },
  { id: 'full-body', label: 'Full body', days: [
    { name: 'Full body', exercises: [ex('Barbell Back Squat', 3, 6, 10), ex('Barbell Bench Press', 3, 6, 10),
      ex('Seated Cable Row'), ex('Overhead Barbell Press'), timed('Plank')] },
  ] },
];

// Readable message from a failed API call (FastAPI validation errors come back as a list).
export const apiErrorMessage = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg?.replace(/^Value error, /, '')).join(' ');
  return detail || fallback;
};
