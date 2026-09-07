import client from './client';

export const authApi = {
  login: async (username_or_email, password) => {
    const res = await client.post('/auth/login', {
      username_or_email,
      password,
    });
    return res.data;
  },

  getMe: async () => {
    const res = await client.get('/auth/me');
    return res.data;
  },

  changePassword: async (new_password, old_password = null) => {
    const payload = { new_password };
    if (old_password) {
      payload.old_password = old_password;
    }
    const res = await client.post('/auth/change-password', payload);
    return res.data;
  },
};

export default authApi;
