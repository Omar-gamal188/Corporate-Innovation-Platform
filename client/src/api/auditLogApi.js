import axiosClient from './axiosClient';

export const listAuditLog = (params) => axiosClient.get('/audit-log', { params });
