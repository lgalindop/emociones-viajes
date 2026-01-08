import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  User,
  Phone,
  Mail,
  Briefcase,
  Edit,
  Trash2,
  Save,
  X,
  Star,
} from "lucide-react";

const CARGO_OPTIONS = [
  "Gerente General",
  "Ventas",
  "Reservaciones",
  "Grupos",
  "Revenue",
  "Recepción",
  "Operaciones",
  "Otro",
];

export default function HotelContactos({ hotelId, disabled = false }) {
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    cargo: "",
    telefono: "",
    celular: "",
    email: "",
    es_principal: false,
    notas: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hotelId) {
      fetchContactos();
    }
  }, [hotelId]);

  async function fetchContactos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotel_contactos")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("es_principal", { ascending: false })
        .order("nombre");

      if (error) throw error;
      setContactos(data || []);
    } catch (error) {
      console.error("Error fetching contactos:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      nombre: "",
      cargo: "",
      telefono: "",
      celular: "",
      email: "",
      es_principal: false,
      notas: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(contacto) {
    setFormData({
      nombre: contacto.nombre || "",
      cargo: contacto.cargo || "",
      telefono: contacto.telefono || "",
      celular: contacto.celular || "",
      email: contacto.email || "",
      es_principal: contacto.es_principal || false,
      notas: contacto.notas || "",
    });
    setEditingId(contacto.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert("El nombre es requerido");
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        hotel_id: hotelId,
        nombre: formData.nombre.trim(),
        cargo: formData.cargo || null,
        telefono: formData.telefono.trim() || null,
        celular: formData.celular.trim() || null,
        email: formData.email.trim() || null,
        es_principal: formData.es_principal,
        notas: formData.notas.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("hotel_contactos")
          .update(saveData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hotel_contactos")
          .insert(saveData);

        if (error) throw error;
      }

      fetchContactos();
      resetForm();
    } catch (error) {
      console.error("Error saving contacto:", error);
      alert("Error al guardar contacto: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este contacto?")) return;

    try {
      const { error } = await supabase
        .from("hotel_contactos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchContactos();
    } catch (error) {
      console.error("Error deleting contacto:", error);
      alert("Error al eliminar: " + error.message);
    }
  }

  async function togglePrincipal(contacto) {
    try {
      // If setting as principal, unset others first
      if (!contacto.es_principal) {
        await supabase
          .from("hotel_contactos")
          .update({ es_principal: false })
          .eq("hotel_id", hotelId);
      }

      const { error } = await supabase
        .from("hotel_contactos")
        .update({ es_principal: !contacto.es_principal })
        .eq("id", contacto.id);

      if (error) throw error;
      fetchContactos();
    } catch (error) {
      console.error("Error updating principal:", error);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-2 text-sm text-gray-500">Cargando contactos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Contactos del Hotel
        </h3>
        {!disabled && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
          >
            <Plus size={16} />
            Agregar
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <select
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Seleccionar...</option>
                {CARGO_OPTIONS.map((cargo) => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <input
                type="tel"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="es_principal"
                checked={formData.es_principal}
                onChange={(e) => setFormData({ ...formData, es_principal: e.target.checked })}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="es_principal" className="text-sm text-gray-700">
                Contacto principal
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {contactos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User size={32} className="mx-auto mb-2 opacity-50" />
          <p>No hay contactos registrados</p>
          {!disabled && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-primary hover:underline text-sm"
            >
              + Agregar primer contacto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {contactos.map((contacto) => (
            <div
              key={contacto.id}
              className={`bg-white border rounded-lg p-4 ${
                contacto.es_principal ? "border-primary/30 bg-primary/5" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    contacto.es_principal
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    <User size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{contacto.nombre}</p>
                      {contacto.es_principal && (
                        <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    {contacto.cargo && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Briefcase size={14} />
                        {contacto.cargo}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      {contacto.telefono && (
                        <a
                          href={`tel:${contacto.telefono}`}
                          className="flex items-center gap-1 text-gray-600 hover:text-primary"
                        >
                          <Phone size={14} />
                          {contacto.telefono}
                        </a>
                      )}
                      {contacto.celular && (
                        <a
                          href={`tel:${contacto.celular}`}
                          className="flex items-center gap-1 text-gray-600 hover:text-primary"
                        >
                          <Phone size={14} />
                          {contacto.celular}
                        </a>
                      )}
                      {contacto.email && (
                        <a
                          href={`mailto:${contacto.email}`}
                          className="flex items-center gap-1 text-gray-600 hover:text-primary"
                        >
                          <Mail size={14} />
                          {contacto.email}
                        </a>
                      )}
                    </div>
                    {contacto.notas && (
                      <p className="mt-2 text-xs text-gray-500">{contacto.notas}</p>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePrincipal(contacto)}
                      className={`p-1.5 rounded transition-colors ${
                        contacto.es_principal
                          ? "text-primary hover:bg-primary/10"
                          : "text-gray-400 hover:text-primary hover:bg-gray-100"
                      }`}
                      title={contacto.es_principal ? "Quitar como principal" : "Marcar como principal"}
                    >
                      <Star size={16} fill={contacto.es_principal ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => startEdit(contacto)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(contacto.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
