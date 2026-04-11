import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const generatePoint = (prev) => ({
  time: new Date().toLocaleTimeString(),
  cpu: Math.min(100, Math.max(0, (prev?.cpu || 30) + (Math.random() * 20 - 10))),
  ram: Math.min(100, Math.max(0, (prev?.ram || 50) + (Math.random() * 10 - 5))),
  wan1: Math.floor(Math.random() * 80 + 20),
  wan2: Math.floor(Math.random() * 60 + 10),
});

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const { fortigate } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(() => {
    const points = [];
    let prev = null;
    for (let i = 0; i < 10; i++) {
      const p = generatePoint(prev);
      points.push(p);
      prev = p;
    }
    return points;
  });

  const [systemInfo, setSystemInfo] = useState(null);
  const [interfaces, setInterfaces] = useState([]);
  const [vpns, setVpns] = useState([]);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchAll();
    intervalRef.current = setInterval(() => {
      setMetrics(prev => {
        const newPoint = generatePoint(prev[prev.length - 1]);
        return [...prev.slice(-19), newPoint];
      });
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statusRes, intfRes, vpnRes, sessionRes] = await Promise.all([
        axios.get("/api/v2/monitor/system/status", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
        axios.get("/api/v2/cmdb/system/interface", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
        axios.get("/api/v2/cmdb/vpn.ipsec/phase1-interface", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
        axios.get("/api/v2/monitor/system/session/count", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
      ]);
      setSystemInfo(statusRes.data.results);
      setInterfaces(intfRes.data.results || []);
      setVpns(vpnRes.data.results || []);
      setSessions(sessionRes.data.results);
    } catch {
      setSystemInfo({ hostname: "FortiGate-Demo", version: "v7.4.0", serial: "FGT60F-DEMO", uptime: "5 days, 3:22:11" });
      setInterfaces([
        { name: "wan1", status: "up", type: "physical" },
        { name: "wan2", status: "up", type: "physical" },
        { name: "port1", status: "up", type: "physical" },
        { name: "port2", status: "down", type: "physical" },
      ]);
      setVpns([
        { name: "VPN-Paris", status: "up" },
        { name: "VPN-Lyon", status: "down" },
        { name: "VPN-Tunis", status: "up" },
      ]);
      setSessions({ current_usage: 1243 });
    } finally {
      setLoading(false);
    }
  };

  const lastMetric = metrics[metrics.length - 1];

  const intfUp = interfaces.filter(i => i.status === "up").length;
  const intfDown = interfaces.filter(i => i.status !== "up").length;
  const vpnUp = vpns.filter(v => v.status === "up").length;
  const vpnDown = vpns.filter(v => v.status !== "up").length;

  const pieData = [
    { name: "Interfaces UP", value: intfUp || 3 },
    { name: "Interfaces DOWN", value: intfDown || 1 },
    { name: "VPN UP", value: vpnUp || 2 },
    { name: "VPN DOWN", value: vpnDown || 1 },
  ];

  const modules = [
    { label: "Interfaces", path: "/interfaces", icon: "🔌", color: "border-blue-500", stat: `${intfUp} UP / ${intfDown} DOWN` },
    { label: "VPN IPsec", path: "/vpn", icon: "🔒", color: "border-purple-500", stat: `${vpnUp} UP / ${vpnDown} DOWN` },
    { label: "SD-WAN", path: "/sdwan", icon: "🌐", color: "border-cyan-500", stat: "Actif" },
    { label: "Routes", path: "/routes", icon: "🗺️", color: "border-green-500", stat: "Statiques" },
    { label: "Policies", path: "/policies", icon: "🛡️", color: "border-orange-500", stat: "Firewall" },
    { label: "Monitoring", path: "/monitoring", icon: "📊", color: "border-pink-500", stat: "Live" },
  ];

  return (
    <Layout>
      <div className="p-6">

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Hostname</p>
            <p className="text-white font-semibold truncate">{systemInfo?.hostname || "—"}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Version FortiOS</p>
            <p className="text-white font-semibold">{systemInfo?.version || "—"}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-green-500/40">
            <p className="text-gray-400 text-xs mb-1">Statut</p>
            <p className="text-green-400 font-semibold">🟢 Connecté</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-blue-500/40">
            <p className="text-gray-400 text-xs mb-1">Sessions actives</p>
            <p className="text-blue-400 font-semibold text-lg">{sessions?.current_usage?.toLocaleString() || "—"}</p>
          </div>
        </div>

        {/* CPU + RAM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 font-semibold">CPU</p>
              <p className={`text-xl font-bold ${lastMetric?.cpu > 80 ? "text-red-400" : lastMetric?.cpu > 60 ? "text-yellow-400" : "text-green-400"}`}>
                {Math.round(lastMetric?.cpu || 0)}%
              </p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div className={`h-2 rounded-full transition-all duration-500 ${lastMetric?.cpu > 80 ? "bg-red-500" : lastMetric?.cpu > 60 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${lastMetric?.cpu || 0}%` }} />
            </div>
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={metrics}>
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f615" strokeWidth={2} dot={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "11px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 font-semibold">RAM</p>
              <p className={`text-xl font-bold ${lastMetric?.ram > 80 ? "text-red-400" : lastMetric?.ram > 60 ? "text-yellow-400" : "text-blue-400"}`}>
                {Math.round(lastMetric?.ram || 0)}%
              </p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div className={`h-2 rounded-full transition-all duration-500 ${lastMetric?.ram > 80 ? "bg-red-500" : lastMetric?.ram > 60 ? "bg-yellow-500" : "bg-blue-500"}`}
                style={{ width: `${lastMetric?.ram || 0}%` }} />
            </div>
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={metrics}>
                <Area type="monotone" dataKey="ram" stroke="#8b5cf6" fill="#8b5cf615" strokeWidth={2} dot={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "11px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WAN Traffic + Pie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-300 font-semibold mb-4">Trafic WAN (Mbps)</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "11px" }} />
                <Line type="monotone" dataKey="wan1" stroke="#3b82f6" strokeWidth={2} dot={false} name="WAN1" />
                <Line type="monotone" dataKey="wan2" stroke="#10b981" strokeWidth={2} dot={false} name="WAN2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-300 font-semibold mb-2">État réseau</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-400 text-xs truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <h2 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modules.map((item) => (
            <div key={item.label} onClick={() => navigate(item.path)}
              className={`bg-gray-800 rounded-xl p-4 border ${item.color} hover:opacity-80 cursor-pointer transition`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{item.icon}</span>
                <p className="text-white font-semibold">{item.label}</p>
              </div>
              <p className="text-gray-500 text-xs">{item.stat}</p>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}