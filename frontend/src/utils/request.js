import { api } from "./api";

export const request = {
  get: async (url, params = {}) => {
    const response = await api.get(url, { params });
    return response.data;
  },
  post: async (url, data = {}) => {
    const response = await api.post(url, data);
    return response.data;
  },
  put: async (url, data = {}) => {
    const response = await api.put(url, data);
    return response.data;
  },
  delete: async (url) => {
    const response = await api.delete(url);
    return response.data;
  },
};
