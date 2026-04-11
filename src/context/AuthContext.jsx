import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [fortigate, setFortigate] = useState(null);

  const login = (data) => {
    setFortigate(data);
    localStorage.setItem("fortigate", JSON.stringify(data));
  };

  const logout = () => {
    setFortigate(null);
    localStorage.removeItem("fortigate");
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