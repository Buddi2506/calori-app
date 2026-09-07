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

const libraryCache = new Map();

export const getFoodLibrary = async (params = {}) => {
  const cacheKey = JSON.stringify(params);
  if (libraryCache.has(cacheKey)) {
    return libraryCache.get(cacheKey);
  }
  const { data } = await client.get('/foods/library', { params });
  libraryCache.set(cacheKey, data);
  return data;
};

export const clearFoodLibraryCache = () => {
  libraryCache.clear();
};
