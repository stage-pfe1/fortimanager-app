import { createContext, useContext, useState, useEffect, useRef } from "react";

export const AuthContext = createContext();
const SESSION_TIMEOUT = 10 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }) {
  const [fortigate, setFortigate] = useState(() => {
    try {
      const saved = localStorage.getItem("fortigate");
      const timestamp = localStorage.getItem("fortigate_timestamp");
      if (saved && timestamp) {
        const elapsed = Date.now() - parseInt(timestamp);
        if (elapsed < SESSION_TIMEOUT) {
          return JSON.parse(saved);
        } else {
          localStorage.removeItem("fortigate");
          localStorage.removeItem("fortigate_timestamp");
          return null;
        }
      }
      return null;  // ← hada el mhim — moch demo mode
    } catch {
      return null;
    }
  });
  const timeoutRef = useRef(null);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      logout();
      window.location.href = "/login";
    }, SESSION_TIMEOUT);
  };

  useEffect(() => {
    if (fortigate) {
      resetTimeout();
      const events = ["mousedown", "keydown", "scroll", "touchstart"];
      events.forEach(e => window.addEventListener(e, resetTimeout));
      return () => {
        events.forEach(e => window.removeEventListener(e, resetTimeout));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [fortigate]);

  const login = (data) => {
    setFortigate(data);
    localStorage.setItem("fortigate", JSON.stringify(data));
    localStorage.setItem("fortigate_timestamp", Date.now().toString());
    resetTimeout();
  };

  const logout = () => {
    setFortigate(null);
    localStorage.removeItem("fortigate");
    localStorage.removeItem("fortigate_timestamp");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const isAuthenticated = () => !!fortigate;

  return (
    <AuthContext.Provider value={{ fortigate, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}