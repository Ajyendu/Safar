import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, displayName) => {
    const data = await api.register({ email, password, displayName });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const requestOtp = async (payload) => {
    return api.requestOtp(payload);
  };

  const verifyOtp = async (payload) => {
    const data = await api.verifyOtp(payload);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const googleAuth = async (credential) => {
    const data = await api.googleAuth({ credential });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, requestOtp, verifyOtp, googleAuth, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
