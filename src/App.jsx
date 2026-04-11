import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Interfaces from "./pages/Interfaces";
import VPN from "./pages/VPN";
import RoutesPage from "./pages/Routes";
import Policies from "./pages/Policies";
import SDWAN from "./pages/SDWAN";
import Monitoring from "./pages/Monitoring";
import Logs from "./pages/Logs";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/interfaces" element={<ProtectedRoute><Interfaces /></ProtectedRoute>} />
          <Route path="/vpn" element={<ProtectedRoute><VPN /></ProtectedRoute>} />
          <Route path="/routes" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
          <Route path="/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />
          <Route path="/sdwan" element={<ProtectedRoute><SDWAN /></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;