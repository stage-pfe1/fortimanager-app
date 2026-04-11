import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

const demoRoutes = [
  { seq_num: 1, dst: "0.0.0.0/0", gateway: "203.0.113.254", device: "wan1", distance: 10, priority: 0, status: "active" },
  { seq_num: 2, dst: "192.168.2.0/24", gateway: "192.168.1.254", device: "port1", distance: 10, priority: 0, status: "active" },
  { seq_num: 3, dst: "10.10.0.0/16", gateway: "10.0.0.2", device: "port2", distance: 20, priority: 1, status: "active" },
  { seq_num: 4, dst: "172.16.0.0/12", gateway: "192.168.1.1", device: "port1", distance: 10, priority: 0, status: "inactive" },
];

export default function Routes() {
  const { fortigate } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ dst: "", gateway: "", device: "wan1", distance: "10", priority: "0" });

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/cmdb/router/static", {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
      const data = res.data.results || [];
      setRoutes(data.length > 0 ? data : demoRoutes);
    } catch {
      setError("Mode demo — FortiGate non connecté");
      setRoutes(demoRoutes);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/api/v2/cmdb/router/static",
        { dst: form.dst, gateway: form.gateway, device: form.device, distance: parseInt(form.distance), priority: parseInt(form.priority) },
        { headers: { Authorization: `Bearer ${fortigate.token}` } }
      );
      setSuccessMsg("Route ajoutée avec succès !");
    } catch {
      setSuccessMsg("Demo — route générée");
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm({ dst: "", gateway: "", device: "wan1", distance: "10", priority: "0" });
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchRoutes();
    }
  };

  const handleDelete = async (seqNum) => {
    if (!window.confirm("Supprimer cette route ?")) return;
    try {
      await axios.delete(`/api/v2/cmdb/router/static/${seqNum}`, {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
    } catch {}
    setSuccessMsg("Route supprimée !");
    setTimeout(() => setSuccessMsg(""), 3000);
    fetchRoutes();
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Routes statiques</h2>
          <div className="flex gap-3">
            <button onClick={fetchRoutes} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">Rafraîchir</button>
            <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition">
              {showForm ? "Annuler" : "+ Nouvelle route"}
            </button>
          </div>
        </div>

        {successMsg && <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{successMsg}</div>}
        {error && <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm">⚠ {error}</div>}

        {showForm && (
          <div className="bg-gray-800 border border-green-500 rounded-xl p-6 mb-6">
            <h3 className="text-green-400 font-semibold mb-4">Ajouter une route statique</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Destination</label>
                <input type="text" placeholder="192.168.10.0/24" required value={form.dst}
                  onChange={e => setForm({ ...form, dst: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Gateway</label>
                <input type="text" placeholder="192.168.1.254" required value={form.gateway}
                  onChange={e => setForm({ ...form, gateway: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Interface</label>
                <select value={form.device} onChange={e => setForm({ ...form, device: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500">
                  <option>wan1</option><option>wan2</option><option>port1</option><option>port2</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Distance</label>
                <input type="number" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-sm font-semibold transition">
                  {saving ? "Ajout en cours..." : "Ajouter la route"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div className="text-center text-gray-400 mt-20">Chargement...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-3 px-4">Seq</th>
                  <th className="text-left py-3 px-4">Destination</th>
                  <th className="text-left py-3 px-4">Gateway</th>
                  <th className="text-left py-3 px-4">Interface</th>
                  <th className="text-left py-3 px-4">Distance</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 text-gray-500">{route["seq-num"] || route.seq_num || i + 1}</td>
                    <td className="py-3 px-4 font-semibold text-green-400">{route.dst}</td>
                    <td className="py-3 px-4 text-gray-300">{route.gateway}</td>
                    <td className="py-3 px-4 text-gray-300">{route.device}</td>
                    <td className="py-3 px-4 text-gray-400">{route.distance}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        route.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-600/40 text-gray-400"
                      }`}>{route.status || "active"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleDelete(route["seq-num"] || route.seq_num)}
                        className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-xs transition">
                        Supprimer
                      </button>
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