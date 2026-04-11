import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { fortigate } = useContext(AuthContext);

  if (!fortigate || !fortigate.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}