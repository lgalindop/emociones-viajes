import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Edit2, Trash2, Search, X, Users } from "lucide-react";
import Toast from "../components/ui/Toast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import OperatorModal from "../components/operators/OperatorModal";

export default function Operators() {
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("activos"); // 'activos', 'todos'
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    fetchOperators();
  }, []);

  async function fetchOperators() {
    try {
      let query = supabase
        .from("operadores")
        .select(
          `
          *,
          opciones_cotizacion!fk_opciones_operador(count)
        `
        )
        .order("nombre");

      // Apply status filter
      if (statusFilter === "activos") {
        query = query.eq("activo", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data to add usage count
      const processedData = (data || []).map((op) => ({
        ...op,
        opciones_count: op.opciones_cotizacion?.[0]?.count || 0,
      }));

      setOperadores(processedData);
    } catch (error) {
      console.error("Error fetching operadores:", error);
      showToast("Error al cargar operadores", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    setDeleteConfirm(id);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;

    try {
      // Soft delete (mark as inactive)
      const { error } = await supabase
        .from("operadores")
        .update({ activo: false })
        .eq("id", deleteConfirm);

      if (error) throw error;
      showToast("Operador eliminado");
      fetchOperators();
    } catch (error) {
      console.error("Error deleting operador:", error);
      showToast("Error al eliminar operador", "error");
    } finally {
      setDeleteConfirm(null);
    }
  }

  function handleEdit(operador) {
    setEditingOperator(operador);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditingOperator(null);
  }

  function handleModalSuccess() {
    setShowModal(false);
    setEditingOperator(null);
    fetchOperators();
    showToast(editingOperator ? "Operador actualizado" : "Operador creado");
  }

  // Filter operators
  const filteredOperadores = useMemo(() => {
    if (!searchTerm) return operadores;

    const searchLower = searchTerm.toLowerCase();
    return operadores.filter(
      (op) =>
        op.nombre?.toLowerCase().includes(searchLower) ||
        op.contacto?.toLowerCase().includes(searchLower) ||
        op.sitio_web?.toLowerCase().includes(searchLower)
    );
  }, [operadores, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando operadores...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div>
            <h1 className="text-xl font-bold text-primary">Operadores</h1>
            <p className="text-xs text-gray-600">
              {filteredOperadores.length} de {operadores.length} operadores
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Nuevo Operador</span>
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
                placeholder="Buscar por nombre, contacto, sitio web..."
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

            {/* Status Filter Buttons */}
            <div className="flex gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  setStatusFilter("activos");
                  fetchOperators();
                }}
                className={`flex-1 sm:flex-initial sm:min-w-[70px] px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  statusFilter === "activos"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => {
                  setStatusFilter("todos");
                  fetchOperators();
                }}
                className={`flex-1 sm:flex-initial sm:min-w-[70px] px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  statusFilter === "todos"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
            </div>
          </div>
        </div>

        {/* Operators List */}
        {filteredOperadores.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">
              No hay operadores
            </h3>
            <p className="text-xs text-gray-500">
              {searchTerm || statusFilter !== "activos"
                ? "Intenta ajustar los filtros"
                : "Comienza agregando tu primer operador"}
            </p>
            {!searchTerm && statusFilter === "activos" && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
              >
                Agregar Primer Operador
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredOperadores.map((operador) => {
              const usageCount = operador.opciones_count || 0;

              return (
                <div
                  key={operador.id}
                  onClick={() => handleEdit(operador)}
                  className={`bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer ${
                    !operador.activo ? "opacity-50" : ""
                  }`}
                >
                  <div className="p-1.5 flex items-center gap-2 text-xs">
                    {/* Operator name and commission */}
                    <div className="flex flex-col gap-0.5 min-w-[120px] flex-1">
                      <span className="font-bold text-gray-900 truncate">
                        {operador.nombre}
                        {!operador.activo && (
                          <span className="ml-2 text-[10px] text-red-600 font-normal">
                            (Inactivo)
                          </span>
                        )}
                      </span>
                      {operador.comision && (
                        <span className="text-green-600 text-[10px] font-semibold">
                          {operador.comision}% comisión
                        </span>
                      )}
                    </div>

                    {/* Contact info - hide on mobile */}
                    <div className="hidden sm:flex flex-col items-center min-w-[100px]">
                      {operador.contacto ? (
                        <span className="text-gray-900 truncate w-full text-center text-[10px]">
                          {operador.contacto}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">
                          Sin contacto
                        </span>
                      )}
                    </div>

                    {/* Website - hide on mobile */}
                    <div className="hidden md:flex flex-col items-center min-w-[140px]">
                      {operador.sitio_web ? (
                        <a
                          href={operador.sitio_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline truncate w-full text-center text-[10px]"
                        >
                          {operador.sitio_web.replace(
                            /^https?:\/\/(www\.)?/,
                            ""
                          )}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-[10px]">
                          Sin sitio web
                        </span>
                      )}
                    </div>

                    {/* Usage count */}
                    <div className="flex flex-col items-center min-w-[50px]">
                      <span className="text-[10px] text-gray-600">
                        Usado:{" "}
                        <span className="font-semibold text-gray-900">
                          {usageCount}
                        </span>
                      </span>
                      <span className="text-[10px] text-gray-500">
                        cotizaciones
                      </span>
                    </div>

                    {/* Notes indicator */}
                    {operador.notas && (
                      <span
                        className="cursor-help text-gray-400 hover:text-gray-600"
                        title={
                          operador.notas.length > 100
                            ? operador.notas.substring(0, 100) + "..."
                            : operador.notas
                        }
                      >
                        📝
                      </span>
                    )}

                    {/* Actions - hide on mobile */}
                    <div className="hidden md:flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(operador);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(operador.id);
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

        {/* Modal */}
        {showModal && (
          <OperatorModal
            operator={editingOperator}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
          />
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Eliminar Operador"
          message="¿Seguro que quieres eliminar este operador? Esta acción marcará el operador como inactivo."
          variant="danger"
          confirmText="Eliminar"
        />
      </div>
    </div>
  );
}
