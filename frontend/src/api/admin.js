import client from './client';

export const adminApi = {
  getUsers: async () => {
    const res = await client.get('/admin/users');
    return res.data;
  },

  createUser: async (userData) => {
    const res = await client.post('/admin/users', userData);
    return res.data;
  },

  updateUser: async (userId, updateData) => {
    const res = await client.put(`/admin/users/${userId}`, updateData);
    return res.data;
  },

  deleteUser: async (userId) => {
    const res = await client.delete(`/admin/users/${userId}`);
    return res.data;
  },

  getUserDiary: async (userId, date) => {
    const res = await client.get(`/admin/users/${userId}/diary`, {
      params: { date },
    });
    return res.data;
  },
};

export default adminApi;
