import client from './client';

export const getMeals = async () => {
  const { data } = await client.get('/meals/');
  return data;
};

export const createMeal = async (mealData) => {
  const { data } = await client.post('/meals/', mealData);
  return data;
};

export const getMealById = async (id) => {
  const { data } = await client.get(`/meals/${id}`);
  return data;
};

export const updateMeal = async (id, mealData) => {
  const { data } = await client.put(`/meals/${id}`, mealData);
  return data;
};

export const deleteMeal = async (id) => {
  const { data } = await client.delete(`/meals/${id}`);
  return data;
};

export const logMeal = async (id, date, mealType) => {
  const { data } = await client.post(`/meals/${id}/log?date=${date}&meal_type=${mealType}`);
  return data;
};
