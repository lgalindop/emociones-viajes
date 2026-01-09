import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Users,
  Plus,
  X,
  Search,
  Heart,
  Briefcase,
  UserPlus,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const RELATIONSHIP_TYPES = [
  { value: "esposo/a", label: "Esposo/a", icon: Heart },
  { value: "familiar", label: "Familiar", icon: Users },
  { value: "hijo/a", label: "Hijo/a", icon: Users },
  { value: "padre/madre", label: "Padre/Madre", icon: Users },
  { value: "asistente", label: "Asistente", icon: Briefcase },
  { value: "empleador", label: "Empleador", icon: Briefcase },
  { value: "colega", label: "Colega", icon: Briefcase },
  { value: "amigo/a", label: "Amigo/a", icon: Users },
  { value: "otro", label: "Otro", icon: Users },
];

/**
 * CustomerRelaciones - Manage relationships between customers
 * Shows family members, assistants, employers, etc.
 */
export default function CustomerRelaciones({
  clienteId,
  onNavigateToCliente,
  disabled = false,
}) {
  const [relaciones, setRelaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTravelHistory, setShowTravelHistory] = useState(false);
  const [familyTravelHistory, setFamilyTravelHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Add form state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [tipoRelacion, setTipoRelacion] = useState("familiar");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clienteId) {
      fetchRelaciones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function fetchRelaciones() {
    setLoading(true);
    try {
      // Get relationships where this cliente is either side
      const { data: outgoing, error: err1 } = await supabase
        .from("cliente_relaciones")
        .select(
          `
          id,
          tipo_relacion,
          descripcion,
          relacionado_con:relacionado_con_id(
            id,
            nombre_completo,
            telefono,
            email,
            total_cotizaciones,
            total_ventas
          )
        `
        )
        .eq("cliente_id", clienteId);

      if (err1) throw err1;

      const { data: incoming, error: err2 } = await supabase
        .from("cliente_relaciones")
        .select(
          `
          id,
          tipo_relacion,
          descripcion,
          cliente:cliente_id(
            id,
            nombre_completo,
            telefono,
            email,
            total_cotizaciones,
            total_ventas
          )
        `
        )
        .eq("relacionado_con_id", clienteId);

      if (err2) throw err2;

      // Combine and normalize
      const combined = [
        ...(outgoing || []).map((r) => ({
          id: r.id,
          tipo_relacion: r.tipo_relacion,
          descripcion: r.descripcion,
          cliente: r.relacionado_con,
          direction: "outgoing",
        })),
        ...(incoming || []).map((r) => ({
          id: r.id,
          tipo_relacion: getInverseRelation(r.tipo_relacion),
          descripcion: r.descripcion,
          cliente: r.cliente,
          direction: "incoming",
        })),
      ];

      setRelaciones(combined);
    } catch (error) {
      console.error("Error fetching relaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  // Get the inverse relationship label for display
  function getInverseRelation(tipo) {
    const inverses = {
      "esposo/a": "esposo/a",
      "hijo/a": "padre/madre",
      "padre/madre": "hijo/a",
      familiar: "familiar",
      asistente: "empleador",
      empleador: "asistente",
      colega: "colega",
      "amigo/a": "amigo/a",
      otro: "otro",
    };
    return inverses[tipo] || tipo;
  }

  async function searchClientes(query) {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre_completo, telefono, email")
        .eq("is_active", true)
        .neq("id", clienteId) // Exclude current cliente
        .or(
          `nombre_completo.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(5);

      if (error) throw error;

      // Filter out already related clientes
      const existingIds = relaciones.map((r) => r.cliente?.id);
      setSearchResults((data || []).filter((c) => !existingIds.includes(c.id)));
    } catch (error) {
      console.error("Error searching:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddRelacion() {
    if (!selectedCliente) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("cliente_relaciones").insert({
        cliente_id: clienteId,
        relacionado_con_id: selectedCliente.id,
        tipo_relacion: tipoRelacion,
        descripcion: descripcion || null,
      });

      if (error) throw error;

      // Refresh list
      await fetchRelaciones();
      resetForm();
    } catch (error) {
      console.error("Error adding relation:", error);
      if (error.code === "23505") {
        alert("Esta relación ya existe");
      } else {
        alert("Error al agregar relación: " + error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRelacion(relacionId) {
    if (!confirm("¿Eliminar esta relación?")) return;

    try {
      const { error } = await supabase
        .from("cliente_relaciones")
        .delete()
        .eq("id", relacionId);

      if (error) throw error;
      await fetchRelaciones();
    } catch (error) {
      console.error("Error removing relation:", error);
      alert("Error al eliminar: " + error.message);
    }
  }

  async function fetchFamilyTravelHistory() {
    if (familyTravelHistory.length > 0) {
      setShowTravelHistory(!showTravelHistory);
      return;
    }

    setLoadingHistory(true);
    try {
      // Get all related cliente IDs
      const relatedIds = relaciones.map((r) => r.cliente?.id).filter(Boolean);

      if (relatedIds.length === 0) {
        setFamilyTravelHistory([]);
        setShowTravelHistory(true);
        return;
      }

      // Fetch cotizaciones for related clientes, then traverse to ventas and viajeros
      const { data, error } = await supabase
        .from("cotizaciones")
        .select(
          `
          id,
          destino,
          fecha_salida,
          fecha_regreso,
          cliente_id,
          ventas!ventas_cotizacion_id_fkey(
            id,
            precio_total,
            divisa,
            viajeros!viajeros_venta_id_fkey(
              id,
              nombre_completo,
              es_titular,
              cliente_id
            )
          )
        `
        )
        .in("cliente_id", relatedIds)
        .not("ventas", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Flatten the nested structure to extract viajeros with their associated data
      const viajerosList = [];
      (data || []).forEach((cotizacion) => {
        (cotizacion.ventas || []).forEach((venta) => {
          (venta.viajeros || []).forEach((viajero) => {
            viajerosList.push({
              id: viajero.id,
              nombre_completo: viajero.nombre_completo,
              es_titular: viajero.es_titular,
              cliente_id: viajero.cliente_id,
              venta: {
                id: venta.id,
                precio_total: venta.precio_total,
                divisa: venta.divisa,
                cotizacion: {
                  id: cotizacion.id,
                  destino: cotizacion.destino,
                  fecha_salida: cotizacion.fecha_salida,
                  fecha_regreso: cotizacion.fecha_regreso,
                },
              },
              clienteInfo: relaciones.find(
                (r) => r.cliente?.id === viajero.cliente_id
              )?.cliente,
            });
          });
        });
      });

      setFamilyTravelHistory(viajerosList);
      setShowTravelHistory(true);
    } catch (error) {
      console.error("Error fetching family travel history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }

  function resetForm() {
    setShowAddForm(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCliente(null);
    setTipoRelacion("familiar");
    setDescripcion("");
  }

  function getRelationIcon(tipo) {
    const rel = RELATIONSHIP_TYPES.find((r) => r.value === tipo);
    return rel?.icon || Users;
  }

  function getRelationLabel(tipo) {
    const rel = RELATIONSHIP_TYPES.find((r) => r.value === tipo);
    return rel?.label || tipo;
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Cargando relaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            Relaciones ({relaciones.length})
          </h3>
        </div>
        {!disabled && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Agregar
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-900">Nueva Relación</h4>
            <button
              onClick={resetForm}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search or Selected */}
          {selectedCliente ? (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
              <div>
                <p className="font-medium">{selectedCliente.nombre_completo}</p>
                {selectedCliente.telefono && (
                  <p className="text-sm text-gray-500">
                    {selectedCliente.telefono}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedCliente(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchClientes(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Buscar cliente por nombre o teléfono..."
                />
              </div>
              {searching && (
                <p className="text-sm text-gray-500">Buscando...</p>
              )}
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                  {searchResults.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => {
                        setSelectedCliente(cliente);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <p className="font-medium">{cliente.nombre_completo}</p>
                      {cliente.telefono && (
                        <p className="text-sm text-gray-500">
                          {cliente.telefono}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 &&
                searchResults.length === 0 &&
                !searching && (
                  <p className="text-sm text-gray-500 py-2">
                    No se encontraron clientes
                  </p>
                )}
            </div>
          )}

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Relación
            </label>
            <select
              value={tipoRelacion}
              onChange={(e) => setTipoRelacion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {RELATIONSHIP_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Ej: Hermano mayor, asistente personal..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddRelacion}
              disabled={!selectedCliente || saving}
              className="px-4 py-2 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Agregar Relación
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Relations List */}
      {relaciones.length > 0 ? (
        <div className="space-y-2">
          {relaciones.map((relacion) => {
            const Icon = getRelationIcon(relacion.tipo_relacion);
            return (
              <div
                key={relacion.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {relacion.cliente?.nombre_completo}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                        {getRelationLabel(relacion.tipo_relacion)}
                      </span>
                      {relacion.descripcion && (
                        <span className="text-gray-400">
                          {relacion.descripcion}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                      <span>
                        {relacion.cliente?.total_cotizaciones || 0} cotizaciones
                      </span>
                      <span>{relacion.cliente?.total_ventas || 0} ventas</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onNavigateToCliente?.(relacion.cliente?.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver cliente"
                  >
                    <ExternalLink size={16} />
                  </button>
                  {!disabled && (
                    <button
                      onClick={() => handleRemoveRelacion(relacion.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar relación"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <Users size={32} className="mx-auto mb-2 text-gray-400" />
          <p>No hay relaciones registradas</p>
          {!disabled && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-primary hover:text-primary/80 font-medium"
            >
              + Agregar primera relación
            </button>
          )}
        </div>
      )}

      {/* Family Travel History Section */}
      {relaciones.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={fetchFamilyTravelHistory}
            disabled={loadingHistory}
            className="flex items-center justify-between w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-600" />
              <span className="font-medium text-gray-900">
                Historial de Viajes Familiares
              </span>
            </div>
            {loadingHistory ? (
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : showTravelHistory ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </button>

          {showTravelHistory && (
            <div className="mt-3 space-y-2">
              {familyTravelHistory.length > 0 ? (
                familyTravelHistory.map((viaje) => (
                  <div
                    key={viaje.id}
                    className="p-3 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {viaje.venta?.cotizacion?.destino}
                        </p>
                        <p className="text-sm text-gray-600">
                          {viaje.clienteInfo?.nombre_completo}
                          {viaje.es_titular && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Titular
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-500">
                          {viaje.venta?.cotizacion?.fecha_salida &&
                            new Date(
                              viaje.venta.cotizacion.fecha_salida + "T00:00:00"
                            ).toLocaleDateString("es-MX")}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {viaje.venta?.estatus}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No hay viajes registrados para familiares
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

CustomerRelaciones.propTypes = {
  clienteId: PropTypes.string.isRequired,
  onNavigateToCliente: PropTypes.func,
  disabled: PropTypes.bool,
};
