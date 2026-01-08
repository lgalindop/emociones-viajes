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
import ClienteQuickCreate from "../components/clientes/ClienteQuickCreate";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Toast from "../components/ui/Toast";

export default function Clientes({ onViewDetails }) {
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
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, cliente: null });
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
        .select("*")
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

      setClientes(data || []);

      // Calculate stats
      const allData = data || [];
      setStats({
        total: allData.length,
        individual: allData.filter(c => c.tipo === "individual").length,
        corporate: allData.filter(c => c.tipo === "corporate").length,
        agency: allData.filter(c => c.tipo === "agency").length,
      });

      // Collect all unique tags
      const tags = new Set();
      allData.forEach(c => c.etiquetas?.forEach(t => tags.add(t)));
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
      setToast({ message: "Error al eliminar cliente: " + error.message, type: "error" });
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestión de clientes y contactos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-500" />
              <p className="text-sm text-gray-500">Individuales</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.individual}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" />
              <p className="text-sm text-gray-500">Corporativos</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.corporate}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-500" />
              <p className="text-sm text-gray-500">Agencias</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.agency}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono o email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || filterTipo !== "all" || filterTag
                  ? "border-primary text-primary bg-primary/5"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={18} />
              Filtros
              {(filterTipo !== "all" || filterTag) && (
                <span className="w-2 h-2 bg-primary rounded-full" />
              )}
            </button>

            {/* Add Button */}
            {canEdit() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={18} />
                <span className="hidden md:inline">Nuevo Cliente</span>
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
              {/* Tipo Filter */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
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
                  <label className="block text-xs text-gray-500 mb-1">Etiqueta</label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Todas</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
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
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 self-end mb-1"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">Cargando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="p-8 text-center">
              <User size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No se encontraron clientes</p>
              {canEdit() && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-primary hover:text-primary/80 font-medium"
                >
                  + Crear primer cliente
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3">
                      <button
                        onClick={() => handleSort("nombre_completo")}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Cliente
                        <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => handleSort("total_cotizaciones")}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                      >
                        Cotizaciones
                        <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => handleSort("total_ventas")}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                      >
                        Ventas
                        <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onViewDetails?.(cliente.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {tipoIcons[cliente.tipo]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {cliente.nombre_completo}
                            </p>
                            {cliente.etiquetas?.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {cliente.etiquetas.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {cliente.etiquetas.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{cliente.etiquetas.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-1">
                          {cliente.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              {cliente.telefono}
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail size={14} />
                              <span className="truncate max-w-[200px]">
                                {cliente.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          {tipoIcons[cliente.tipo]}
                          {tipoLabels[cliente.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-sm font-medium ${
                          cliente.total_cotizaciones > 0
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {cliente.total_cotizaciones || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-sm font-medium ${
                          cliente.total_ventas > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {cliente.total_ventas || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === cliente.id ? null : cliente.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} className="text-gray-500" />
                          </button>

                          {activeMenu === cliente.id && (
                            <div
                              className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  onViewDetails?.(cliente.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye size={16} />
                                Ver detalles
                              </button>
                              {canEdit() && (
                                <button
                                  onClick={() => {
                                    onViewDetails?.(cliente.id, { edit: true });
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit size={16} />
                                  Editar
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  // TODO: Navigate to new quote with this client
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <FileText size={16} />
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
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={16} />
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Click outside to close menu */}
        {activeMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setActiveMenu(null)}
          />
        )}
      </div>

      {/* Create Modal */}
      <ClienteQuickCreate
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
