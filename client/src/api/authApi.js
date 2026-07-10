import axiosClient from './axiosClient';

export const login = (username, password) => axiosClient.post('/auth/login', { username, password });

export const getMe = () => axiosClient.get('/auth/me');
