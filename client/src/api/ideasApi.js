import axiosClient from './axiosClient';

export const listIdeas = (params) => axiosClient.get('/ideas', { params });
export const getIdea = (id) => axiosClient.get(`/ideas/${id}`);
export const createDraft = (data) => axiosClient.post('/ideas', data);
export const updateIdea = (id, data) => axiosClient.put(`/ideas/${id}`, data);
export const submitForReview = (id) => axiosClient.post(`/ideas/${id}/submit`);
export const checkDuplicates = (id) => axiosClient.get(`/ideas/${id}/duplicates`);

export const uploadAttachments = (id, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return axiosClient.post(`/ideas/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Attachments require auth, so a plain <a href> won't carry the JWT — fetch as a
// blob (through the same interceptor that attaches the token) and trigger the
// browser's save dialog manually.
export const downloadAttachment = async (ideaId, storedName, originalName) => {
  const response = await axiosClient.get(`/ideas/${ideaId}/attachments/${storedName}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const forwardToEvaluation = (id) => axiosClient.post(`/ideas/${id}/screen/forward`);
export const requestCompletion = (id, note) => axiosClient.post(`/ideas/${id}/screen/request-completion`, { note });

export const submitEvaluation = (id, payload) => axiosClient.post(`/ideas/${id}/evaluation`, payload);
export const getEvaluation = (id) => axiosClient.get(`/ideas/${id}/evaluation`);

export const makeDecision = (id, payload) => axiosClient.post(`/ideas/${id}/decision`, payload);
export const getDecision = (id) => axiosClient.get(`/ideas/${id}/decision`);

export const assignExecution = (id, payload) => axiosClient.post(`/ideas/${id}/execution`, payload);
export const getExecution = (id) => axiosClient.get(`/ideas/${id}/execution`);
export const addProgressUpdate = (id, note) => axiosClient.post(`/ideas/${id}/execution/progress`, { note });
export const completeExecution = (id, finalReport) => axiosClient.post(`/ideas/${id}/execution/complete`, { finalReport });

export const closeIdea = (id) => axiosClient.post(`/ideas/${id}/close`);
