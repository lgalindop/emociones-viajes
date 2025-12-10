import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Eye, FileText } from "lucide-react";
import DetallesCotizacion from "./DetallesCotizacion";

export default function Cotizaciones({ onNewCotizacion }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState(null);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  async function fetchCotizaciones() {
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (error) {
      console.error("Error fetching cotizaciones:", error);
      alert("Error al cargar cotizaciones");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getEstatusColor(estatus) {
    const colors = {
      nueva: "bg-blue-100 text-blue-800",
      enviada: "bg-purple-100 text-purple-800",
      seguimiento: "bg-yellow-100 text-yellow-800",
      cerrada: "bg-green-100 text-green-800",
      perdida: "bg-red-100 text-red-800",
    };
    return colors[estatus] || "bg-gray-100 text-gray-800";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (selectedCotizacionId) {
    return (
      <DetallesCotizacion
        cotizacionId={selectedCotizacionId}
        onBack={() => setSelectedCotizacionId(null)}
        onDeleted={() => {
          setSelectedCotizacionId(null);
          fetchCotizaciones();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Cotizaciones</h1>

          <button
            onClick={onNewCotizacion}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Nueva Cotización
          </button>
        </div>

        {/* Lista de cotizaciones */}
        <div className="bg-white rounded-lg shadow">
          {cotizaciones.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                No hay cotizaciones registradas
              </p>
              <button
                onClick={onNewCotizacion}
                className="text-primary hover:underline"
              >
                Crea la primera cotización
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {cotizaciones.map((cot) => (
                <div
                  key={cot.id}
                  onClick={() => setSelectedCotizacionId(cot.id)}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gray-500 font-semibold">
                          {cot.folio}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getEstatusColor(cot.estatus)}`}
                        >
                          {cot.estatus}
                        </span>
                      </div>

                      <h3 className="font-semibold text-xl mb-2">
                        {cot.cliente_nombre}
                      </h3>

                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <span>✈️</span>
                          <span className="font-medium">{cot.destino}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span>📅</span>
                          <span>
                            {formatDate(cot.fecha_salida)} -{" "}
                            {formatDate(cot.fecha_regreso)}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span>👥</span>
                          <span>
                            {cot.num_adultos} adulto(s)
                            {cot.num_ninos > 0 && `, ${cot.num_ninos} niño(s)`}
                          </span>
                        </p>
                        {cot.presupuesto_aprox && (
                          <p className="flex items-center gap-2">
                            <span>💰</span>
                            <span>
                              Presupuesto: $
                              {parseFloat(cot.presupuesto_aprox).toLocaleString(
                                "es-MX"
                              )}
                            </span>
                          </p>
                        )}
                        {cot.cliente_telefono && (
                          <p className="flex items-center gap-2">
                            <span>📞</span>
                            <span>{cot.cliente_telefono}</span>
                          </p>
                        )}
                      </div>

                      {cot.notas && (
                        <p className="mt-3 text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                          {cot.notas}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
