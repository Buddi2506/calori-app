import client from './client';

export const getDailyReport = async (date) => {
  const { data } = await client.get(`/reports/daily/${date}`);
  return data;
};

export const getWeeklyReport = async (startDate) => {
  const { data } = await client.get(`/reports/weekly?start_date=${startDate}`);
  return data;
};

export const getMonthlyReport = async (year, month) => {
  const { data } = await client.get(`/reports/monthly?year=${year}&month=${month}`);
  return data;
};
