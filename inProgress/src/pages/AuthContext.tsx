import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  avatar: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        setUserState(null);
      }
    } else {
      const token = localStorage.getItem("userToken");
      if (token) {
        try {
          const payload = token.split(".")[1];
          if (payload) {
            const decoded = JSON.parse(atob(payload));
            setUserState({
              id: decoded.id,
              name: decoded.name,
              avatar: decoded.avatar,
              email: decoded.email,
            });
          }
        } catch (err) {
          console.error("Failed to decode token:", err);
          setUserState(null);
        }
      }
    }
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("currentUser", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userToken");
    }
  };

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};
