import client from './client';

// The exercise list rarely changes, so keep it per filter until a custom exercise is added.
const exerciseCache = new Map();

export const getExercises = async (params = {}) => {
  const key = JSON.stringify(params);
  if (!exerciseCache.has(key)) {
    const { data } = await client.get('/exercises', { params });
    exerciseCache.set(key, data);
  }
  return exerciseCache.get(key);
};

export const getExerciseOptions = async () => (await client.get('/exercises/options')).data;

export const createExercise = async (exercise) => {
  const { data } = await client.post('/exercises', exercise);
  exerciseCache.clear();
  return data;
};

// { [exerciseId]: { date, session_id, sets } } for the most recent time each was done,
// leaving out `excludeSession` (the workout being logged now)
export const getLastSets = async (ids, excludeSession) => {
  if (!ids.length) return {};
  const params = { ids: ids.join(','), ...(excludeSession ? { exclude_session: excludeSession } : {}) };
  return (await client.get('/exercises/last-sets', { params })).data;
};

export const getSplit = async () => (await client.get('/workouts/split')).data;
export const saveSplit = async (days) => (await client.put('/workouts/split', { days })).data;

export const getToday = async (date) => (await client.get('/workouts/today', { params: { date } })).data;
export const listWorkouts = async (start, end) => (await client.get('/workouts', { params: { start, end } })).data;

export const createWorkout = async (workout) => (await client.post('/workouts', workout)).data;
export const getWorkout = async (id) => (await client.get(`/workouts/${id}`)).data;
export const updateWorkout = async (id, changes) => (await client.patch(`/workouts/${id}`, changes)).data;
export const deleteWorkout = async (id) => (await client.delete(`/workouts/${id}`)).data;

export const addSet = async (sessionId, set) => (await client.post(`/workouts/${sessionId}/sets`, set)).data;
export const updateSet = async (sessionId, setId, changes) =>
  (await client.patch(`/workouts/${sessionId}/sets/${setId}`, changes)).data;
export const deleteSet = async (sessionId, setId) =>
  (await client.delete(`/workouts/${sessionId}/sets/${setId}`)).data;

export const getExerciseProgress = async (exerciseId, days = 365) =>
  (await client.get(`/workouts/progress/exercise/${exerciseId}`, { params: { days } })).data;
export const getProgressSummary = async (weeks = 8) =>
  (await client.get('/workouts/progress/summary', { params: { weeks } })).data;
