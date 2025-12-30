import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Edit2, Trash2, Users, Calendar, User } from "lucide-react";
import GrupoModal from "../components/grupos/GrupoModal";
import { useNavigate } from "react-router-dom";

export default function Grupos() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrupos();
  }, []);

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase
        .from("grupos")
        .select(
          `
          *,
          cotizaciones (
            id,
            ventas (id)
          ),
          ventas (count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out converted cotizaciones and count remaining
      const processedGrupos = (data || []).map((grupo) => {
        const unconvertedCotizaciones =
          grupo.cotizaciones?.filter(
            (cot) => !cot.ventas || cot.ventas.length === 0
          ) || [];

        return {
          ...grupo,
          cotizaciones_count: unconvertedCotizaciones.length,
          ventas_count: grupo.ventas?.[0]?.count || 0,
        };
      });

      setGrupos(processedGrupos);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(
        "¿Eliminar este grupo? Las cotizaciones/ventas no se eliminarán."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("grupos").delete().eq("id", id);

      if (error) throw error;
      fetchGrupos();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar grupo");
    }
  }

  const tipoLabels = {
    boda: "Boda",
    torneo: "Torneo",
    corporativo: "Corporativo",
    otro: "Otro",
  };

  const tipoColors = {
    boda: "bg-pink-100 text-pink-800",
    torneo: "bg-blue-100 text-blue-800",
    corporativo: "bg-purple-100 text-purple-800",
    otro: "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando grupos...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Grupos</h1>
        <button
          onClick={() => {
            setEditingGrupo(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus size={20} />
          Nuevo Grupo
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">No hay grupos registrados</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Crear Primer Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {grupo.nombre}
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        tipoColors[grupo.tipo] || tipoColors.otro
                      }`}
                    >
                      {tipoLabels[grupo.tipo] || "Otro"}
                    </span>
                  </div>
                </div>

                {grupo.fecha_evento && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar size={16} />
                    <span>
                      {new Date(
                        grupo.fecha_evento + "T00:00:00"
                      ).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {grupo.coordinador_nombre && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <User size={16} />
                    <span>{grupo.coordinador_nombre}</span>
                  </div>
                )}

                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cotizaciones:</span>
                    <span className="font-semibold">
                      {grupo.cotizaciones_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Ventas:</span>
                    <span className="font-semibold text-green-600">
                      {grupo.ventas_count || 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/app/grupos/${grupo.id}`)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium"
                  >
                    Ver Detalles
                  </button>
                  <button
                    onClick={() => {
                      setEditingGrupo(grupo);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(grupo.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <GrupoModal
          grupo={editingGrupo}
          onClose={() => {
            setShowModal(false);
            setEditingGrupo(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingGrupo(null);
            fetchGrupos();
          }}
        />
      )}
    </div>
  );
}
