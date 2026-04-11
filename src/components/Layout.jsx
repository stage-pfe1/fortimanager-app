import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { label: "Interfaces", path: "/interfaces", icon: "🔌" },
  { label: "VPN IPsec", path: "/vpn", icon: "🔒" },
  { label: "SD-WAN", path: "/sdwan", icon: "🌐" },
  { label: "Routes", path: "/routes", icon: "🗺️" },
  { label: "Policies", path: "/policies", icon: "🛡️" },
  { label: "Monitoring", path: "/monitoring", icon: "📊" },
  { label: "Logs", path: "/logs", icon: "📋" },
];

export default function Layout({ children }) {
  const { fortigate, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-700">
          <h1 className="text-lg font-bold text-blue-400">FortiManager App</h1>
          <p className="text-xs text-gray-500 mt-1">{fortigate?.ip || "Demo mode"}</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {fortigate?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{fortigate?.username || "Admin"}</p>
              <p className="text-xs text-gray-500">Administrateur</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg text-sm transition"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 flex-1 min-h-screen">
        {children}
      </div>
    </div>
  );
}