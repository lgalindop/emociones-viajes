import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { supabase } from "../../lib/supabase";
import { X, UserPlus, Building2, User, Users, ChevronDown } from "lucide-react";

/**
 * ClienteQuickCreate - Modal for creating new customers
 *
 * Can be used:
 * - Inline from ClienteSelector
 * - Standalone modal for full customer creation
 */
export default function ClienteQuickCreate({
  isOpen,
  onClose,
  onCreated,
  initialName = "",
  initialPhone = "",
  initialEmail = "",
  fullForm = false, // Show all fields vs minimal
}) {
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    email: "",
    telefono_secundario: "",
    tipo: "individual",
    preferencia_contacto: "whatsapp",
    mejor_horario: null,
    fecha_nacimiento: "",
    direccion: "",
    ciudad: "",
    estado: "",
    codigo_postal: "",
    pais: "México",
    rfc: "",
    razon_social: "",
    notas: "",
    etiquetas: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState("");

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Initialize form with initial values
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        nombre_completo: initialName,
        telefono: initialPhone,
        email: initialEmail,
      }));
      setError(null);
      // Focus first input
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialName, initialPhone, initialEmail]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.nombre_completo.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const insertData = {
        nombre_completo: formData.nombre_completo.trim(),
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        tipo: formData.tipo,
        preferencia_contacto: formData.preferencia_contacto,
        etiquetas: formData.etiquetas,
      };

      // Add optional fields if fullForm
      if (fullForm) {
        Object.assign(insertData, {
          telefono_secundario: formData.telefono_secundario.trim() || null,
          mejor_horario: formData.mejor_horario || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          direccion: formData.direccion.trim() || null,
          ciudad: formData.ciudad.trim() || null,
          estado: formData.estado.trim() || null,
          codigo_postal: formData.codigo_postal.trim() || null,
          pais: formData.pais.trim() || null,
          rfc: formData.rfc.trim() || null,
          razon_social: formData.razon_social.trim() || null,
          notas: formData.notas.trim() || null,
        });
      }

      const { data, error: insertError } = await supabase
        .from("clientes")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      onCreated(data);
      onClose();
    } catch (err) {
      console.error("Error creating cliente:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !formData.etiquetas.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        etiquetas: [...prev.etiquetas, tag],
      }));
      setTagInput("");
    }
  }

  function removeTag(tagToRemove) {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.filter(t => t !== tagToRemove),
    }));
  }

  if (!isOpen) return null;

  const tipoIcons = {
    individual: <User size={18} />,
    corporate: <Building2 size={18} />,
    agency: <Users size={18} />,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Nuevo Cliente</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo de Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cliente
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "individual", label: "Individual" },
                { value: "corporate", label: "Corporativo" },
                { value: "agency", label: "Agencia" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: option.value })}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.tipo === option.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {tipoIcons[option.value]}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder={formData.tipo === "corporate" ? "Nombre de la empresa" : "Nombre del cliente"}
              required
            />
          </div>

          {/* Razón Social (only for corporate) */}
          {formData.tipo === "corporate" && fullForm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={formData.razon_social}
                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Razón social para facturación"
              />
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="cliente@email.com"
              />
            </div>
          </div>

          {/* Contact Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferencia de Contacto
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "whatsapp", label: "WhatsApp" },
                { value: "email", label: "Email" },
                { value: "call", label: "Llamada" },
                { value: "any", label: "Cualquiera" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, preferencia_contacto: option.value })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    formData.preferencia_contacto === option.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extended fields for fullForm mode */}
          {fullForm && (
            <>
              {/* Secondary Contact & Timing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono Secundario
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono_secundario}
                    onChange={(e) => setFormData({ ...formData, telefono_secundario: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mejor Horario
                  </label>
                  <div className="relative">
                    <select
                      value={formData.mejor_horario || ""}
                      onChange={(e) => setFormData({ ...formData, mejor_horario: e.target.value || null })}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                    >
                      <option value="">Cualquiera</option>
                      <option value="morning">Mañana</option>
                      <option value="afternoon">Tarde</option>
                      <option value="evening">Noche</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Birthday & RFC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                    placeholder="XAXX010101000"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Dirección (para facturación)
                </label>
                <div>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Calle y número"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ciudad"
                  />
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Estado"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Código Postal"
                  />
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="País"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {["VIP", "Frecuente", "Corporativo", "Referido"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!formData.etiquetas.includes(tag)) {
                          setFormData(prev => ({
                            ...prev,
                            etiquetas: [...prev.etiquetas, tag],
                          }));
                        }
                      }}
                      className={`text-xs px-2 py-1 rounded-full border transition-all ${
                        formData.etiquetas.includes(tag)
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Nueva etiqueta..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                {formData.etiquetas.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {formData.etiquetas.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="3"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Notas internas sobre el cliente..."
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.nombre_completo.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Crear Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ClienteQuickCreate.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
  initialName: PropTypes.string,
  initialPhone: PropTypes.string,
  initialEmail: PropTypes.string,
  fullForm: PropTypes.bool,
};
