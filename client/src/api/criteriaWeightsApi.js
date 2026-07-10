import axiosClient from './axiosClient';

export const getWeights = () => axiosClient.get('/criteria-weights');
export const updateWeights = (data) => axiosClient.put('/criteria-weights', data);
