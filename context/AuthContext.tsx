// context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface AuthContextType {
  token: string | null;
  user: { id: string; username: string } | null;
  isLoading: boolean; // Add isLoading state
  login: (token: string, user: { id: string; username: string }) => void;
  logout: () => void;
  register: (token: string, user: { id: string; username: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );

  // Inactivity timeout duration in milliseconds (2 minutes)
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Cookies.remove("auth-token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Check for existing token in cookies on initial load
    const storedToken = Cookies.get("auth-token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      // Set up inactivity timer and event listeners
      resetInactivityTimer();

      const events = ["mousemove", "keydown", "click"];
      const handleUserActivity = () => resetInactivityTimer();

      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });

      // Cleanup function to remove listeners and clear the timer
      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, handleUserActivity);
        });
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }
      };
    }
  }, [token]);

  const login = (
    jwtToken: string,
    userData: { id: string; username: string }
  ) => {
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    Cookies.set("auth-token", jwtToken, { expires: 7 }); // Token expires in 7 days
    setToken(jwtToken);
    setUser(userData);
    router.push("/");
  };

  const register = (
    jwtToken: string,
    userData: { id: string; username: string }
  ) => {
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, register, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
