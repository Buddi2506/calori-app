// Formatting and starter templates for workout tracking.

export const CATEGORY_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core', cardio: 'Cardio' };

// Body parts for browsing exercises, by the muscles each one covers. Cardio is matched by kind.
export const BODY_PARTS = [
  { id: 'chest', label: 'Chest', muscles: ['chest'] },
  { id: 'back', label: 'Back', muscles: ['lats', 'middle back', 'lower back', 'traps'] },
  { id: 'shoulders', label: 'Shoulders', muscles: ['shoulders'] },
  { id: 'arms', label: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
  { id: 'legs', label: 'Legs', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'] },
  { id: 'core', label: 'Core', muscles: ['abdominals'] },
  { id: 'cardio', label: 'Cardio' },
];

// Whether an exercise belongs to a body part (by its main muscles).
export const inBodyPart = (exercise, partId) => {
  if (partId === 'all') return true;
  if (partId === 'cardio') return exercise.kind === 'cardio';
  if (exercise.kind === 'cardio') return false;
  const part = BODY_PARTS.find((p) => p.id === partId);
  return (exercise.primary_muscles || []).some((m) => part?.muscles.includes(m));
};

// Body part a split day is probably about, from its name ("Back & Biceps" → back).
const NAME_HINTS = [
  ['chest', ['chest', 'pec', 'push']],
  ['back', ['back', 'lat', 'pull']],
  ['shoulders', ['shoulder', 'delt']],
  ['arms', ['arm', 'bicep', 'tricep']],
  ['legs', ['leg', 'quad', 'hamstring', 'glute', 'calf', 'calves', 'lower']],
  ['core', ['abs', 'core']],
  ['cardio', ['cardio', 'run']],
];
export const bodyPartForName = (name = '') => {
  const n = name.toLowerCase();
  let best = 'all';
  let at = Infinity;
  // The earliest mention wins, so "Chest & Triceps" opens on chest
  NAME_HINTS.forEach(([part, words]) => words.forEach((w) => {
    const i = n.indexOf(w);
    if (i >= 0 && i < at) { at = i; best = part; }
  }));
  return best;
};
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

// How training volume is worked out, shown next to volume numbers.
export const VOLUME_EXPLANATION = "Weight × reps for every working set, added up. Warm-ups, holds and cardio don't count.";

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

const CHEST = [
  ex('Barbell Bench Press', 4, 6, 10), ex('Incline Dumbbell Press'), ex('Machine Chest Press'),
  ex('Cable Crossover', 3, 12, 15), ex('Pec Deck Fly', 3, 12, 15), ex('Chest Dip'),
];
const BACK = [
  ex('Deadlift', 3, 5, 8), ex('Lat Pulldown (Wide Grip)'), ex('Barbell Bent-Over Row'),
  ex('Seated Cable Row'), ex('Straight-Arm Pulldown', 3, 12, 15), ex('Back Extension (Hyperextension)', 3, 12, 15),
];
const SHOULDERS = [
  ex('Overhead Barbell Press', 4, 6, 10), ex('Seated Dumbbell Shoulder Press'), ex('Dumbbell Lateral Raise', 4, 12, 15),
  ex('Cable Lateral Raise', 3, 12, 15), ex('Reverse Pec Deck', 3, 12, 15), ex('Dumbbell Shrug', 3, 10, 15),
];
const ARMS = [
  ex('Barbell Curl'), ex('Close-Grip Bench Press', 3, 6, 10), ex('Hammer Curl'),
  ex('Skull Crusher (EZ Bar)'), ex('Preacher Curl (EZ Bar)'), ex('Triceps Pushdown (Rope)', 3, 10, 15),
];

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
  { id: 'bro-split', label: 'Body part (5 days)', days: [
    { name: 'Chest', exercises: CHEST }, { name: 'Back', exercises: BACK }, { name: 'Shoulders', exercises: SHOULDERS },
    { name: 'Legs', exercises: LEGS }, { name: 'Arms', exercises: ARMS },
  ] },
  { id: 'body-part-pairs', label: 'Body part pairs (4 days)', days: [
    { name: 'Chest & Triceps', exercises: [ex('Barbell Bench Press', 4, 6, 10), ex('Incline Dumbbell Press'), ex('Cable Crossover', 3, 12, 15),
      ex('Close-Grip Bench Press', 3, 6, 10), ex('Triceps Pushdown (Rope)', 3, 10, 15), ex('Overhead Cable Triceps Extension', 3, 10, 15)] },
    { name: 'Back & Biceps', exercises: [ex('Lat Pulldown (Wide Grip)'), ex('Barbell Bent-Over Row'), ex('Seated Cable Row'),
      ex('Barbell Curl'), ex('Hammer Curl'), ex('Incline Dumbbell Curl')] },
    { name: 'Legs', exercises: LEGS },
    { name: 'Shoulders & Abs', exercises: [ex('Overhead Barbell Press', 4, 6, 10), ex('Dumbbell Lateral Raise', 4, 12, 15), ex('Face Pull', 3, 12, 15),
      ex('Hanging Leg Raise', 3, 10, 15), ex('Cable Crunch', 3, 12, 15), timed('Plank')] },
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

// "6:00 /km" from minutes per km
export const formatPace = (minPerKm) => {
  if (!minPerKm) return null;
  const total = Math.round(minPerKm * 60);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} /km`;
};

const DAY_COLORS = ['#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#FB923C', '#2DD4BF'];
export const CARDIO_COLOR = '#22D3EE';
export const OTHER_COLOR = '#8B8F9A';

// Colour for a workout by name: split days in rotation order, then cardio and anything else.
export const workoutColor = (name, splitNames = []) => {
  const i = splitNames.indexOf(name);
  if (i >= 0) return DAY_COLORS[i % DAY_COLORS.length];
  return name === 'Cardio' ? CARDIO_COLOR : OTHER_COLOR;
};
