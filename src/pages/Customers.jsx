import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Search,
  Plus,
  User,
  Building2,
  Users,
  Phone,
  Mail,
  Filter,
  ChevronDown,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  ArrowUpDown,
  X,
} from "lucide-react";
import CustomerQuickCreate from "../components/customers/CustomerQuickCreate";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Toast from "../components/ui/Toast";

export default function Customers({ onViewDetails }) {
  const { canEdit, canDelete } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterTag, setFilterTag] = useState("");
  const [sortBy, setSortBy] = useState("nombre_completo");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    cliente: null,
  });
  const [allTags, setAllTags] = useState([]);
  const [toast, setToast] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    individual: 0,
    corporate: 0,
    agency: 0,
  });

  useEffect(() => {
    fetchClientes();
  }, [searchQuery, filterTipo, filterTag, sortBy, sortOrder]);

  async function fetchClientes() {
    setLoading(true);
    try {
      let query = supabase
        .from("clientes")
        .select(
          `
          *,
          cotizaciones!cotizaciones_cliente_id_fkey(
            id,
            ventas!ventas_cotizacion_id_fkey(id)
          )
        `
        )
        .eq("is_active", true);

      // Search
      if (searchQuery) {
        query = query.or(
          `nombre_completo.ilike.%${searchQuery}%,telefono.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }

      // Filter by tipo
      if (filterTipo !== "all") {
        query = query.eq("tipo", filterTipo);
      }

      // Filter by tag
      if (filterTag) {
        query = query.contains("etiquetas", [filterTag]);
      }

      // Sort
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Calculate cotizaciones and ventas counts from relationships
      const processedClientes = (data || []).map((cliente) => {
        // Count ALL cotizaciones (both converted and unconverted)
        const cotizacionesCount = cliente.cotizaciones?.length || 0;

        // Count ALL ventas across all cotizaciones
        const ventasCount =
          cliente.cotizaciones?.reduce((total, cot) => {
            return total + (cot.ventas?.length || 0);
          }, 0) || 0;

        return {
          ...cliente,
          total_cotizaciones: cotizacionesCount,
          total_ventas: ventasCount,
        };
      });

      setClientes(processedClientes);

      // Calculate stats
      const allData = data || [];
      setStats({
        total: allData.length,
        individual: allData.filter((c) => c.tipo === "individual").length,
        corporate: allData.filter((c) => c.tipo === "corporate").length,
        agency: allData.filter((c) => c.tipo === "agency").length,
      });

      // Collect all unique tags
      const tags = new Set();
      allData.forEach((c) => c.etiquetas?.forEach((t) => tags.add(t)));
      setAllTags([...tags].sort());
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(cliente) {
    try {
      // Soft delete - just set is_active to false
      const { error } = await supabase
        .from("clientes")
        .update({ is_active: false })
        .eq("id", cliente.id);

      if (error) throw error;

      fetchClientes();
      setDeleteConfirm({ open: false, cliente: null });
      setToast({ message: "Cliente eliminado correctamente", type: "success" });
    } catch (error) {
      console.error("Error deleting cliente:", error);
      setToast({
        message: "Error al eliminar cliente: " + error.message,
        type: "error",
      });
    }
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  const tipoIcons = {
    individual: <User size={16} className="text-gray-500" />,
    corporate: <Building2 size={16} className="text-blue-500" />,
    agency: <Users size={16} className="text-purple-500" />,
  };

  const tipoLabels = {
    individual: "Individual",
    corporate: "Corporativo",
    agency: "Agencia",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 pb-20 md:pb-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
            <p className="text-xs text-gray-600">
              {stats.total} clientes registrados
            </p>
          </div>
          {canEdit() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus size={16} />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <div className="flex items-center gap-1">
              <User size={12} className="text-gray-500" />
              <p className="text-[10px] text-gray-500">Individuales</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {stats.individual}
            </p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <div className="flex items-center gap-1">
              <Building2 size={12} className="text-blue-500" />
              <p className="text-[10px] text-gray-500">Corporativos</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{stats.corporate}</p>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <div className="flex items-center gap-1">
              <Users size={12} className="text-purple-500" />
              <p className="text-[10px] text-gray-500">Agencias</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{stats.agency}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-2 mb-3">
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-2 py-1 text-xs border rounded-lg transition-colors ${
                showFilters || filterTipo !== "all" || filterTag
                  ? "border-primary text-primary bg-primary/5"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={12} />
              Filtros
              {(filterTipo !== "all" || filterTag) && (
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              )}
              <ChevronDown
                size={12}
                className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
              {/* Tipo Filter */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">
                  Tipo
                </label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todos</option>
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporativo</option>
                  <option value="agency">Agencia</option>
                </select>
              </div>

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">
                    Etiqueta
                  </label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Todas</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear Filters */}
              {(filterTipo !== "all" || filterTag) && (
                <button
                  onClick={() => {
                    setFilterTipo("all");
                    setFilterTag("");
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 rounded px-2 py-1"
                >
                  <X size={12} />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Clientes List */}
        {loading ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-gray-500">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <User size={32} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">
              No se encontraron clientes
            </h3>
            <p className="text-xs text-gray-500">
              {searchQuery || filterTipo !== "all" || filterTag
                ? "Intenta ajustar los filtros"
                : "Comienza creando tu primer cliente"}
            </p>
            {canEdit() &&
              !searchQuery &&
              filterTipo === "all" &&
              !filterTag && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                >
                  Crear Primer Cliente
                </button>
              )}
          </div>
        ) : (
          <div className="space-y-1">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => onViewDetails?.(cliente.id)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-1.5 flex items-center gap-2 text-xs">
                  {/* Icon and Name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {tipoIcons[cliente.tipo]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate">
                        {cliente.nombre_completo}
                      </p>
                      {cliente.etiquetas?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {cliente.etiquetas.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {cliente.etiquetas.length > 2 && (
                            <span className="text-[10px] text-gray-400">
                              +{cliente.etiquetas.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact info - hide on very small screens */}
                  <div className="hidden sm:flex flex-col items-center min-w-[100px]">
                    {cliente.telefono && (
                      <span className="text-gray-600 truncate w-full text-center">
                        {cliente.telefono}
                      </span>
                    )}
                    {cliente.email && (
                      <span className="text-gray-400 text-[10px] truncate w-full text-center">
                        {cliente.email}
                      </span>
                    )}
                  </div>

                  {/* Tipo badge - hide on mobile */}
                  <div className="hidden md:flex items-center min-w-[80px] justify-center">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      {tipoIcons[cliente.tipo]}
                      <span className="text-[10px]">
                        {tipoLabels[cliente.tipo]}
                      </span>
                    </span>
                  </div>

                  {/* Cotizaciones / Ventas counts */}
                  <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                    <div className="flex gap-2 text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${
                          cliente.total_cotizaciones > 0
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        C: {cliente.total_cotizaciones || 0}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${
                          cliente.total_ventas > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        V: {cliente.total_ventas || 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions menu - hide on mobile */}
                  <div className="hidden md:block relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(
                          activeMenu === cliente.id ? null : cliente.id
                        );
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical size={14} className="text-gray-500" />
                    </button>

                    {activeMenu === cliente.id && (
                      <div
                        className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            onViewDetails?.(cliente.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={12} />
                          Ver detalles
                        </button>
                        {canEdit() && (
                          <button
                            onClick={() => {
                              onViewDetails?.(cliente.id, { edit: true });
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            <Edit size={12} />
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // TODO: Navigate to new quote with this client
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <FileText size={12} />
                          Nueva cotización
                        </button>
                        {canDelete() && (
                          <>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => {
                                setDeleteConfirm({ open: true, cliente });
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={12} />
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Click outside to close menu */}
        {activeMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setActiveMenu(null)}
          />
        )}
      </div>

      {/* Create Modal */}
      <CustomerQuickCreate
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newCliente) => {
          fetchClientes();
          // Optionally navigate to the new cliente details
          onViewDetails?.(newCliente.id);
        }}
        fullForm={true}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, cliente: null })}
        onConfirm={() => handleDelete(deleteConfirm.cliente)}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a "${deleteConfirm.cliente?.nombre_completo}"? Esta acción se puede revertir.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
