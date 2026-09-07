import client from './client';

export const getDiary = async (date) => {
  const { data } = await client.get(`/diary/${date}`);
  return data;
};

export const addDiaryEntry = async (entryData) => {
  const { data } = await client.post('/diary/entries', entryData);
  return data;
};

export const updateDiaryEntry = async (id, updateData) => {
  const { data } = await client.put(`/diary/entries/${id}`, updateData);
  return data;
};

export const deleteDiaryEntry = async (id) => {
  const { data } = await client.delete(`/diary/entries/${id}`);
  return data;
};
