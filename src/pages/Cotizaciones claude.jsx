import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Eye, Edit2, FileText } from "lucide-react";

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Cotizaciones</h1>

          <a
            href="/nueva-cotizacion"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} />
            Nueva Cotización
          </a>
        </div>

        {/* Lista de cotizaciones */}
        <div className="bg-white rounded-lg shadow">
          {cotizaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay cotizaciones registradas. Crea la primera.
            </div>
          ) : (
            <div className="divide-y">
              {cotizaciones.map((cot) => (
                <div key={cot.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gray-500">
                          {cot.folio}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEstatusColor(cot.estatus)}`}
                        >
                          {cot.estatus}
                        </span>
                      </div>

                      <h3 className="font-semibold text-lg">
                        {cot.cliente_nombre}
                      </h3>

                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>✈️ {cot.destino}</p>
                        <p>
                          📅 {formatDate(cot.fecha_salida)} -{" "}
                          {formatDate(cot.fecha_regreso)}
                        </p>
                        <p>
                          👥 {cot.num_adultos} adultos
                          {cot.num_ninos > 0 && `, ${cot.num_ninos} niños`}
                        </p>
                        {cot.presupuesto_aprox && (
                          <p>
                            💰 Presupuesto: $
                            {cot.presupuesto_aprox.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {cot.notas && (
                        <p className="mt-2 text-sm text-gray-500 italic">
                          {cot.notas}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                        title="Generar propuesta"
                      >
                        <FileText size={18} />
                      </button>
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
