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
  const { isAdmin } = useAuth();

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

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      localStorage.setItem("filter_search", debouncedSearchTerm);
    } else {
      localStorage.removeItem("filter_search");
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  async function fetchCotizaciones() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cotizaciones")
        .select(
          `
          *,
          ventas (
            id,
            monto_pendiente
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out fully paid ventas
      const filtered = (data || []).filter((cot) => {
        if (!cot.ventas || cot.ventas.length === 0) return true;
        return cot.ventas[0].monto_pendiente > 0;
      });

      setCotizaciones(filtered);
    } catch (error) {
      console.error("Error:", error);
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

  function getStageLabel(stage) {
    const stages = {
      lead: "Lead",
      qualification: "Calificación",
      quote_sent: "Cotización Enviada",
      negotiation: "Negociación",
      booking_confirmed: "Reserva Confirmada",
    };
    return stages[stage] || stage;
  }

  function getStageBadge(stage) {
    const colors = {
      lead: "bg-gray-100 text-gray-700",
      qualification: "bg-blue-100 text-blue-700",
      quote_sent: "bg-purple-100 text-purple-700",
      negotiation: "bg-yellow-100 text-yellow-700",
      booking_confirmed: "bg-green-100 text-green-700",
    };
    return colors[stage] || "bg-gray-100 text-gray-700";
  }

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
      `¿Eliminar ${selectedForDelete.length} cotización(es)?`
    );
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("cotizaciones")
        .delete()
        .in("id", selectedForDelete);

      if (error) throw error;

      alert("✅ Cotizaciones eliminadas");
      setSelectedForDelete([]);
      fetchCotizaciones();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar cotizaciones");
    }
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
              placeholder="Buscar por folio, cliente, destino, teléfono, email..."
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
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-white text-primary px-1.5 rounded-full text-xs font-semibold">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            )}

            {selectedForDelete.length > 0 && isAdmin() && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
              >
                <Trash2 size={16} />
                Eliminar ({selectedForDelete.length})
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Estatus
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    localStorage.setItem("filter_status", e.target.value);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="nueva">Nueva</option>
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
                  onChange={(e) => {
                    setLeadOriginFilter(e.target.value);
                    localStorage.setItem("filter_origin", e.target.value);
                  }}
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

              <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      localStorage.setItem("filter_from", e.target.value);
                    }}
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
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      localStorage.setItem("filter_to", e.target.value);
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
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
              <div className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                  {isAdmin() && (
                    <input
                      type="checkbox"
                      checked={selectedForDelete.includes(cotizacion.id)}
                      onChange={() => toggleSelectForDelete(cotizacion.id)}
                      className="mt-1 w-4 h-4 text-primary rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500">
                          {cotizacion.folio}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStageBadge(cotizacion.pipeline_stage)}`}
                        >
                          {getStageLabel(cotizacion.pipeline_stage)}
                        </span>
                      </div>
                      <LeadOriginIcon
                        origen={cotizacion.origen_lead}
                        size={18}
                      />
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                      {cotizacion.cliente_nombre}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 mb-4">
                      <p>
                        <span className="font-medium">Destino:</span>{" "}
                        {cotizacion.destino}
                      </p>
                      {cotizacion.fecha_salida && (
                        <p>
                          <span className="font-medium">Salida:</span>{" "}
                          {new Date(cotizacion.fecha_salida).toLocaleDateString(
                            "es-MX"
                          )}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Viajeros:</span>{" "}
                        {cotizacion.num_adultos + cotizacion.num_ninos}
                      </p>
                    </div>

                    {cotizacion.presupuesto_aprox && (
                      <p className="text-sm font-semibold text-primary mb-3">
                        Presupuesto: $
                        {parseFloat(
                          cotizacion.presupuesto_aprox
                        ).toLocaleString("es-MX")}
                      </p>
                    )}

                    <button
                      onClick={() => setSelectedCotizacionId(cotizacion.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      <Eye size={16} />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
