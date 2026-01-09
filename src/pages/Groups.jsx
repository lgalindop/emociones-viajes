import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  User,
  Search,
  Filter,
  X,
} from "lucide-react";
import GroupModal from "../components/groups/GroupModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Toast from "../components/ui/Toast";
import { useNavigate } from "react-router-dom";

export default function Groups() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("activos"); // 'activos', 'pasados', 'todos'
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, grupo: null });
  const [toast, setToast] = useState(null);
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
          cotizaciones!cotizaciones_grupo_id_fkey (
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

  async function handleDelete(grupo) {
    try {
      const { error } = await supabase.from("grupos").delete().eq("id", grupo.id);

      if (error) throw error;
      setToast({ message: "Grupo eliminado correctamente", type: "success" });
      fetchGroups();
      setDeleteConfirm({ open: false, grupo: null });
    } catch (error) {
      console.error("Error:", error);
      setToast({ message: "Error al eliminar grupo", type: "error" });
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
      filtered = filtered.filter(
        (grupo) =>
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
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div>
            <h1 className="text-xl font-bold text-primary">Grupos</h1>
            <p className="text-xs text-gray-600">
              {filteredGrupos.length} de {grupos.length} grupos
            </p>
          </div>
          <button
            onClick={() => {
              setEditingGrupo(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Nuevo Grupo</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-2 mb-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search bar */}
            <div className="flex-1 relative">
              <Search
                size={14}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, coordinador, tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Date Filter Buttons */}
            <div className="flex gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setDateFilter("activos")}
                className={`flex-1 sm:flex-initial sm:min-w-[70px] px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  dateFilter === "activos"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setDateFilter("pasados")}
                className={`flex-1 sm:flex-initial sm:min-w-[70px] px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  dateFilter === "pasados"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pasados
              </button>
              <button
                onClick={() => setDateFilter("todos")}
                className={`flex-1 sm:flex-initial sm:min-w-[70px] px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
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
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">
              No hay grupos
            </h3>
            <p className="text-xs text-gray-500">
              {searchTerm || dateFilter !== "todos"
                ? "Intenta ajustar los filtros"
                : "Comienza creando tu primer grupo"}
            </p>
            {!searchTerm && dateFilter === "todos" && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
              >
                Crear Primer Grupo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredGrupos.map((grupo) => {
              const isPast =
                grupo.fecha_evento &&
                new Date(grupo.fecha_evento + "T00:00:00") < new Date();

              return (
                <div
                  key={grupo.id}
                  onClick={() => navigate(`/app/grupos/${grupo.id}`)}
                  className={`bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer ${
                    isPast ? "opacity-60" : ""
                  }`}
                >
                  <div className="p-1.5 flex items-center gap-2 text-xs">
                    {/* Grupo name and tipo badge */}
                    <div className="flex flex-col gap-0.5 min-w-[100px]">
                      <span className="font-bold text-gray-900 truncate">
                        {grupo.nombre}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-full w-fit ${
                          tipoColors[grupo.tipo] || tipoColors.otro
                        }`}
                      >
                        {tipoLabels[grupo.tipo] || "Otro"}
                      </span>
                    </div>

                    {/* Fecha evento */}
                    <div className="flex flex-col items-center min-w-0 flex-1">
                      {grupo.fecha_evento ? (
                        <>
                          <span className="text-gray-600 whitespace-nowrap">
                            {new Date(
                              grupo.fecha_evento + "T00:00:00"
                            ).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {isPast && (
                            <span className="text-[10px] text-red-600">
                              (Pasado)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-0.5">
                          <span className="text-[10px]">⚠️</span>
                          <span className="text-gray-400 text-[10px]">Sin fecha</span>
                        </span>
                      )}
                    </div>

                    {/* Coordinador - hide on very small screens */}
                    <div className="hidden sm:flex flex-col items-center min-w-[90px]">
                      {grupo.coordinador_nombre ? (
                        <div className="group relative flex flex-col items-center">
                          <span className="text-gray-900 truncate w-full text-center font-medium cursor-help">
                            {grupo.coordinador_nombre}
                          </span>
                          {grupo.coordinador_email && (
                            <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap -top-8 left-1/2 transform -translate-x-1/2 shadow-lg">
                              {grupo.coordinador_email}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                          {grupo.coordinador_telefono && (
                            <span className="text-gray-500 text-[10px]">
                              {grupo.coordinador_telefono}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-0.5">
                          <span className="text-[10px]">⚠️</span>
                          <span className="text-gray-400 text-[10px]">Sin coord.</span>
                        </span>
                      )}
                    </div>

                    {/* Cotiz / Ventas counts */}
                    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
                      <div className="flex gap-2 text-[10px] items-center">
                        <span className="text-gray-600">
                          C:{" "}
                          <span className="font-semibold text-gray-900">
                            {grupo.cotizaciones_count || 0}
                          </span>
                        </span>
                        <span className="text-gray-600">
                          V:{" "}
                          <span className="font-semibold text-green-600">
                            {grupo.ventas_count || 0}
                          </span>
                        </span>
                        {grupo.notas && (
                          <span
                            className="cursor-help text-gray-400 hover:text-gray-600"
                            title={grupo.notas.length > 100 ? grupo.notas.substring(0, 100) + '...' : grupo.notas}
                          >
                            📝
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions - hide on mobile, show on click */}
                    <div className="hidden md:flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGrupo(grupo);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, grupo });
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, grupo: null })}
        onConfirm={() => handleDelete(deleteConfirm.grupo)}
        title="Eliminar Grupo"
        message={`¿Eliminar "${deleteConfirm.grupo?.nombre}"? Las cotizaciones y ventas asociadas no se eliminarán.`}
        confirmText="Eliminar"
        variant="danger"
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
