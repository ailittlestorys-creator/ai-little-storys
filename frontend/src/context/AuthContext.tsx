import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import axios from "axios";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // GET CURRENT USER
  const refreshUser = async (): Promise<User | null> => {
    try {
      const response = await api.get("/auth/me");

      const currentUser: User = response.data.user;

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      // 401 means user is not logged in or session has expired.
      // This is an expected authentication response.
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        console.error("Refresh user failed:", error);
      }

      setUser(null);

      return null;
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setUser(null);
    }
  };

  // CHECK LOGIN SESSION WHEN APP LOADS
  useEffect(() => {
    void refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// CUSTOM AUTH HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
