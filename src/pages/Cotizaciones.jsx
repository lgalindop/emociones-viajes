// pages/Cotizaciones.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Eye, Edit2, FileText, Trash2 } from "lucide-react";

export default function Cotizaciones({
  onNueva,
  onVer,
  onEdit,
  onPdf,
  onDelete,
}) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  async function fetchCotizaciones() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*, opciones_cotizacion(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (err) {
      console.error(err);
      alert("Error al cargar cotizaciones");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Cotizaciones</h1>
          <button
            onClick={onNueva}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={18} /> Nueva Cotización
          </button>
        </div>

        <div className="bg-white rounded-lg shadow divide-y">
          {cotizaciones.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No hay cotizaciones
            </div>
          )}

          {cotizaciones.map((cot) => (
            <div key={cot.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm text-gray-500">
                      {cot.folio}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      {cot.estatus || "nueva"}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg">
                    {cot.cliente_nombre}
                  </h3>
                  <p className="text-sm text-gray-600">✈️ {cot.destino}</p>
                  <p className="text-sm text-gray-600">
                    📅 {formatDate(cot.fecha_salida)} —{" "}
                    {formatDate(cot.fecha_regreso)}
                  </p>

                  <p className="text-sm text-gray-600 mt-2">
                    {cot.divisa || "MXN"} $
                    {Number(cot.presupuesto_aprox || 0).toLocaleString()}
                  </p>

                  {cot.opciones_cotizacion &&
                    cot.opciones_cotizacion.length > 0 && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Opciones:</strong>{" "}
                        {cot.opciones_cotizacion.length}
                      </div>
                    )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onVer && onVer(cot)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Ver"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={() => onEdit && onEdit(cot)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    onClick={() => onPdf && onPdf(cot)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                    title="PDF"
                  >
                    <FileText size={18} />
                  </button>

                  <button
                    onClick={() => onDelete && onDelete(cot)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
