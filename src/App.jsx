// App.jsx
import { useState } from "react";
import Operadores from "./pages/Operadores";
import Cotizaciones from "./pages/Cotizaciones";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import EditarCotizacion from "./pages/EditarCotizacion";
import DetalleCotizacion from "./pages/DetalleCotizacion";
import PropuestaPDF from "./pages/PropuestaPDF";
import { Home } from "lucide-react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);

  function openDetalle(cot) {
    setSelectedCotizacion(cot);
    setCurrentPage("detalle");
  }

  function openEditar(cot) {
    setSelectedCotizacion(cot);
    setCurrentPage("editar");
  }

  function openPDF(cot) {
    setSelectedCotizacion(cot);
    setCurrentPage("propuesta");
  }

  async function deleteCotizacion(cot) {
    if (!confirm("¿Seguro que quieres eliminar esta cotización?")) return;
    try {
      const { error } = await supabase
        .from("cotizaciones")
        .delete()
        .eq("id", cot.id);
      if (error) throw error;
      alert("Cotización eliminada");
      setCurrentPage("cotizaciones");
    } catch (err) {
      console.error(err);
      alert("Error eliminando cotización");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
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
                <button
                  onClick={() => setCurrentPage("cotizaciones")}
                  className={`px-4 py-2 rounded ${currentPage === "cotizaciones" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  Cotizaciones
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Pages */}
      {currentPage === "home" && (
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-2">Sistema de Cotizaciones</h2>
            <p className="text-gray-600">
              Administra cotizaciones, opciones y propuestas.
            </p>
          </div>
        </div>
      )}

      {currentPage === "operadores" && <Operadores />}

      {currentPage === "cotizaciones" && (
        <Cotizaciones
          onNueva={() => setCurrentPage("nueva")}
          onVer={openDetalle}
          onEdit={openEditar}
          onPdf={openPDF}
          onDelete={deleteCotizacion}
        />
      )}

      {currentPage === "nueva" && (
        <NuevaCotizacion
          onBack={() => setCurrentPage("cotizaciones")}
          onSuccess={() => setCurrentPage("cotizaciones")}
        />
      )}

      {currentPage === "detalle" && selectedCotizacion && (
        <DetalleCotizacion
          cotizacion={selectedCotizacion}
          onBack={() => setCurrentPage("cotizaciones")}
        />
      )}

      {currentPage === "editar" && selectedCotizacion && (
        <EditarCotizacion
          cotizacion={selectedCotizacion}
          onBack={() => setCurrentPage("cotizaciones")}
          onSuccess={() => setCurrentPage("cotizaciones")}
        />
      )}

      {currentPage === "propuesta" && selectedCotizacion && (
        <PropuestaPDF
          cotizacion={selectedCotizacion}
          onBack={() => setCurrentPage("cotizaciones")}
        />
      )}
    </div>
  );
}
