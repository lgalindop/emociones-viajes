import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Eye,
  FileText,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
} from "lucide-react";
import DetallesCotizacion from "./DetallesCotizacion";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../contexts/AuthContext";
import LeadOriginIcon from "../components/LeadOriginIcon";

export default function Cotizaciones({ onNewCotizacion }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const { user, isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState(
    localStorage.getItem("filter_search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    localStorage.getItem("filter_status") || "all"
  );
  const [leadOriginFilter, setLeadOriginFilter] = useState(
    localStorage.getItem("filter_origin") || "all"
  );
  const [dateFrom, setDateFrom] = useState(
    localStorage.getItem("filter_from") || ""
  );
  const [dateTo, setDateTo] = useState(localStorage.getItem("filter_to") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("filter_view") || "detailed"
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      localStorage.setItem("filter_search", debouncedSearchTerm);
    } else {
      localStorage.removeItem("filter_search");
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (statusFilter !== "all") {
      localStorage.setItem("filter_status", statusFilter);
    } else {
      localStorage.removeItem("filter_status");
    }
  }, [statusFilter]);

  useEffect(() => {
    if (leadOriginFilter !== "all") {
      localStorage.setItem("filter_origin", leadOriginFilter);
    } else {
      localStorage.removeItem("filter_origin");
    }
  }, [leadOriginFilter]);

  useEffect(() => {
    if (dateFrom) {
      localStorage.setItem("filter_from", dateFrom);
    } else {
      localStorage.removeItem("filter_from");
    }
  }, [dateFrom]);

  useEffect(() => {
    if (dateTo) {
      localStorage.setItem("filter_to", dateTo);
    } else {
      localStorage.removeItem("filter_to");
    }
  }, [dateTo]);

  useEffect(() => {
    if (viewMode !== "detailed") {
      localStorage.setItem("filter_view", viewMode);
    } else {
      localStorage.removeItem("filter_view");
    }
  }, [viewMode]);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  async function fetchCotizaciones() {
    const startTime = performance.now();
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
      console.log(
        `Fetch time: ${(performance.now() - startTime).toFixed(2)}ms`
      );
    } catch (error) {
      console.error("Error fetching cotizaciones:", error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter((cot) => {
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch =
          cot.folio.toLowerCase().includes(searchLower) ||
          cot.cliente_nombre?.toLowerCase().includes(searchLower) ||
          cot.destino?.toLowerCase().includes(searchLower) ||
          cot.cliente_telefono?.toLowerCase().includes(searchLower) ||
          cot.cliente_email?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      if (statusFilter !== "all" && cot.estatus !== statusFilter) {
        return false;
      }

      if (leadOriginFilter !== "all" && cot.origen_lead !== leadOriginFilter) {
        return false;
      }

      if (dateFrom || dateTo) {
        const cotDate = new Date(cot.created_at);
        if (dateFrom && cotDate < new Date(dateFrom)) return false;
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (cotDate > toDate) return false;
        }
      }

      return true;
    });
  }, [
    cotizaciones,
    debouncedSearchTerm,
    statusFilter,
    leadOriginFilter,
    dateFrom,
    dateTo,
  ]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setLeadOriginFilter("all");
    setDateFrom("");
    setDateTo("");
    localStorage.removeItem("filter_search");
    localStorage.removeItem("filter_status");
    localStorage.removeItem("filter_origin");
    localStorage.removeItem("filter_from");
    localStorage.removeItem("filter_to");
  }

  function toggleSelectForDelete(id) {
    setSelectedForDelete((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedForDelete.length === filteredCotizaciones.length) {
      setSelectedForDelete([]);
    } else {
      setSelectedForDelete(filteredCotizaciones.map((c) => c.id));
    }
  }

  async function handleBulkDelete() {
    if (selectedForDelete.length === 0) return;

    const confirm = window.confirm(
      `¿Eliminar ${selectedForDelete.length} cotización(es)? Esta acción no se puede deshacer.`
    );

    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("cotizaciones")
        .delete()
        .in("id", selectedForDelete);

      if (error) throw error;

      setSelectedForDelete([]);
      fetchCotizaciones();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar cotizaciones");
    }
  }

  function getStatusBadge(estatus) {
    const colors = {
      nueva: "bg-blue-100 text-blue-800",
      enviada: "bg-purple-100 text-purple-800",
      seguimiento: "bg-yellow-100 text-yellow-800",
      cerrada: "bg-green-100 text-green-800",
      perdida: "bg-red-100 text-red-800",
    };
    return colors[estatus] || "bg-gray-100 text-gray-800";
  }

  function getLeadOriginLabel(origen) {
    const labels = {
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      facebook: "Facebook",
      referido: "Referido",
      web: "Web",
      otro: "Otro",
    };
    return labels[origen] || origen;
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

  const activeFiltersCount = [
    debouncedSearchTerm,
    statusFilter !== "all",
    leadOriginFilter !== "all",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Cotizaciones
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              {filteredCotizaciones.length} de {cotizaciones.length}{" "}
              cotizaciones
            </p>
          </div>

          <button
            onClick={onNewCotizacion}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            <span>Nueva Cotización</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-4 md:mb-6">
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                showFilters
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>

            <div className="hidden md:flex gap-1 border rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode("compact")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "compact"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Compacta
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "detailed"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Detallada
              </button>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                <X size={14} />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}

            {isAdmin() && selectedForDelete.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                <Trash2 size={14} />
                <span>Eliminar ({selectedForDelete.length})</span>
              </button>
            )}
          </div>

          {showFilters && (
            <div className="border-t mt-3 pt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Estatus
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="nueva">Nueva</option>
                  <option value="enviada">Enviada</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="cerrada">Cerrada</option>
                  <option value="perdida">Perdida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Origen del Lead
                </label>
                <select
                  value={leadOriginFilter}
                  onChange={(e) => setLeadOriginFilter(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="referido">Referido</option>
                  <option value="web">Web</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="md:hidden">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vista
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode("compact")}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      viewMode === "compact"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Compacta
                  </button>
                  <button
                    onClick={() => setViewMode("detailed")}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      viewMode === "detailed"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Detallada
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Select All (only for admins) */}
        {isAdmin() && filteredCotizaciones.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedForDelete.length === filteredCotizaciones.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm text-gray-600">
              Seleccionar todas ({filteredCotizaciones.length})
            </span>
          </div>
        )}

        {filteredCotizaciones.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No hay cotizaciones
            </h3>
            <p className="text-gray-500 mb-4">
              {activeFiltersCount > 0
                ? "Intenta ajustar los filtros"
                : "Comienza creando tu primera cotización"}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Cotizaciones List */}
        <div className="space-y-3 md:space-y-4">
          {filteredCotizaciones.map((cotizacion) => (
            <div
              key={cotizacion.id}
              className={`bg-white rounded-lg shadow hover:shadow-md transition-all ${
                selectedForDelete.includes(cotizacion.id)
                  ? "ring-2 ring-red-500"
                  : ""
              }`}
            >
              {viewMode === "compact" ? (
                // COMPACT VIEW - Essential data only
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedCotizacionId(cotizacion.id)}
                >
                  <div className="flex items-start gap-3">
                    {isAdmin() && (
                      <input
                        type="checkbox"
                        checked={selectedForDelete.includes(cotizacion.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectForDelete(cotizacion.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 text-primary rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">
                          {cotizacion.folio}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(cotizacion.estatus)}`}
                        >
                          {cotizacion.estatus}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {cotizacion.cliente_nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        📍 {cotizacion.destino}
                      </p>
                    </div>
                    <Eye size={20} className="text-primary flex-shrink-0" />
                  </div>
                </div>
              ) : (
                // DETAILED VIEW - All relevant data
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedCotizacionId(cotizacion.id)}
                >
                  <div className="flex items-start gap-3">
                    {isAdmin() && (
                      <input
                        type="checkbox"
                        checked={selectedForDelete.includes(cotizacion.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectForDelete(cotizacion.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 text-primary rounded"
                      />
                    )}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="font-semibold text-gray-900 mb-1">
                          {cotizacion.cliente_nombre}
                        </p>
                        <p className="text-xs text-gray-600">
                          {cotizacion.folio}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Destino</p>
                        <p className="text-sm font-medium">
                          📍 {cotizacion.destino}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(cotizacion.fecha_salida).toLocaleDateString(
                            "es-MX",
                            { day: "numeric", month: "short" }
                          )}{" "}
                          -{" "}
                          {new Date(
                            cotizacion.fecha_regreso
                          ).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Viajeros</p>
                        <p className="text-sm">
                          👥 {cotizacion.num_adultos} adultos,{" "}
                          {cotizacion.num_ninos} niños
                        </p>
                        {cotizacion.presupuesto_aprox && (
                          <p className="text-xs text-gray-500 mt-1">
                            💰 ${cotizacion.presupuesto_aprox.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Contacto</p>
                        {cotizacion.cliente_telefono && (
                          <p className="text-xs text-gray-600">
                            📞 {cotizacion.cliente_telefono}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <LeadOriginIcon
                            origen={cotizacion.origen_lead}
                            size={14}
                          />
                          <span className="text-xs text-gray-600">
                            {getLeadOriginLabel(cotizacion.origen_lead)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estatus</p>
                        <span
                          className={`inline-block text-xs px-3 py-1 rounded-full ${getStatusBadge(cotizacion.estatus)}`}
                        >
                          {cotizacion.estatus}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(cotizacion.created_at).toLocaleDateString(
                            "es-MX"
                          )}
                        </p>
                      </div>
                    </div>
                    <Eye size={20} className="text-primary flex-shrink-0" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
