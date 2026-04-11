import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    ip: "",
    username: "",
    password: "",
    token: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login({
      ip: form.ip,
      username: form.username,
      token: form.token,
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          FortiManager App
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Connexion FortiGate
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              Adresse IP FortiGate
            </label>
            <input
              type="text"
              name="ip"
              placeholder="192.168.1.1"
              value={form.ip}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              name="username"
              placeholder="admin"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              Token API <span className="text-gray-600">(optionnel)</span>
            </label>
            <input
              type="text"
              name="token"
              placeholder="Votre token FortiGate"
              value={form.token}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200 mt-2"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}