import client from './client';

export const searchFoods = async (query, limit = 20) => {
  const { data } = await client.get(`/foods/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return data;
};

export const getFoodById = async (id) => {
  const { data } = await client.get(`/foods/${id}`);
  return data;
};

export const createCustomFood = async (foodData) => {
  const { data } = await client.post('/foods/custom', foodData);
  return data;
};

export const getFoodLibrary = async (params = {}) => {
  const { data } = await client.get('/foods/library', { params });
  return data;
};
