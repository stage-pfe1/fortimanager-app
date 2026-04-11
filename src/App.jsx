import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interfaces" element={<Interfaces />} />
          <Route path="/vpn" element={<VPN />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/sdwan" element={<SDWAN />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;