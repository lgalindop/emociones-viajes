import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Plus,
  Trash2,
  User,
  Baby,
  ChevronDown,
  ChevronUp,
  Search,
  UserCheck,
  Users,
  Heart,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

/**
 * TravelersManager - Manage travelers for a sale
 *
 * Features:
 * - Add/remove travelers
 * - Link travelers to existing clientes (optional)
 * - Quick add family members from related clientes
 * - Track titular (main booker)
 * - Collect travel documents and special requirements
 */
export default function TravelersManager({
  viajeros = [],
  onChange,
  numAdultos = 0,
  numMenores = 0,
  numInfantes = 0,
  disabled = false,
  clienteId = null, // The titular's cliente_id to fetch family members
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingFor, setSearchingFor] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showFamilyPanel, setShowFamilyPanel] = useState(false);

  const expectedCount = numAdultos + numMenores + numInfantes;

  // Fetch family members when clienteId changes
  useEffect(() => {
    if (clienteId) {
      fetchFamilyMembers();
    }
  }, [clienteId]);

  async function fetchFamilyMembers() {
    if (!clienteId) return;

    try {
      // Get relationships where this cliente is either side
      const { data: outgoing } = await supabase
        .from("cliente_relaciones")
        .select(
          `
          tipo_relacion,
          relacionado_con:relacionado_con_id(
            id,
            nombre_completo,
            telefono,
            email,
            fecha_nacimiento
          )
        `
        )
        .eq("cliente_id", clienteId);

      const { data: incoming } = await supabase
        .from("cliente_relaciones")
        .select(
          `
          tipo_relacion,
          cliente:cliente_id(
            id,
            nombre_completo,
            telefono,
            email,
            fecha_nacimiento
          )
        `
        )
        .eq("relacionado_con_id", clienteId);

      // Combine and normalize
      const combined = [
        ...(outgoing || []).map((r) => ({
          ...r.relacionado_con,
          tipo_relacion: r.tipo_relacion,
        })),
        ...(incoming || []).map((r) => ({
          ...r.cliente,
          tipo_relacion: getInverseRelation(r.tipo_relacion),
        })),
      ].filter(Boolean);

      setFamilyMembers(combined);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  }

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
    };
    return inverses[tipo] || tipo;
  }

  // Add a new viajero
  function addViajero(tipo = "adulto") {
    const newViajero = {
      id: crypto.randomUUID(), // Temporary ID for UI
      nombre_completo: "",
      tipo_viajero: tipo,
      es_titular: viajeros.length === 0, // First one is titular by default
      fecha_nacimiento: "",
      nacionalidad: "",
      pasaporte_numero: "",
      pasaporte_vencimiento: "",
      telefono: "",
      email: "",
      requerimientos_especiales: "",
      cliente_id: null,
      _isNew: true, // Mark as new for saving
    };

    onChange([...viajeros, newViajero]);
    setExpandedIndex(viajeros.length);
  }

  // Remove a viajero
  function removeViajero(index) {
    const updated = viajeros.filter((_, i) => i !== index);
    // If we removed the titular, make the first one titular
    if (viajeros[index].es_titular && updated.length > 0) {
      updated[0].es_titular = true;
    }
    onChange(updated);
    setExpandedIndex(null);
  }

  // Update a viajero
  function updateViajero(index, field, value) {
    const updated = [...viajeros];
    updated[index] = { ...updated[index], [field]: value };

    // If setting as titular, unset others
    if (field === "es_titular" && value === true) {
      updated.forEach((v, i) => {
        if (i !== index) v.es_titular = false;
      });
    }

    onChange(updated);
  }

  // Search for existing cliente to link
  async function searchCliente(query) {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre_completo, telefono, email")
        .eq("is_active", true)
        .or(`nombre_completo.ilike.%${query}%,telefono.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching clientes:", error);
      setSearchResults([]);
    }
  }

  // Link a viajero to an existing cliente
  function linkToCliente(viajeroIndex, cliente) {
    updateViajero(viajeroIndex, "cliente_id", cliente.id);
    updateViajero(viajeroIndex, "nombre_completo", cliente.nombre_completo);
    if (cliente.telefono)
      updateViajero(viajeroIndex, "telefono", cliente.telefono);
    if (cliente.email) updateViajero(viajeroIndex, "email", cliente.email);
    setSearchingFor(null);
    setSearchQuery("");
    setSearchResults([]);
  }

  // Add a family member directly as a viajero
  function addFamilyMemberAsViajero(familyMember) {
    // Check if already added
    if (viajeros.some((v) => v.cliente_id === familyMember.id)) {
      alert("Este familiar ya está en la lista de viajeros");
      return;
    }

    const newViajero = {
      id: crypto.randomUUID(),
      nombre_completo: familyMember.nombre_completo,
      tipo_viajero: "adulto",
      es_titular: false,
      fecha_nacimiento: familyMember.fecha_nacimiento || "",
      nacionalidad: "",
      pasaporte_numero: "",
      pasaporte_vencimiento: "",
      telefono: familyMember.telefono || "",
      email: familyMember.email || "",
      requerimientos_especiales: "",
      cliente_id: familyMember.id,
      _isNew: true,
    };

    onChange([...viajeros, newViajero]);
  }

  // Get available family members (not yet added as viajeros)
  function getAvailableFamilyMembers() {
    const addedIds = viajeros.map((v) => v.cliente_id).filter(Boolean);
    return familyMembers.filter((fm) => !addedIds.includes(fm.id));
  }

  // Get icon for viajero type
  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case "menor":
        return <User size={16} className="text-blue-500" />;
      case "infante":
        return <Baby size={16} className="text-pink-500" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  // Get label for viajero type
  const getTypeLabel = (tipo) => {
    switch (tipo) {
      case "menor":
        return "Menor";
      case "infante":
        return "Infante";
      default:
        return "Adulto";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Viajeros</h3>
          <p className="text-sm text-gray-500">
            {viajeros.length} de {expectedCount} registrados
            {viajeros.length < expectedCount && (
              <span className="text-amber-600 ml-2">
                (faltan {expectedCount - viajeros.length})
              </span>
            )}
          </p>
        </div>

        {!disabled && (
          <div className="flex gap-2">
            {familyMembers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFamilyPanel(!showFamilyPanel)}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${
                  showFamilyPanel
                    ? "bg-pink-500 text-white"
                    : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                }`}
              >
                <Heart size={16} />
                Familia ({getAvailableFamilyMembers().length})
              </button>
            )}
            <button
              type="button"
              onClick={() => addViajero("adulto")}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1"
            >
              <Plus size={16} />
              Adulto
            </button>
            {numMenores > 0 && (
              <button
                type="button"
                onClick={() => addViajero("menor")}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
              >
                <Plus size={16} />
                Menor
              </button>
            )}
            {numInfantes > 0 && (
              <button
                type="button"
                onClick={() => addViajero("infante")}
                className="px-3 py-1.5 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-1"
              >
                <Plus size={16} />
                Infante
              </button>
            )}
          </div>
        )}
      </div>

      {/* Family Members Quick Add Panel */}
      {showFamilyPanel && getAvailableFamilyMembers().length > 0 && (
        <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-pink-600" />
            <h4 className="font-medium text-pink-900">Agregar Familiar</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {getAvailableFamilyMembers().map((fm) => (
              <button
                key={fm.id}
                type="button"
                onClick={() => addFamilyMemberAsViajero(fm)}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Heart size={16} className="text-pink-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {fm.nombre_completo}
                  </p>
                  <p className="text-xs text-pink-600 capitalize">
                    {fm.tipo_relacion}
                  </p>
                </div>
                <Plus size={18} className="text-pink-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Viajeros List */}
      <div className="space-y-3">
        {viajeros.map((viajero, index) => (
          <div
            key={viajero.id || index}
            className={`border-2 rounded-lg overflow-hidden transition-all ${
              viajero.es_titular
                ? "border-green-300 bg-green-50/50"
                : "border-gray-200"
            }`}
          >
            {/* Collapsed View */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(viajero.tipo_viajero)}
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                    {getTypeLabel(viajero.tipo_viajero)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {viajero.nombre_completo || (
                      <span className="text-gray-400 italic">Sin nombre</span>
                    )}
                    {viajero.es_titular && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full">
                        Titular
                      </span>
                    )}
                    {viajero.cliente_id && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                        Vinculado
                      </span>
                    )}
                  </p>
                  {viajero.pasaporte_numero && (
                    <p className="text-sm text-gray-500">
                      Pasaporte: {viajero.pasaporte_numero}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeViajero(index);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {expandedIndex === index ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Form */}
            {expandedIndex === index && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                {/* Link to existing cliente */}
                {!viajero.cliente_id && !disabled && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 mb-2">
                      ¿Este viajero ya está registrado como cliente?
                    </p>
                    {searchingFor === index ? (
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
                              searchCliente(e.target.value);
                            }}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Buscar cliente..."
                            autoFocus
                          />
                        </div>
                        {searchResults.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                            {searchResults.map((cliente) => (
                              <div
                                key={cliente.id}
                                onClick={() => linkToCliente(index, cliente)}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-b-0"
                              >
                                <p className="font-medium">
                                  {cliente.nombre_completo}
                                </p>
                                {cliente.telefono && (
                                  <p className="text-gray-500">
                                    {cliente.telefono}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchingFor(null);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSearchingFor(index)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <UserCheck size={16} />
                        Vincular con cliente existente
                      </button>
                    )}
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={viajero.nombre_completo}
                      onChange={(e) =>
                        updateViajero(index, "nombre_completo", e.target.value)
                      }
                      disabled={disabled}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                      placeholder="Nombre como aparece en pasaporte"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Viajero
                    </label>
                    <select
                      value={viajero.tipo_viajero}
                      onChange={(e) =>
                        updateViajero(index, "tipo_viajero", e.target.value)
                      }
                      disabled={disabled}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                    >
                      <option value="adulto">Adulto</option>
                      <option value="menor">Menor</option>
                      <option value="infante">Infante</option>
                    </select>
                  </div>
                </div>

                {/* Titular checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viajero.es_titular}
                    onChange={(e) =>
                      updateViajero(index, "es_titular", e.target.checked)
                    }
                    disabled={disabled}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">
                    Este viajero es el titular (responsable de la reservación)
                  </span>
                </label>

                {/* Travel Documents */}
                <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Documentos de Viaje
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={viajero.fecha_nacimiento || ""}
                        onChange={(e) =>
                          updateViajero(
                            index,
                            "fecha_nacimiento",
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Nacionalidad
                      </label>
                      <input
                        type="text"
                        value={viajero.nacionalidad || ""}
                        onChange={(e) =>
                          updateViajero(index, "nacionalidad", e.target.value)
                        }
                        disabled={disabled}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                        placeholder="Mexicana"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Número de Pasaporte
                      </label>
                      <input
                        type="text"
                        value={viajero.pasaporte_numero || ""}
                        onChange={(e) =>
                          updateViajero(
                            index,
                            "pasaporte_numero",
                            e.target.value.toUpperCase()
                          )
                        }
                        disabled={disabled}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 uppercase"
                        placeholder="G12345678"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Vencimiento Pasaporte
                      </label>
                      <input
                        type="date"
                        value={viajero.pasaporte_vencimiento || ""}
                        onChange={(e) =>
                          updateViajero(
                            index,
                            "pasaporte_vencimiento",
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={viajero.telefono || ""}
                      onChange={(e) =>
                        updateViajero(index, "telefono", e.target.value)
                      }
                      disabled={disabled}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                      placeholder="Para emergencias"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={viajero.email || ""}
                      onChange={(e) =>
                        updateViajero(index, "email", e.target.value)
                      }
                      disabled={disabled}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requerimientos Especiales
                  </label>
                  <textarea
                    value={viajero.requerimientos_especiales || ""}
                    onChange={(e) =>
                      updateViajero(
                        index,
                        "requerimientos_especiales",
                        e.target.value
                      )
                    }
                    disabled={disabled}
                    rows="2"
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                    placeholder="Dieta, accesibilidad, asientos especiales..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {viajeros.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <User size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="mb-2">No hay viajeros registrados</p>
            {!disabled && (
              <button
                type="button"
                onClick={() => addViajero("adulto")}
                className="text-primary hover:text-primary/80 font-medium"
              >
                + Agregar primer viajero
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

TravelersManager.propTypes = {
  viajeros: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nombre_completo: PropTypes.string,
      tipo_viajero: PropTypes.oneOf(["adulto", "menor", "infante"]),
      es_titular: PropTypes.bool,
      fecha_nacimiento: PropTypes.string,
      nacionalidad: PropTypes.string,
      pasaporte_numero: PropTypes.string,
      pasaporte_vencimiento: PropTypes.string,
      telefono: PropTypes.string,
      email: PropTypes.string,
      requerimientos_especiales: PropTypes.string,
      cliente_id: PropTypes.string,
    })
  ),
  onChange: PropTypes.func.isRequired,
  numAdultos: PropTypes.number,
  numMenores: PropTypes.number,
  numInfantes: PropTypes.number,
  disabled: PropTypes.bool,
  clienteId: PropTypes.string,
};
