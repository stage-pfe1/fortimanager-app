import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-blue-400 text-8xl font-bold mb-4">404</p>
        <h1 className="text-white text-2xl font-semibold mb-2">
          Page introuvable
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          La page que vous cherchez n'existe pas.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition">
            🏠 Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm transition">
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
}