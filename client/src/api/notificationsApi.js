import axiosClient from './axiosClient';

export const listMyNotifications = () => axiosClient.get('/notifications');
export const markAsRead = (id) => axiosClient.put(`/notifications/${id}/read`);
export const markAllAsRead = () => axiosClient.put('/notifications/read-all');
