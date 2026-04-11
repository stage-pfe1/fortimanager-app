import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

const demoPolicies = [
  { policyid: 1, name: "LAN-to-WAN", srcintf: "port1", dstintf: "wan1", srcaddr: "all", dstaddr: "all", action: "accept", service: "ALL", status: "enable", nat: "enable" },
  { policyid: 2, name: "VPN-Traffic", srcintf: "port1", dstintf: "ssl.root", srcaddr: "192.168.1.0/24", dstaddr: "10.10.0.0/16", action: "accept", service: "ALL", status: "enable", nat: "disable" },
  { policyid: 3, name: "Block-Social", srcintf: "port1", dstintf: "wan1", srcaddr: "all", dstaddr: "all", action: "deny", service: "HTTP", status: "enable", nat: "disable" },
  { policyid: 4, name: "Guest-WiFi", srcintf: "port2", dstintf: "wan1", srcaddr: "all", dstaddr: "all", action: "accept", service: "ALL", status: "disable", nat: "enable" },
];

export default function Policies() {
  const { fortigate } = useAuth();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    name: "", srcintf: "port1", dstintf: "wan1",
    srcaddr: "all", dstaddr: "all", action: "accept", service: "ALL", nat: "enable",
  });

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/cmdb/firewall/policy", {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
      const data = res.data.results || [];
      setPolicies(data.length > 0 ? data : demoPolicies);
    } catch {
      setError("Mode demo — FortiGate non connecté");
      setPolicies(demoPolicies);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/api/v2/cmdb/firewall/policy",
        {
          name: form.name,
          srcintf: [{ name: form.srcintf }],
          dstintf: [{ name: form.dstintf }],
          srcaddr: [{ name: form.srcaddr }],
          dstaddr: [{ name: form.dstaddr }],
          action: form.action,
          service: [{ name: form.service }],
          nat: form.nat,
          status: "enable",
        },
        { headers: { Authorization: `Bearer ${fortigate.token}` } }
      );
      setSuccessMsg("Policy créée avec succès !");
    } catch {
      setSuccessMsg("Demo — policy générée");
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm({ name: "", srcintf: "port1", dstintf: "wan1", srcaddr: "all", dstaddr: "all", action: "accept", service: "ALL", nat: "enable" });
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchPolicies();
    }
  };

  const handleDelete = async (policyid) => {
    if (!window.confirm("Supprimer cette policy ?")) return;
    try {
      await axios.delete(`/api/v2/cmdb/firewall/policy/${policyid}`, {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
    } catch {}
    setSuccessMsg("Policy supprimée !");
    setTimeout(() => setSuccessMsg(""), 3000);
    fetchPolicies();
  };

  const handleToggle = (policy) => {
    const newStatus = policy.status === "enable" ? "disable" : "enable";
    setPolicies(prev => prev.map(p => p.policyid === policy.policyid ? { ...p, status: newStatus } : p));
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Firewall Policies</h2>
          <div className="flex gap-3">
            <button onClick={fetchPolicies} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">Rafraîchir</button>
            <button onClick={() => setShowForm(!showForm)} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm transition">
              {showForm ? "Annuler" : "+ Nouvelle policy"}
            </button>
          </div>
        </div>

        {successMsg && <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{successMsg}</div>}
        {error && <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm">⚠ {error}</div>}

        {showForm && (
          <div className="bg-gray-800 border border-orange-500 rounded-xl p-6 mb-6">
            <h3 className="text-orange-400 font-semibold mb-4">Créer une Firewall Policy</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Nom</label>
                <input type="text" placeholder="LAN-to-WAN" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Interface source</label>
                <select value={form.srcintf} onChange={e => setForm({ ...form, srcintf: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500">
                  <option>port1</option><option>port2</option><option>wan1</option><option>wan2</option><option>ssl.root</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Interface destination</label>
                <select value={form.dstintf} onChange={e => setForm({ ...form, dstintf: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500">
                  <option>wan1</option><option>wan2</option><option>port1</option><option>port2</option><option>ssl.root</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Service</label>
                <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500">
                  <option>ALL</option><option>HTTP</option><option>HTTPS</option><option>DNS</option><option>SSH</option><option>PING</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Action</label>
                <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500">
                  <option value="accept">Accept</option>
                  <option value="deny">Deny</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">NAT</label>
                <select value={form.nat} onChange={e => setForm({ ...form, nat: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-orange-500">
                  <option value="enable">Enable</option>
                  <option value="disable">Disable</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700 px-6 py-2 rounded-lg text-sm font-semibold transition">
                  {saving ? "Création en cours..." : "Créer la policy"}
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
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Nom</th>
                  <th className="text-left py-3 px-4">Src</th>
                  <th className="text-left py-3 px-4">Dst</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">NAT</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Del</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 text-gray-500">{policy.policyid}</td>
                    <td className="py-3 px-4 font-semibold text-orange-400">{policy.name || "—"}</td>
                    <td className="py-3 px-4 text-gray-300">{Array.isArray(policy.srcintf) ? policy.srcintf.map(i => i.name).join(", ") : policy.srcintf}</td>
                    <td className="py-3 px-4 text-gray-300">{Array.isArray(policy.dstintf) ? policy.dstintf.map(i => i.name).join(", ") : policy.dstintf}</td>
                    <td className="py-3 px-4 text-gray-400">{Array.isArray(policy.service) ? policy.service.map(s => s.name).join(", ") : policy.service}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        policy.action === "accept" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>{policy.action}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs ${policy.nat === "enable" ? "text-blue-400" : "text-gray-500"}`}>{policy.nat}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggle(policy)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                          policy.status === "enable"
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/40"
                            : "bg-gray-600/40 text-gray-400 hover:bg-gray-600/60"
                        }`}>
                        {policy.status === "enable" ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleDelete(policy.policyid)}
                        className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-xs transition">
                        ✕
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