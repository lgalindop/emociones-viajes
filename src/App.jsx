import { useState } from "react";
import Operadores from "./pages/Operadores";
import Cotizaciones from "./pages/Cotizaciones";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import { Home, Users, FileText } from "lucide-react";

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
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "home" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Home size={20} />
                  Inicio
                </button>
                <button
                  onClick={() => setCurrentPage("cotizaciones")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "cotizaciones" || currentPage === "nueva-cotizacion" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <FileText size={20} />
                  Cotizaciones
                </button>
                <button
                  onClick={() => setCurrentPage("operadores")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "operadores" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Users size={20} />
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
              <h2 className="text-2xl font-bold mb-4 text-primary">
                Sistema de Cotizaciones
              </h2>
              <p className="text-gray-600 mb-6">
                Bienvenido al sistema de gestión de cotizaciones para Emociones
                Viajes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentPage("nueva-cotizacion")}
                  className="p-6 border-2 border-primary rounded-lg hover:bg-primary/5 text-left transition-colors"
                >
                  <FileText size={32} className="text-primary mb-2" />
                  <h3 className="font-semibold text-lg">Nueva Cotización</h3>
                  <p className="text-sm text-gray-600">
                    Crear una cotización para un cliente
                  </p>
                </button>
                <button
                  onClick={() => setCurrentPage("cotizaciones")}
                  className="p-6 border-2 border-primary rounded-lg hover:bg-primary/5 text-left transition-colors"
                >
                  <FileText size={32} className="text-primary mb-2" />
                  <h3 className="font-semibold text-lg">Ver Cotizaciones</h3>
                  <p className="text-sm text-gray-600">
                    Ver historial de cotizaciones
                  </p>
                </button>
                <button
                  onClick={() => setCurrentPage("operadores")}
                  className="p-6 border-2 border-primary rounded-lg hover:bg-primary/5 text-left transition-colors"
                >
                  <Users size={32} className="text-primary mb-2" />
                  <h3 className="font-semibold text-lg">Operadores</h3>
                  <p className="text-sm text-gray-600">
                    Gestionar operadores turísticos
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === "operadores" && <Operadores />}
      {currentPage === "cotizaciones" && (
        <Cotizaciones
          onNewCotizacion={() => setCurrentPage("nueva-cotizacion")}
        />
      )}
      {currentPage === "nueva-cotizacion" && (
        <NuevaCotizacion
          onBack={() => setCurrentPage("cotizaciones")}
          onSuccess={() => setCurrentPage("cotizaciones")}
        />
      )}
    </div>
  );
}

export default App;
