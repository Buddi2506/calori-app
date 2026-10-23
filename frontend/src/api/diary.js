import client from './client';

export const getDiary = async (date) => {
  const { data } = await client.get(`/diary/${date}`);
  return data;
};

export const addDiaryEntry = async (entryData) => {
  const { data } = await client.post('/diary/entries', entryData);
  return data;
};

// The backend reads the new amount from query parameters, not the body.
export const updateDiaryEntry = async (id, { quantity_display, quantity_unit }) => {
  const { data } = await client.put(`/diary/entries/${id}`, null, {
    params: { quantity_display, quantity_unit },
  });
  return data;
};

export const deleteDiaryEntry = async (id) => {
  const { data } = await client.delete(`/diary/entries/${id}`);
  return data;
};

export const getRecentFoods = async (limit = 8) => {
  const { data } = await client.get('/diary/recent-foods', { params: { limit } });
  return data;
};
