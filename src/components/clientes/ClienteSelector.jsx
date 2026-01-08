import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { supabase } from "../../lib/supabase";
import { Search, UserPlus, X, Phone, Mail, User, Building2, ChevronDown } from "lucide-react";

/**
 * ClienteSelector - Search, select, or create customers
 *
 * Features:
 * - Search existing customers by name, phone, or email
 * - Display customer info with metrics (total quotes, sales)
 * - Create new customer inline via quick create modal
 * - Optional "different requester" toggle for titular/solicitante
 */
export default function ClienteSelector({
  value,
  onChange,
  placeholder = "Buscar cliente por nombre, teléfono o email...",
  showRequesterToggle = false,
  requesterValue = null,
  onRequesterChange = null,
  label = "Cliente",
  required = false,
  disabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [differentRequester, setDifferentRequester] = useState(false);

  // Quick create form
  const [newCliente, setNewCliente] = useState({
    nombre_completo: "",
    telefono: "",
    email: "",
    tipo: "individual",
  });
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchClientes(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Set differentRequester from props
  useEffect(() => {
    if (requesterValue && requesterValue !== value?.id) {
      setDifferentRequester(true);
    }
  }, [requesterValue, value]);

  async function searchClientes(query) {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre_completo, telefono, email, tipo, total_cotizaciones, total_ventas, etiquetas")
        .eq("is_active", true)
        .or(`nombre_completo.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`)
        .order("nombre_completo")
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error searching clientes:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function selectCliente(cliente) {
    onChange(cliente);
    setSearchQuery("");
    setShowDropdown(false);
  }

  function clearSelection() {
    onChange(null);
    setSearchQuery("");
    if (differentRequester && onRequesterChange) {
      onRequesterChange(null);
      setDifferentRequester(false);
    }
  }

  async function handleQuickCreate() {
    if (!newCliente.nombre_completo.trim()) {
      setCreateError("El nombre es requerido");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          nombre_completo: newCliente.nombre_completo.trim(),
          telefono: newCliente.telefono.trim() || null,
          email: newCliente.email.trim() || null,
          tipo: newCliente.tipo,
        })
        .select()
        .single();

      if (error) throw error;

      // Select the newly created customer
      onChange(data);
      setShowQuickCreate(false);
      setNewCliente({
        nombre_completo: "",
        telefono: "",
        email: "",
        tipo: "individual",
      });
    } catch (error) {
      console.error("Error creating cliente:", error);
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  }

  function handleToggleRequester() {
    const newValue = !differentRequester;
    setDifferentRequester(newValue);
    if (!newValue && onRequesterChange) {
      onRequesterChange(null);
    }
  }

  // Display selected customer card
  const SelectedCustomerCard = ({ cliente, isRequester = false, onClear }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
      isRequester ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isRequester ? "bg-amber-200" : "bg-green-200"
        }`}>
          {cliente.tipo === "corporate" ? (
            <Building2 size={20} className={isRequester ? "text-amber-700" : "text-green-700"} />
          ) : (
            <User size={20} className={isRequester ? "text-amber-700" : "text-green-700"} />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{cliente.nombre_completo}</p>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {cliente.telefono && (
              <span className="flex items-center gap-1">
                <Phone size={12} />
                {cliente.telefono}
              </span>
            )}
            {cliente.email && (
              <span className="flex items-center gap-1">
                <Mail size={12} />
                {cliente.email}
              </span>
            )}
          </div>
        </div>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X size={18} className="text-gray-500" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Main Label */}
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected Customer Display */}
      {value ? (
        <div className="space-y-3">
          <SelectedCustomerCard
            cliente={value}
            onClear={clearSelection}
          />

          {/* Different Requester Toggle */}
          {showRequesterToggle && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={differentRequester}
                  onChange={handleToggleRequester}
                  disabled={disabled}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-gray-600">
                  ¿Quien solicita es diferente al titular?
                </span>
              </label>

              {differentRequester && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-amber-700 mb-2">
                    Solicitante (quien pide la cotización)
                  </label>
                  {requesterValue ? (
                    <SelectedCustomerCard
                      cliente={requesterValue}
                      isRequester={true}
                      onClear={() => onRequesterChange(null)}
                    />
                  ) : (
                    <ClienteSelector
                      value={requesterValue}
                      onChange={onRequesterChange}
                      placeholder="Buscar solicitante..."
                      label=""
                      disabled={disabled}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Search Input */
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:bg-gray-100"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <>
                  {searchResults.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => selectCliente(cliente)}
                      className="px-4 py-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {cliente.tipo === "corporate" ? (
                              <Building2 size={16} className="text-gray-600" />
                            ) : (
                              <User size={16} className="text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {cliente.nombre_completo}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              {cliente.telefono && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} />
                                  {cliente.telefono}
                                </span>
                              )}
                              {cliente.email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={12} />
                                  {cliente.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Customer metrics */}
                        <div className="flex items-center gap-2 text-xs">
                          {cliente.total_cotizaciones > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {cliente.total_cotizaciones} cot.
                            </span>
                          )}
                          {cliente.total_ventas > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {cliente.total_ventas} ventas
                            </span>
                          )}
                          {cliente.etiquetas?.includes("VIP") && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                              VIP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : searchQuery.length >= 2 && !isSearching ? (
                <div className="px-4 py-6 text-center text-gray-500">
                  <p className="mb-2">No se encontraron clientes</p>
                </div>
              ) : null}

              {/* Create New Customer Button */}
              <div
                onClick={() => {
                  setShowQuickCreate(true);
                  setShowDropdown(false);
                  setNewCliente(prev => ({
                    ...prev,
                    nombre_completo: searchQuery,
                  }));
                }}
                className="px-4 py-3 hover:bg-green-50 cursor-pointer border-t flex items-center gap-2 text-green-700 font-medium transition-colors"
              >
                <UserPlus size={18} />
                Crear nuevo cliente
                {searchQuery && <span className="text-gray-500">"{searchQuery}"</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Create Modal */}
      {showQuickCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowQuickCreate(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Nuevo Cliente
              </h3>
              <button
                onClick={() => setShowQuickCreate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newCliente.nombre_completo}
                  onChange={(e) => setNewCliente({ ...newCliente, nombre_completo: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Nombre del cliente"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={newCliente.telefono}
                  onChange={(e) => setNewCliente({ ...newCliente, telefono: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="+52 614 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCliente.email}
                  onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Cliente
                </label>
                <div className="relative">
                  <select
                    value={newCliente.tipo}
                    onChange={(e) => setNewCliente({ ...newCliente, tipo: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  >
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporativo</option>
                    <option value="agency">Agencia</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickCreate}
                disabled={isCreating || !newCliente.nombre_completo.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Crear Cliente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ClienteSelector.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.string,
    nombre_completo: PropTypes.string,
    telefono: PropTypes.string,
    email: PropTypes.string,
    tipo: PropTypes.string,
    total_cotizaciones: PropTypes.number,
    total_ventas: PropTypes.number,
    etiquetas: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  showRequesterToggle: PropTypes.bool,
  requesterValue: PropTypes.object,
  onRequesterChange: PropTypes.func,
  label: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
};
