import axios from "axios";

export const api = axios.create({
  baseURL: "https://api.kingcreativestudio.my.id/mfa-puskesmas/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mfk_token");
  const userStr = localStorage.getItem("mfk_user");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) {
        config.headers["x-user-id"] = user.id;
      }
    } catch (e) {
      // ignore
    }
  }
  return config;
});

