import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

const demoVPNs = [
  { name: "VPN-Site-Paris", phase2: "Paris-P2", status: "up", remote: "203.0.113.10", local: "192.168.1.1" },
  { name: "VPN-Site-Lyon", phase2: "Lyon-P2", status: "down", remote: "198.51.100.5", local: "192.168.1.1" },
  { name: "VPN-Site-Tunis", phase2: "Tunis-P2", status: "up", remote: "10.10.10.1", local: "192.168.1.1" },
];

export default function VPN() {
  const { fortigate } = useAuth();
  const navigate = useNavigate();
  const [vpns, setVpns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", remote: "", psk: "", local_intf: "wan1" });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchVPNs();
  }, []);

  const fetchVPNs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/cmdb/vpn.ipsec/phase1-interface", {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
      const data = res.data.results || [];
      setVpns(data.length > 0 ? data : demoVPNs);
    } catch {
      setError("Mode demo — FortiGate non connecté");
      setVpns(demoVPNs);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/api/v2/cmdb/vpn.ipsec/phase1-interface",
        { name: form.name, interface: form.local_intf, "remote-gw": form.remote, psksecret: form.psk, type: "static", proposal: "aes256-sha256", "ike-version": "2" },
        { headers: { Authorization: `Bearer ${fortigate.token}` } }
      );
      setSuccessMsg("Tunnel VPN créé avec succès !");
    } catch {
      setSuccessMsg("Demo — config VPN générée");
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm({ name: "", remote: "", psk: "", local_intf: "wan1" });
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchVPNs();
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Tunnels VPN IPsec</h2>
          <div className="flex gap-3">
            <button onClick={fetchVPNs} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">Rafraîchir</button>
            <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition">
              {showForm ? "Annuler" : "+ Nouveau tunnel"}
            </button>
          </div>
        </div>

        {successMsg && <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{successMsg}</div>}
        {error && <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm">⚠ {error}</div>}

        {showForm && (
          <div className="bg-gray-800 border border-purple-500 rounded-xl p-6 mb-6">
            <h3 className="text-purple-400 font-semibold mb-4">Créer un tunnel VPN IPsec</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nom du tunnel</label>
                <input type="text" placeholder="VPN-Site-A" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">IP Remote Gateway</label>
                <input type="text" placeholder="203.0.113.10" required value={form.remote}
                  onChange={e => setForm({ ...form, remote: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Pre-Shared Key</label>
                <input type="password" placeholder="••••••••" required value={form.psk}
                  onChange={e => setForm({ ...form, psk: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Interface locale</label>
                <select value={form.local_intf} onChange={e => setForm({ ...form, local_intf: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500">
                  <option>wan1</option><option>wan2</option><option>port1</option><option>port2</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-sm font-semibold transition">
                  {saving ? "Création en cours..." : "Créer le tunnel"}
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
                  <th className="text-left py-3 px-4">Nom tunnel</th>
                  <th className="text-left py-3 px-4">Remote Gateway</th>
                  <th className="text-left py-3 px-4">Local IP</th>
                  <th className="text-left py-3 px-4">Phase 2</th>
                  <th className="text-left py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {vpns.map((vpn, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 font-semibold text-purple-400">{vpn.name}</td>
                    <td className="py-3 px-4 text-gray-300">{vpn["remote-gw"] || vpn.remote || "—"}</td>
                    <td className="py-3 px-4 text-gray-300">{vpn.local || "—"}</td>
                    <td className="py-3 px-4 text-gray-400">{vpn.phase2 || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        vpn.status === "up" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>{vpn.status || "unknown"}</span>
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