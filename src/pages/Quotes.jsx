import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  FileText,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
} from "lucide-react";
import QuoteDetails from "./QuoteDetails";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import LeadOriginIcon from "../components/LeadOriginIcon";
import Toast from "../components/ui/Toast";

export default function Quotes({ onNewQuote, initialQuoteId }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState(initialQuoteId || null);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [toast, setToast] = useState(null);
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState(
    localStorage.getItem("filter_search") || ""
  );
  const [selectedStages, setSelectedStages] = useState(() => {
    const saved = localStorage.getItem("filter_stages");
    return saved ? JSON.parse(saved) : [];
  });
  const [hideConverted, setHideConverted] = useState(() => {
    const saved = localStorage.getItem("filter_hide_converted");
    return saved === "true";
  });
  const [dateFrom, setDateFrom] = useState(
    localStorage.getItem("filter_from") || ""
  );
  const [dateTo, setDateTo] = useState(localStorage.getItem("filter_to") || "");
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const pipelineStages = [
    { key: "lead", label: "Lead" },
    { key: "qualification", label: "Calificación" },
    { key: "quote_sent", label: "Cotización Enviada" },
    { key: "negotiation", label: "Negociación" },
    { key: "booking_confirmed", label: "Reserva Confirmada" },
    { key: "deposit_paid", label: "Depósito Pagado" },
    { key: "payment_pending", label: "Pago Pendiente" },
    { key: "fully_paid", label: "Pagado Completo" },
    { key: "travel_documents", label: "Documentos de Viaje" },
    { key: "delivered", label: "Entregado" },
  ];

  useEffect(() => {
    if (debouncedSearchTerm) {
      localStorage.setItem("filter_search", debouncedSearchTerm);
    } else {
      localStorage.removeItem("filter_search");
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (selectedStages.length > 0) {
      localStorage.setItem("filter_stages", JSON.stringify(selectedStages));
    } else {
      localStorage.removeItem("filter_stages");
    }
  }, [selectedStages]);

  useEffect(() => {
    localStorage.setItem("filter_hide_converted", hideConverted);
  }, [hideConverted]);

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
          ventas!ventas_cotizacion_id_fkey (
            id,
            monto_pendiente
          ),
          grupos!cotizaciones_grupo_id_fkey (
            id,
            nombre,
            tipo
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCotizaciones(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter((cot) => {
      if (hideConverted && cot.ventas && cot.ventas.length > 0) {
        return false;
      }

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

      if (
        selectedStages.length > 0 &&
        !selectedStages.includes(cot.pipeline_stage)
      ) {
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
    selectedStages,
    hideConverted,
    dateFrom,
    dateTo,
  ]);

  function getStageLabel(stage) {
    const found = pipelineStages.find((s) => s.key === stage);
    return found ? found.label : stage;
  }

  function getStageBadge(stage) {
    const colors = {
      lead: "bg-gray-100 text-gray-700",
      qualification: "bg-blue-100 text-blue-700",
      quote_sent: "bg-purple-100 text-purple-700",
      negotiation: "bg-yellow-100 text-yellow-700",
      booking_confirmed: "bg-green-100 text-green-700",
      deposit_paid: "bg-teal-100 text-teal-700",
      payment_pending: "bg-orange-100 text-orange-700",
      fully_paid: "bg-emerald-100 text-emerald-700",
      travel_documents: "bg-indigo-100 text-indigo-700",
      delivered: "bg-green-200 text-green-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-700";
  }

  function getTravelersText(cotizacion) {
    const parts = [];
    if (cotizacion.num_adultos > 0)
      parts.push(`${cotizacion.num_adultos} adultos`);
    if (cotizacion.num_ninos > 0) parts.push(`${cotizacion.num_ninos} menores`);
    if (cotizacion.num_infantes > 0)
      parts.push(`${cotizacion.num_infantes} infantes`);
    return parts.join(", ") || "0 viajeros";
  }

  function toggleStage(stage) {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  }

  function toggleAllStages() {
    if (selectedStages.length === pipelineStages.length) {
      setSelectedStages([]);
    } else {
      setSelectedStages(pipelineStages.map((s) => s.key));
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedStages([]);
    setHideConverted(false);
    setDateFrom("");
    setDateTo("");
    localStorage.removeItem("filter_search");
    localStorage.removeItem("filter_stages");
    localStorage.removeItem("filter_hide_converted");
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

      setToast({ message: "Cotizaciones eliminadas", type: "success" });
      setSelectedForDelete([]);
      fetchCotizaciones();
    } catch (error) {
      console.error("Error:", error);
      setToast({ message: "Error al eliminar cotizaciones", type: "error" });
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
      <QuoteDetails
        quoteId={selectedCotizacionId}
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
    selectedStages.length > 0,
    hideConverted,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

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
            <h1 className="text-xl font-bold text-primary">Cotizaciones</h1>
            <p className="text-xs text-gray-600">
              {filteredCotizaciones.length} de {cotizaciones.length}
            </p>
          </div>

          <button
            onClick={onNewQuote}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Nueva</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-2 mb-3">
          <div className="relative mb-2">
            <Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
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

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-colors ${
                showFilters
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal size={12} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-white text-primary px-1 rounded-full text-xs font-semibold min-w-[16px] text-center">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            )}

            {selectedForDelete.length > 0 && isAdmin() && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
              >
                <Trash2 size={12} />
                Eliminar ({selectedForDelete.length})
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-2 pt-2 border-t space-y-3">
              {/* Pipeline Stages - Excel style checkboxes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Etapa del Pipeline
                </label>
                <div className="bg-gray-50 rounded border p-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 mb-1 cursor-pointer hover:bg-gray-100 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedStages.length === pipelineStages.length}
                      onChange={toggleAllStages}
                      className="w-3 h-3 text-primary rounded"
                    />
                    <span className="text-xs font-semibold">Todas</span>
                  </label>
                  <div className="border-t my-1"></div>
                  {pipelineStages.map((stage) => (
                    <label
                      key={stage.key}
                      className="flex items-center gap-2 mb-0.5 cursor-pointer hover:bg-gray-100 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStages.includes(stage.key)}
                        onChange={() => toggleStage(stage.key)}
                        className="w-3 h-3 text-primary rounded"
                      />
                      <span className="text-xs">{stage.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range + Hide Converted */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      localStorage.setItem("filter_from", e.target.value);
                    }}
                    className="w-full border rounded px-2 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      localStorage.setItem("filter_to", e.target.value);
                    }}
                    className="w-full border rounded px-2 py-1 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideConverted}
                      onChange={(e) => setHideConverted(e.target.checked)}
                      className="w-3 h-3 text-primary rounded"
                    />
                    <span className="text-xs text-gray-700">
                      Ocultar convertidas a ventas
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Select All */}
        {isAdmin() && filteredCotizaciones.length > 0 && (
          <div className="mb-2 flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={selectedForDelete.length === filteredCotizaciones.length}
              onChange={toggleSelectAll}
              className="w-3 h-3 text-primary rounded"
            />
            <span className="text-xs text-gray-600">
              Todas ({filteredCotizaciones.length})
            </span>
          </div>
        )}

        {filteredCotizaciones.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <FileText size={32} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-semibold text-gray-600 mb-1">
              No hay cotizaciones
            </h3>
            <p className="text-xs text-gray-500">
              {activeFiltersCount > 0
                ? "Intenta ajustar los filtros"
                : "Comienza creando tu primera cotización"}
            </p>
          </div>
        )}

        {/* Cotizaciones List */}
        <div className="space-y-1">
          {filteredCotizaciones.map((cotizacion) => (
            <div
              key={cotizacion.id}
              onClick={() => setSelectedCotizacionId(cotizacion.id)}
              className={`bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer ${
                selectedForDelete.includes(cotizacion.id)
                  ? "ring-2 ring-red-500"
                  : ""
              }`}
            >
              <div className="p-1.5 flex items-center gap-3 text-xs">
                {isAdmin() && (
                  <input
                    type="checkbox"
                    checked={selectedForDelete.includes(cotizacion.id)}
                    onChange={() => toggleSelectForDelete(cotizacion.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3 h-3 text-primary rounded flex-shrink-0"
                  />
                )}

                <div className="flex flex-col items-center gap-0.5 min-w-[90px]">
                  <span className="font-semibold text-gray-500">
                    {cotizacion.folio}
                  </span>
                  {cotizacion.grupos && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800"
                      title={`Grupo: ${cotizacion.grupos.nombre}`}
                    >
                      👥 {cotizacion.grupos.nombre.slice(0, 12)}
                      {cotizacion.grupos.nombre.length > 12 ? "..." : ""}
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded-full whitespace-nowrap ${getStageBadge(
                      cotizacion.pipeline_stage
                    )}`}
                  >
                    {getStageLabel(cotizacion.pipeline_stage)}
                  </span>
                </div>

                <div className="flex flex-col items-center min-w-0 flex-1">
                  <span className="font-bold text-gray-900 truncate w-full text-center">
                    {cotizacion.cliente_nombre}
                  </span>
                  {cotizacion.cliente_telefono && (
                    <span className="text-gray-500 whitespace-nowrap">
                      {cotizacion.cliente_telefono}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col items-center min-w-[120px]">
                  <span className="text-gray-600 truncate w-full text-center">
                    {cotizacion.destino}
                  </span>
                </div>

                <div className="hidden lg:flex flex-col items-center gap-0.5 min-w-[100px]">
                  {cotizacion.fecha_salida && (
                    <span className="text-gray-600 whitespace-nowrap">
                      Viaje:{" "}
                      {(() => {
                        const parts = cotizacion.fecha_salida
                          .split("T")[0]
                          .split("-");
                        const [year, month, day] = parts.map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString("es-MX");
                      })()}
                    </span>
                  )}
                  <span className="text-gray-500 whitespace-nowrap">
                    Creada:{" "}
                    {new Date(cotizacion.created_at).toLocaleDateString(
                      "es-MX"
                    )}
                  </span>
                </div>

                <div className="hidden xl:flex flex-col items-center min-w-[130px]">
                  <span className="text-gray-600 text-center">
                    {getTravelersText(cotizacion)}
                  </span>
                </div>

                <div className="hidden md:flex flex-col items-center gap-1 min-w-[80px]">
                  {cotizacion.presupuesto_aprox && (
                    <span className="text-primary font-semibold whitespace-nowrap">
                      $
                      {parseFloat(cotizacion.presupuesto_aprox).toLocaleString(
                        "es-MX",
                        { maximumFractionDigits: 0 }
                      )}
                    </span>
                  )}
                  <LeadOriginIcon origen={cotizacion.origen_lead} size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
