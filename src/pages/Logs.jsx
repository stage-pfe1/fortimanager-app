import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

const demoLogs = [
  { id: 1, timestamp: "2026-04-11 01:20:33", user: "admin", action: "LOGIN", module: "Auth", detail: "Connexion réussie depuis 192.168.1.100", status: "success" },
  { id: 2, timestamp: "2026-04-11 01:22:10", user: "admin", action: "CREATE", module: "VPN", detail: "Tunnel VPN-Site-Paris créé", status: "success" },
  { id: 3, timestamp: "2026-04-11 01:23:45", user: "admin", action: "CREATE", module: "Policy", detail: "Policy LAN-to-WAN créée (ID: 5)", status: "success" },
  { id: 4, timestamp: "2026-04-11 01:25:00", user: "admin", action: "DELETE", module: "Route", detail: "Route 172.16.0.0/12 supprimée", status: "success" },
  { id: 5, timestamp: "2026-04-11 01:26:30", user: "admin", action: "CREATE", module: "SD-WAN", detail: "Membre WAN wan2 ajouté", status: "success" },
  { id: 6, timestamp: "2026-04-11 01:27:15", user: "admin", action: "ERROR", module: "VPN", detail: "Échec création tunnel — IP invalide", status: "error" },
  { id: 7, timestamp: "2026-04-11 01:28:00", user: "admin", action: "CREATE", module: "SLA", detail: "Health Check SLA-Google créé", status: "success" },
  { id: 8, timestamp: "2026-04-11 01:29:10", user: "admin", action: "UPDATE", module: "Policy", detail: "Policy Block-Social désactivée", status: "success" },
  { id: 9, timestamp: "2026-04-11 01:30:00", user: "admin", action: "LOGOUT", module: "Auth", detail: "Déconnexion admin", status: "success" },
];

const actionColors = {
  LOGIN:  "bg-blue-500/20 text-blue-400",
  LOGOUT: "bg-gray-500/20 text-gray-400",
  CREATE: "bg-green-500/20 text-green-400",
  DELETE: "bg-red-500/20 text-red-400",
  UPDATE: "bg-yellow-500/20 text-yellow-400",
  ERROR:  "bg-red-600/30 text-red-400",
};

const moduleColors = {
  Auth:    "text-blue-300",
  VPN:     "text-purple-300",
  Policy:  "text-orange-300",
  Route:   "text-green-300",
  "SD-WAN": "text-cyan-300",
  SLA:     "text-pink-300",
};

export default function Logs() {
  const { fortigate } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("Tous");
  const [filterAction, setFilterAction] = useState("Tous");

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, search, filterModule, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/monitor/fortiview/statistics", {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
      const data = res.data.results || [];
      setLogs(data.length > 0 ? data : demoLogs);
    } catch {
      setLogs(demoLogs);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...logs];
    if (search) {
      result = result.filter(log =>
        log.detail?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.module?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterModule !== "Tous") result = result.filter(log => log.module === filterModule);
    if (filterAction !== "Tous") result = result.filter(log => log.action === filterAction);
    setFiltered(result);
  };

  const clearLogs = () => {
    if (window.confirm("Vider l'historique des logs ?")) {
      setLogs([]);
    }
  };

  const modules = ["Tous", "Auth", "VPN", "Policy", "Route", "SD-WAN", "SLA"];
  const actions = ["Tous", "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "ERROR"];

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === "success").length,
    errors: logs.filter(l => l.status === "error").length,
    creates: logs.filter(l => l.action === "CREATE").length,
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Historique des actions</h2>
          <div className="flex gap-3">
            <button onClick={fetchLogs} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
              Rafraîchir
            </button>
            <button onClick={clearLogs} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg text-sm transition">
              Vider logs
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Total actions</p>
            <p className="text-white text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-green-500/30">
            <p className="text-gray-400 text-xs mb-1">Succès</p>
            <p className="text-green-400 text-2xl font-bold">{stats.success}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-red-500/30">
            <p className="text-gray-400 text-xs mb-1">Erreurs</p>
            <p className="text-red-400 text-2xl font-bold">{stats.errors}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-blue-500/30">
            <p className="text-gray-400 text-xs mb-1">Créations</p>
            <p className="text-blue-400 text-2xl font-bold">{stats.creates}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-sm w-64"
          />
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-sm">
            {modules.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-sm">
            {actions.map(a => <option key={a}>{a}</option>)}
          </select>
          {(search || filterModule !== "Tous" || filterAction !== "Tous") && (
            <button onClick={() => { setSearch(""); setFilterModule("Tous"); setFilterAction("Tous"); }}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition">
              Reset filtres
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center text-gray-400 mt-20">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">Aucun log trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-3 px-4">Timestamp</th>
                  <th className="text-left py-3 px-4">Utilisateur</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Module</th>
                  <th className="text-left py-3 px-4">Détail</th>
                  <th className="text-left py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 text-gray-300">{log.user}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${actionColors[log.action] || "bg-gray-600 text-gray-300"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-medium ${moduleColors[log.module] || "text-gray-300"}`}>
                      {log.module}
                    </td>
                    <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{log.detail}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        log.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}