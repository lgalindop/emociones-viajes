import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Calendar,
  User,
  Search,
  Filter,
} from "lucide-react";
import GroupModal from "../components/groups/GroupModal";
import { useNavigate } from "react-router-dom";

export default function Groups() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("activos"); // 'activos', 'pasados', 'todos'
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const { data, error } = await supabase
        .from("grupos")
        .select(
          `
          *,
          cotizaciones (
            id,
            ventas!ventas_cotizacion_id_fkey (id)
          ),
          ventas!ventas_grupo_id_fkey (count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Process grupos
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
      fetchGroups();
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

  // Memoize filtered grupos to avoid recalculating on every render
  const filteredGrupos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = grupos;

    // Date filter
    if (dateFilter === "activos") {
      filtered = filtered.filter((grupo) => {
        if (!grupo.fecha_evento) return true;
        const eventDate = new Date(grupo.fecha_evento + "T00:00:00");
        return eventDate >= today;
      });
    } else if (dateFilter === "pasados") {
      filtered = filtered.filter((grupo) => {
        if (!grupo.fecha_evento) return false;
        const eventDate = new Date(grupo.fecha_evento + "T00:00:00");
        return eventDate < today;
      });
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((grupo) =>
        grupo.nombre?.toLowerCase().includes(searchLower) ||
        grupo.coordinador_nombre?.toLowerCase().includes(searchLower) ||
        grupo.tipo?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [grupos, dateFilter, searchTerm]);

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
        <div>
          <h1 className="text-3xl font-bold text-primary">Grupos</h1>
          <p className="text-gray-600 mt-1">
            {filteredGrupos.length} de {grupos.length} grupos
          </p>
        </div>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, coordinador, tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter("activos")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === "activos"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setDateFilter("pasados")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === "pasados"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pasados
            </button>
            <button
              onClick={() => setDateFilter("todos")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === "todos"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Groups List */}
      {filteredGrupos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm || dateFilter !== "todos"
              ? "No hay grupos que coincidan con los filtros"
              : "No hay grupos registrados"}
          </p>
          {!searchTerm && dateFilter === "todos" && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Crear Primer Grupo
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cotiz. / Ventas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGrupos.map((grupo) => {
                const isPast =
                  grupo.fecha_evento &&
                  new Date(grupo.fecha_evento + "T00:00:00") < new Date();

                return (
                  <tr
                    key={grupo.id}
                    className={`hover:bg-gray-50 ${isPast ? "opacity-60" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {grupo.nombre}
                      </div>
                      {grupo.notas && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {grupo.notas}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          tipoColors[grupo.tipo] || tipoColors.otro
                        }`}
                      >
                        {tipoLabels[grupo.tipo] || "Otro"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {grupo.fecha_evento ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-gray-400" />
                          <span>
                            {new Date(
                              grupo.fecha_evento + "T00:00:00"
                            ).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {isPast && (
                            <span className="text-xs text-red-600">
                              (Pasado)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin fecha</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {grupo.coordinador_nombre ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {grupo.coordinador_nombre}
                          </div>
                          {grupo.coordinador_telefono && (
                            <div className="text-xs text-gray-500">
                              {grupo.coordinador_telefono}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Sin coordinador
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Cotiz:</span>{" "}
                          <span className="font-semibold">
                            {grupo.cotizaciones_count || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Ventas:</span>{" "}
                          <span className="font-semibold text-green-600">
                            {grupo.ventas_count || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/app/grupos/${grupo.id}`)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium"
                        >
                          Ver
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <GroupModal
          group={editingGrupo}
          onClose={() => {
            setShowModal(false);
            setEditingGrupo(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingGrupo(null);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}
