import client from './client';

export const getGoals = async () => {
  const { data } = await client.get('/goals/');
  return data;
};

export const updateGoals = async (goalsData) => {
  const { data } = await client.put('/goals/', goalsData);
  return data;
};
