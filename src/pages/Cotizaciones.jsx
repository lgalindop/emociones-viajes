import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Eye,
  FileText,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import DetallesCotizacion from "./DetallesCotizacion";

export default function Cotizaciones({ onNewCotizacion }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("detailed"); // "compact" or "detailed"

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  async function fetchCotizaciones() {
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (error) {
      console.error("Error fetching cotizaciones:", error);
      alert("Error al cargar cotizaciones");
    } finally {
      setLoading(false);
    }
  }

  // Filtered and searched cotizaciones
  const filteredCotizaciones = useMemo(() => {
    let filtered = cotizaciones;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cot) =>
          cot.cliente_nombre.toLowerCase().includes(search) ||
          cot.folio.toLowerCase().includes(search) ||
          cot.destino.toLowerCase().includes(search) ||
          (cot.cliente_telefono &&
            cot.cliente_telefono.toLowerCase().includes(search)) ||
          (cot.cliente_email &&
            cot.cliente_email.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((cot) => cot.estatus === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (cot) => new Date(cot.fecha_salida) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (cot) => new Date(cot.fecha_salida) <= new Date(dateTo)
      );
    }

    return filtered;
  }, [cotizaciones, searchTerm, statusFilter, dateFrom, dateTo]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getEstatusColor(estatus) {
    const colors = {
      nueva: "bg-blue-100 text-blue-800",
      enviada: "bg-purple-100 text-purple-800",
      seguimiento: "bg-yellow-100 text-yellow-800",
      cerrada: "bg-green-100 text-green-800",
      perdida: "bg-red-100 text-red-800",
    };
    return colors[estatus] || "bg-gray-100 text-gray-800";
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
    searchTerm,
    statusFilter !== "all",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Cotizaciones</h1>
            <p className="text-gray-600 mt-1">
              {filteredCotizaciones.length} de {cotizaciones.length}{" "}
              cotizaciones
            </p>
          </div>

          <button
            onClick={onNewCotizacion}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Nueva Cotización
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, folio, destino, teléfono..."
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal size={18} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View mode toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode("compact")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "compact"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Compacto
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "detailed"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Detallado
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estatus
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {activeFiltersCount > 0 && (
                <div className="col-span-full flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={16} />
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de cotizaciones */}
        <div className="bg-white rounded-lg shadow">
          {filteredCotizaciones.length === 0 ? (
            <div className="p-12 text-center">
              {cotizaciones.length === 0 ? (
                <>
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">
                    No hay cotizaciones registradas
                  </p>
                  <button
                    onClick={onNewCotizacion}
                    className="text-primary hover:underline"
                  >
                    Crea la primera cotización
                  </button>
                </>
              ) : (
                <>
                  <Search size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">
                    No se encontraron cotizaciones con los filtros aplicados
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-primary hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredCotizaciones.map((cot) => (
                <div
                  key={cot.id}
                  onClick={() => setSelectedCotizacionId(cot.id)}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                    viewMode === "compact" ? "p-4" : "p-6"
                  }`}
                >
                  {viewMode === "detailed" ? (
                    // Detailed view
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-gray-500 font-semibold">
                            {cot.folio}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getEstatusColor(cot.estatus)}`}
                          >
                            {cot.estatus}
                          </span>
                        </div>

                        <h3 className="font-semibold text-xl mb-2">
                          {cot.cliente_nombre}
                        </h3>

                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <span>✈️</span>
                            <span className="font-medium">{cot.destino}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span>📅</span>
                            <span>
                              {formatDate(cot.fecha_salida)} -{" "}
                              {formatDate(cot.fecha_regreso)}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span>👥</span>
                            <span>
                              {cot.num_adultos} adulto(s)
                              {cot.num_ninos > 0 &&
                                `, ${cot.num_ninos} niño(s)`}
                            </span>
                          </p>
                          {cot.presupuesto_aprox && (
                            <p className="flex items-center gap-2">
                              <span>💰</span>
                              <span>
                                Presupuesto: $
                                {parseFloat(
                                  cot.presupuesto_aprox
                                ).toLocaleString("es-MX")}
                              </span>
                            </p>
                          )}
                          {cot.cliente_telefono && (
                            <p className="flex items-center gap-2">
                              <span>📞</span>
                              <span>{cot.cliente_telefono}</span>
                            </p>
                          )}
                        </div>

                        {cot.notas && (
                          <p className="mt-3 text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                            {cot.notas}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Compact view
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-mono text-xs text-gray-500 font-semibold w-24">
                          {cot.folio}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEstatusColor(cot.estatus)} w-24 text-center`}
                        >
                          {cot.estatus}
                        </span>
                        <span className="font-semibold flex-1">
                          {cot.cliente_nombre}
                        </span>
                        <span className="text-sm text-gray-600 w-32">
                          {cot.destino}
                        </span>
                        <span className="text-sm text-gray-500 w-40">
                          {formatDate(cot.fecha_salida)}
                        </span>
                      </div>
                      <Eye size={18} className="text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
