import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

const demoInterfaces = [
  { name: "port1", ip: "192.168.1.1", mask: "24", type: "physical", status: "up", speed: "1000" },
  { name: "port2", ip: "10.0.0.1", mask: "30", type: "physical", status: "up", speed: "1000" },
  { name: "wan1", ip: "203.0.113.1", mask: "24", type: "physical", status: "up", speed: "100" },
  { name: "ssl.root", ip: "10.212.134.0", mask: "24", type: "tunnel", status: "up", speed: "—" },
  { name: "loopback", ip: "127.0.0.1", mask: "8", type: "loopback", status: "up", speed: "—" },
];

export default function Interfaces() {
  const { fortigate } = useAuth();
  const navigate = useNavigate();
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fortigate) { navigate("/login"); return; }
    fetchInterfaces();
  }, []);

  const fetchInterfaces = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/cmdb/system/interface", {
        headers: { Authorization: `Bearer ${fortigate.token}` },
      });
      const data = res.data.results || [];
      setInterfaces(data.length > 0 ? data : demoInterfaces);
    } catch {
      setError("Mode demo — FortiGate non connecté");
      setInterfaces(demoInterfaces);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Interfaces réseau</h2>
          <button onClick={fetchInterfaces} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition">
            Rafraîchir
          </button>
        </div>

        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg mb-4 text-sm">⚠ {error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 mt-20">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-3 px-4">Nom</th>
                  <th className="text-left py-3 px-4">IP / Masque</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Vitesse</th>
                </tr>
              </thead>
              <tbody>
                {interfaces.map((intf, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 font-semibold text-blue-400">{intf.name}</td>
                    <td className="py-3 px-4 text-gray-300">{intf.ip}/{intf.mask}</td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">{intf.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        intf.status === "up" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>{intf.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{intf.speed} {intf.speed !== "—" ? "Mbps" : ""}</td>
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