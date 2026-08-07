import React, { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("nims_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const { token, ...profile } = data;
      localStorage.setItem("nims_token", token);
      localStorage.setItem("nims_user", JSON.stringify(profile));
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await authService.register(payload);
      const { token, ...profile } = data;
      localStorage.setItem("nims_token", token);
      localStorage.setItem("nims_user", JSON.stringify(profile));
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("nims_token");
    localStorage.removeItem("nims_user");
    setUser(null);
  };

  useEffect(() => {
    // Keep other tabs in sync
    const handler = (e) => {
      if (e.key === "nims_user") {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
