import axiosClient from './axiosClient';

export const listDepartments = () => axiosClient.get('/departments');
export const createDepartment = (data) => axiosClient.post('/departments', data);
