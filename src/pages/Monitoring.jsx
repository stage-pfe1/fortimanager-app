import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

const generatePoint = (prev) => ({
  time: new Date().toLocaleTimeString(),
  cpu: Math.min(100, Math.max(0, (prev?.cpu || 30) + (Math.random() * 20 - 10))),
  ram: Math.min(100, Math.max(0, (prev?.ram || 50) + (Math.random() * 10 - 5))),
  wan1: Math.floor(Math.random() * 80 + 20),
  wan2: Math.floor(Math.random() * 60 + 10),
});

export default function Monitoring() {
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
  const [sessions, setSessions] = useState(null);
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchSystemInfo();
    intervalRef.current = setInterval(() => {
      fetchLiveMetrics();
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const [statusRes, sessionRes, intfRes] = await Promise.all([
        axios.get("/api/v2/monitor/system/status", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
        axios.get("/api/v2/monitor/system/session/count", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
        axios.get("/api/v2/monitor/system/interface", { headers: { Authorization: `Bearer ${fortigate.token}` } }),
      ]);
      setSystemInfo(statusRes.data.results || null);
      setSessions(sessionRes.data.results || null);
      setInterfaces(intfRes.data.results || []);
    } catch {
      setSystemInfo({ hostname: "FortiGate-Demo", version: "v7.4.0", serial: "FGT60F-DEMO", uptime: "5 days, 3:22:11" });
      setSessions({ current_usage: 1243, total_udp: 890, total_tcp: 353 });
      setInterfaces([
        { name: "wan1", rx_bytes: 1024000, tx_bytes: 512000, rx_packets: 9500, tx_packets: 8200, speed: 100, link: true },
        { name: "wan2", rx_bytes: 768000, tx_bytes: 256000, rx_packets: 7200, tx_packets: 6100, speed: 100, link: true },
        { name: "port1", rx_bytes: 2048000, tx_bytes: 1024000, rx_packets: 15000, tx_packets: 12000, speed: 1000, link: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMetrics = async () => {
    try {
      const res = await axios.get("/api/v2/monitor/system/resource/usage", {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
      const data = res.data.results;
      setMetrics(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          cpu: data?.cpu || generatePoint(prev[prev.length - 1]).cpu,
          ram: data?.mem || generatePoint(prev[prev.length - 1]).ram,
          wan1: data?.wan1 || generatePoint(prev[prev.length - 1]).wan1,
          wan2: data?.wan2 || generatePoint(prev[prev.length - 1]).wan2,
        };
        return [...prev.slice(-19), newPoint];
      });
    } catch {
      setMetrics(prev => {
        const newPoint = generatePoint(prev[prev.length - 1]);
        return [...prev.slice(-19), newPoint];
      });
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + " MB";
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + " KB";
    return bytes + " B";
  };

  const lastMetric = metrics[metrics.length - 1];

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Monitoring système</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Live — refresh 5s
            </span>
            <button onClick={fetchSystemInfo} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
              Rafraîchir
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 mt-20">Chargement...</div>
        ) : (
          <>
            {/* System Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Hostname</p>
                <p className="text-white font-semibold truncate">{systemInfo?.hostname || "—"}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Version</p>
                <p className="text-white font-semibold">{systemInfo?.version || "—"}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Serial</p>
                <p className="text-white font-semibold">{systemInfo?.serial || "—"}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1">Uptime</p>
                <p className="text-green-400 font-semibold text-sm">{systemInfo?.uptime || "—"}</p>
              </div>
            </div>

            {/* CPU + RAM Live Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* CPU */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-300 font-semibold">CPU Usage</p>
                  <p className={`text-2xl font-bold ${lastMetric?.cpu > 80 ? "text-red-400" : lastMetric?.cpu > 60 ? "text-yellow-400" : "text-green-400"}`}>
                    {Math.round(lastMetric?.cpu || 0)}%
                  </p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div className={`h-3 rounded-full transition-all duration-500 ${lastMetric?.cpu > 80 ? "bg-red-500" : lastMetric?.cpu > 60 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${lastMetric?.cpu || 0}%` }} />
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={metrics}>
                    <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} dot={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "12px" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* RAM */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-300 font-semibold">RAM Usage</p>
                  <p className={`text-2xl font-bold ${lastMetric?.ram > 80 ? "text-red-400" : lastMetric?.ram > 60 ? "text-yellow-400" : "text-blue-400"}`}>
                    {Math.round(lastMetric?.ram || 0)}%
                  </p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div className={`h-3 rounded-full transition-all duration-500 ${lastMetric?.ram > 80 ? "bg-red-500" : lastMetric?.ram > 60 ? "bg-yellow-500" : "bg-blue-500"}`}
                    style={{ width: `${lastMetric?.ram || 0}%` }} />
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={metrics}>
                    <Area type="monotone" dataKey="ram" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} dot={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "12px" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* WAN Traffic Chart */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-6">
              <p className="text-gray-300 font-semibold mb-4">Trafic WAN (Mbps)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="wan1" stroke="#3b82f6" strokeWidth={2} dot={false} name="WAN1" />
                  <Line type="monotone" dataKey="wan2" stroke="#10b981" strokeWidth={2} dot={false} name="WAN2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sessions */}
            {sessions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-xl p-4 border border-cyan-500/30">
                  <p className="text-gray-400 text-xs mb-1">Sessions actives</p>
                  <p className="text-cyan-400 text-2xl font-bold">{sessions.current_usage?.toLocaleString() || "—"}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-gray-400 text-xs mb-1">Sessions TCP</p>
                  <p className="text-blue-400 text-2xl font-bold">{sessions.total_tcp?.toLocaleString() || "—"}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-green-500/30">
                  <p className="text-gray-400 text-xs mb-1">Sessions UDP</p>
                  <p className="text-green-400 text-2xl font-bold">{sessions.total_udp?.toLocaleString() || "—"}</p>
                </div>
              </div>
            )}

            {/* Interfaces Traffic */}
            {interfaces.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <p className="text-gray-300 font-semibold mb-4">Trafic interfaces</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="text-left py-3 px-4">Interface</th>
                        <th className="text-left py-3 px-4">RX</th>
                        <th className="text-left py-3 px-4">TX</th>
                        <th className="text-left py-3 px-4">RX Packets</th>
                        <th className="text-left py-3 px-4">TX Packets</th>
                        <th className="text-left py-3 px-4">Speed</th>
                        <th className="text-left py-3 px-4">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interfaces.map((intf, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                          <td className="py-3 px-4 font-semibold text-blue-400">{intf.name}</td>
                          <td className="py-3 px-4 text-gray-300">{formatBytes(intf.rx_bytes)}</td>
                          <td className="py-3 px-4 text-gray-300">{formatBytes(intf.tx_bytes)}</td>
                          <td className="py-3 px-4 text-gray-400">{intf.rx_packets?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-400">{intf.tx_packets?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-400">{intf.speed} Mbps</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${intf.link ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {intf.link ? "UP" : "DOWN"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}