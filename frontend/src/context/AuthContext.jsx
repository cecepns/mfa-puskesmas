import React, { createContext, useContext, useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("mfk_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("mfk_token") || null);
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem("mfk_token", res.token);
        localStorage.setItem("mfk_user", JSON.stringify(res.user));
        toast.success(res.message || `Selamat datang, ${res.user.name}!`);
        return { success: true, user: res.user };
      } else {
        toast.error(res.message || "Gagal masuk");
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Koneksi ke server gagal";
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("mfk_token");
    localStorage.removeItem("mfk_user");
    toast.success("Anda berhasil keluar dari sistem");
  };

  const updateCurrentUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("mfk_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === "admin",
        login,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
