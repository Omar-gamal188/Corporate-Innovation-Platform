import axiosClient from './axiosClient';

export const listUsers = () => axiosClient.get('/users');
export const createUser = (data) => axiosClient.post('/users', data);
export const updateUser = (id, data) => axiosClient.put(`/users/${id}`, data);
export const unlockUser = (id) => axiosClient.post(`/users/${id}/unlock`);
export const changeOwnPassword = (currentPassword, newPassword) =>
  axiosClient.put('/users/me/password', { currentPassword, newPassword });
