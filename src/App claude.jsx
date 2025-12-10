import { useState } from "react";
import Operadores from "./pages/Operadores";
import { Home } from "lucide-react";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Emociones Viajes</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage("home")}
                  className={`px-4 py-2 rounded ${currentPage === "home" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Home size={20} className="inline mr-2" />
                  Inicio
                </button>
                <button
                  onClick={() => setCurrentPage("operadores")}
                  className={`px-4 py-2 rounded ${currentPage === "operadores" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  Operadores
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {currentPage === "home" && (
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">
                Sistema de Cotizaciones
              </h2>
              <p className="text-gray-600">
                Bienvenido al sistema de gestión de cotizaciones para Emociones
                Viajes.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentPage === "operadores" && <Operadores />}
    </div>
  );
}

export default App;
