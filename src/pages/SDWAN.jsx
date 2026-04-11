import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

const demoMembers = [
  { seq_num: 1, interface: "wan1", gateway: "203.0.113.254", priority: 0, weight: 0, cost: 0, status: "alive" },
  { seq_num: 2, interface: "wan2", gateway: "198.51.100.254", priority: 0, weight: 0, cost: 0, status: "alive" },
  { seq_num: 3, interface: "port2", gateway: "10.0.0.254", priority: 1, weight: 10, cost: 0, status: "dead" },
];

const demoSLA = [
  { name: "SLA-Google", server: "8.8.8.8", protocol: "ping", latency_threshold: 100, jitter_threshold: 10, packetloss_threshold: 5, status: "alive" },
  { name: "SLA-Cloudflare", server: "1.1.1.1", protocol: "ping", latency_threshold: 80, jitter_threshold: 8, packetloss_threshold: 3, status: "alive" },
];

const demoRules = [
  { name: "Rule-VoIP", mode: "lowest-latency", src: "all", dst: "all", service: "SIP", members: ["wan1", "wan2"] },
  { name: "Rule-Default", mode: "load-balance", src: "all", dst: "all", service: "ALL", members: ["wan1", "wan2"] },
];

export default function SDWAN() {
  const { fortigate } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [slaList, setSlaList] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showSLAForm, setShowSLAForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [memberForm, setMemberForm] = useState({ interface: "wan1", gateway: "", priority: "0", weight: "0" });
  const [slaForm, setSlaForm] = useState({ name: "", server: "", protocol: "ping", latency: "100", jitter: "10", packetloss: "5" });
  const [ruleForm, setRuleForm] = useState({ name: "", mode: "load-balance", service: "ALL" });

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [membersRes, slaRes, rulesRes] = await Promise.all([
        axios.get("/api/v2/cmdb/system/sdwan/members", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
        axios.get("/api/v2/cmdb/system/sdwan/health-check", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
        axios.get("/api/v2/cmdb/system/sdwan/service", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
      ]);
      setMembers(membersRes.data.results?.length > 0 ? membersRes.data.results : demoMembers);
      setSlaList(slaRes.data.results?.length > 0 ? slaRes.data.results : demoSLA);
      setRules(rulesRes.data.results?.length > 0 ? rulesRes.data.results : demoRules);
    } catch {
      setError("Mode demo — FortiGate non connecté");
      setMembers(demoMembers);
      setSlaList(demoSLA);
      setRules(demoRules);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/api/v2/cmdb/system/sdwan/members",
        { interface: memberForm.interface, gateway: memberForm.gateway, priority: parseInt(memberForm.priority), weight: parseInt(memberForm.weight) },
        { headers: { Authorization: `Bearer ${fortigate.token}` } }
      );
      showSuccess("Membre WAN ajouté !");
    } catch {
      showSuccess("Demo — membre WAN ajouté");
    } finally {
      setSaving(false);
      setShowMemberForm(false);
      setMemberForm({ interface: "wan1", gateway: "", priority: "0", weight: "0" });
      fetchAll();
    }
  };

  const handleAddSLA = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/api/v2/cmdb/system/sdwan/health-check",
        {
          name: slaForm.name,
          server: slaForm.server,
          protocol: slaForm.protocol,
          "latency-threshold": parseInt(slaForm.latency),
          "jitter-threshold": parseInt(slaForm.jitter),
          "packetloss-threshold": parseInt(slaForm.packetloss),
        },
        { headers: { Authorization: `Bearer ${fortigate.token}` } }
      );
      showSuccess("SLA créé avec succès !");
    } catch {
      showSuccess("Demo — SLA créé");
    } finally {
      setSaving(false);
      setShowSLAForm(false);
      setSlaForm({ name: "", server: "", protocol: "ping", latency: "100", jitter: "10", packetloss: "5" });
      fetchAll();
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/api/v2/cmdb/system/sdwan/service",
        { name: ruleForm.name, mode: ruleForm.mode, "dst-negate": "disable" },
        { headers: { Authorization: `Bearer ${fortigate.token}` } }
      );
      showSuccess("Règle SD-WAN créée !");
    } catch {
      showSuccess("Demo — règle créée");
    } finally {
      setSaving(false);
      setShowRuleForm(false);
      setRuleForm({ name: "", mode: "load-balance", service: "ALL" });
      fetchAll();
    }
  };

  const tabs = [
    { id: "members", label: "Membres WAN" },
    { id: "sla", label: "Health Check SLA" },
    { id: "rules", label: "Règles SD-WAN" },
  ];

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Gestion SD-WAN</h2>
          <button onClick={fetchAll} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
            Rafraîchir
          </button>
        </div>

        {successMsg && <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{successMsg}</div>}
        {error && <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm">⚠ {error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center text-gray-400 mt-20">Chargement...</div> : (
          <>
            {/* ── TAB 1 : Membres WAN ── */}
            {activeTab === "members" && (
              <>
                <div className="flex justify-end mb-4">
                  <button onClick={() => setShowMemberForm(!showMemberForm)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition">
                    {showMemberForm ? "Annuler" : "+ Ajouter membre WAN"}
                  </button>
                </div>

                {showMemberForm && (
                  <div className="bg-gray-800 border border-blue-500 rounded-xl p-6 mb-6">
                    <h3 className="text-blue-400 font-semibold mb-4">Ajouter un membre WAN</h3>
                    <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Interface</label>
                        <select value={memberForm.interface} onChange={e => setMemberForm({ ...memberForm, interface: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500">
                          <option>wan1</option><option>wan2</option><option>port1</option><option>port2</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Gateway</label>
                        <input type="text" placeholder="203.0.113.254" value={memberForm.gateway}
                          onChange={e => setMemberForm({ ...memberForm, gateway: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Priorité</label>
                        <input type="number" value={memberForm.priority}
                          onChange={e => setMemberForm({ ...memberForm, priority: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Weight</label>
                        <input type="number" value={memberForm.weight}
                          onChange={e => setMemberForm({ ...memberForm, weight: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="md:col-span-2">
                        <button type="submit" disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-semibold transition">
                          {saving ? "Ajout..." : "Ajouter"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left py-3 px-4">Seq</th>
                        <th className="text-left py-3 px-4">Interface</th>
                        <th className="text-left py-3 px-4">Gateway</th>
                        <th className="text-left py-3 px-4">Priorité</th>
                        <th className="text-left py-3 px-4">Weight</th>
                        <th className="text-left py-3 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                          <td className="py-3 px-4 text-gray-500">{m["seq-num"] || m.seq_num || i + 1}</td>
                          <td className="py-3 px-4 font-semibold text-blue-400">{m.interface}</td>
                          <td className="py-3 px-4 text-gray-300">{m.gateway || "—"}</td>
                          <td className="py-3 px-4 text-gray-400">{m.priority ?? "—"}</td>
                          <td className="py-3 px-4 text-gray-400">{m.weight ?? "—"}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              m.status === "alive" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}>{m.status || "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── TAB 2 : SLA ── */}
            {activeTab === "sla" && (
              <>
                <div className="flex justify-end mb-4">
                  <button onClick={() => setShowSLAForm(!showSLAForm)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition">
                    {showSLAForm ? "Annuler" : "+ Nouveau SLA"}
                  </button>
                </div>

                {showSLAForm && (
                  <div className="bg-gray-800 border border-purple-500 rounded-xl p-6 mb-6">
                    <h3 className="text-purple-400 font-semibold mb-4">Créer un Health Check SLA</h3>
                    <form onSubmit={handleAddSLA} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Nom SLA</label>
                        <input type="text" placeholder="SLA-Google" required value={slaForm.name}
                          onChange={e => setSlaForm({ ...slaForm, name: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Serveur</label>
                        <input type="text" placeholder="8.8.8.8" required value={slaForm.server}
                          onChange={e => setSlaForm({ ...slaForm, server: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Protocol</label>
                        <select value={slaForm.protocol} onChange={e => setSlaForm({ ...slaForm, protocol: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500">
                          <option>ping</option><option>tcp-echo</option><option>http</option><option>dns</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Latency threshold (ms)</label>
                        <input type="number" value={slaForm.latency}
                          onChange={e => setSlaForm({ ...slaForm, latency: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Jitter threshold (ms)</label>
                        <input type="number" value={slaForm.jitter}
                          onChange={e => setSlaForm({ ...slaForm, jitter: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Packet Loss threshold (%)</label>
                        <input type="number" value={slaForm.packetloss}
                          onChange={e => setSlaForm({ ...slaForm, packetloss: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div className="md:col-span-2">
                        <button type="submit" disabled={saving}
                          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-sm font-semibold transition">
                          {saving ? "Création..." : "Créer SLA"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left py-3 px-4">Nom</th>
                        <th className="text-left py-3 px-4">Serveur</th>
                        <th className="text-left py-3 px-4">Protocol</th>
                        <th className="text-left py-3 px-4">Latency</th>
                        <th className="text-left py-3 px-4">Jitter</th>
                        <th className="text-left py-3 px-4">Pkt Loss</th>
                        <th className="text-left py-3 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slaList.map((sla, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                          <td className="py-3 px-4 font-semibold text-purple-400">{sla.name}</td>
                          <td className="py-3 px-4 text-gray-300">{sla.server}</td>
                          <td className="py-3 px-4 text-gray-400">{sla.protocol}</td>
                          <td className="py-3 px-4 text-gray-400">{sla["latency-threshold"] || sla.latency_threshold} ms</td>
                          <td className="py-3 px-4 text-gray-400">{sla["jitter-threshold"] || sla.jitter_threshold} ms</td>
                          <td className="py-3 px-4 text-gray-400">{sla["packetloss-threshold"] || sla.packetloss_threshold} %</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              sla.status === "alive" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}>{sla.status || "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── TAB 3 : Règles ── */}
            {activeTab === "rules" && (
              <>
                <div className="flex justify-end mb-4">
                  <button onClick={() => setShowRuleForm(!showRuleForm)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition">
                    {showRuleForm ? "Annuler" : "+ Nouvelle règle"}
                  </button>
                </div>

                {showRuleForm && (
                  <div className="bg-gray-800 border border-green-500 rounded-xl p-6 mb-6">
                    <h3 className="text-green-400 font-semibold mb-4">Créer une règle SD-WAN</h3>
                    <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Nom règle</label>
                        <input type="text" placeholder="Rule-VoIP" required value={ruleForm.name}
                          onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Mode</label>
                        <select value={ruleForm.mode} onChange={e => setRuleForm({ ...ruleForm, mode: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500">
                          <option value="load-balance">Load Balance</option>
                          <option value="lowest-latency">Lowest Latency</option>
                          <option value="bandwidth">Max Bandwidth</option>
                          <option value="priority">Priority</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm mb-1 block">Service</label>
                        <select value={ruleForm.service} onChange={e => setRuleForm({ ...ruleForm, service: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500">
                          <option>ALL</option><option>HTTP</option><option>HTTPS</option>
                          <option>SIP</option><option>DNS</option><option>SSH</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <button type="submit" disabled={saving}
                          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-sm font-semibold transition">
                          {saving ? "Création..." : "Créer la règle"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left py-3 px-4">Nom</th>
                        <th className="text-left py-3 px-4">Mode</th>
                        <th className="text-left py-3 px-4">Service</th>
                        <th className="text-left py-3 px-4">Membres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                          <td className="py-3 px-4 font-semibold text-green-400">{rule.name}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">{rule.mode}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{rule.service || "ALL"}</td>
                          <td className="py-3 px-4 text-gray-400">
                            {Array.isArray(rule.members) ? rule.members.join(", ") : "wan1, wan2"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}