import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Building2,
  Percent,
  Mail,
  Edit,
  Trash2,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function HotelOperadores({ hotelId, disabled = false }) {
  const [relaciones, setRelaciones] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    operador_id: "",
    comision_porcentaje: "",
    tarifa_neta: false,
    codigo_agencia: "",
    contacto_nombre: "",
    contacto_email: "",
    notas: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hotelId) {
      fetchRelaciones();
      fetchOperadores();
    }
  }, [hotelId]);

  async function fetchRelaciones() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotel_operadores")
        .select(`
          *,
          operador:operador_id(id, nombre)
        `)
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRelaciones(data || []);
    } catch (error) {
      console.error("Error fetching relaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOperadores() {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      setOperadores(data || []);
    } catch (error) {
      console.error("Error fetching operadores:", error);
    }
  }

  function resetForm() {
    setFormData({
      operador_id: "",
      comision_porcentaje: "",
      tarifa_neta: false,
      codigo_agencia: "",
      contacto_nombre: "",
      contacto_email: "",
      notas: "",
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(relacion) {
    setFormData({
      operador_id: relacion.operador_id || "",
      comision_porcentaje: relacion.comision_porcentaje || "",
      tarifa_neta: relacion.tarifa_neta || false,
      codigo_agencia: relacion.codigo_agencia || "",
      contacto_nombre: relacion.contacto_nombre || "",
      contacto_email: relacion.contacto_email || "",
      notas: relacion.notas || "",
      is_active: relacion.is_active !== false,
    });
    setEditingId(relacion.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.operador_id) {
      alert("Selecciona un operador");
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        hotel_id: hotelId,
        operador_id: formData.operador_id,
        comision_porcentaje: formData.comision_porcentaje ? parseFloat(formData.comision_porcentaje) : null,
        tarifa_neta: formData.tarifa_neta,
        codigo_agencia: formData.codigo_agencia.trim() || null,
        contacto_nombre: formData.contacto_nombre.trim() || null,
        contacto_email: formData.contacto_email.trim() || null,
        notas: formData.notas.trim() || null,
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("hotel_operadores")
          .update(saveData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hotel_operadores")
          .insert(saveData);

        if (error) throw error;
      }

      fetchRelaciones();
      resetForm();
    } catch (error) {
      console.error("Error saving relacion:", error);
      if (error.code === '23505') {
        alert("Este operador ya está vinculado con el hotel");
      } else {
        alert("Error al guardar: " + error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta relación con el operador?")) return;

    try {
      const { error } = await supabase
        .from("hotel_operadores")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchRelaciones();
    } catch (error) {
      console.error("Error deleting relacion:", error);
      alert("Error al eliminar: " + error.message);
    }
  }

  async function toggleActive(relacion) {
    try {
      const { error } = await supabase
        .from("hotel_operadores")
        .update({ is_active: !relacion.is_active })
        .eq("id", relacion.id);

      if (error) throw error;
      fetchRelaciones();
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  }

  // Filter out operadores already linked
  const availableOperadores = operadores.filter(
    op => !relaciones.some(r => r.operador_id === op.id && r.id !== editingId)
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-2 text-sm text-gray-500">Cargando operadores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Operadores Vinculados
        </h3>
        {!disabled && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
          >
            <Plus size={16} />
            Vincular
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operador *
              </label>
              <select
                value={formData.operador_id}
                onChange={(e) => setFormData({ ...formData, operador_id: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
                disabled={editingId}
              >
                <option value="">Seleccionar operador...</option>
                {(editingId ? operadores : availableOperadores).map((op) => (
                  <option key={op.id} value={op.id}>{op.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Agencia
              </label>
              <input
                type="text"
                value={formData.codigo_agencia}
                onChange={(e) => setFormData({ ...formData, codigo_agencia: e.target.value })}
                placeholder="Código asignado por el hotel"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comisión (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.comision_porcentaje}
                onChange={(e) => setFormData({ ...formData, comision_porcentaje: e.target.value })}
                placeholder="Ej: 10.00"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="tarifa_neta"
                checked={formData.tarifa_neta}
                onChange={(e) => setFormData({ ...formData, tarifa_neta: e.target.checked })}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="tarifa_neta" className="text-sm text-gray-700">
                Tarifa neta (no comisionable)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto (nombre)
              </label>
              <input
                type="text"
                value={formData.contacto_nombre}
                onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                placeholder="Contacto específico para esta relación"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto (email)
              </label>
              <input
                type="email"
                value={formData.contacto_email}
                onChange={(e) => setFormData({ ...formData, contacto_email: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
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
              placeholder="Condiciones especiales, acuerdos, etc."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Relación activa
            </label>
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
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Vincular"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {relaciones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Building2 size={32} className="mx-auto mb-2 opacity-50" />
          <p>No hay operadores vinculados</p>
          {!disabled && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-primary hover:underline text-sm"
            >
              + Vincular primer operador
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {relaciones.map((relacion) => (
            <div
              key={relacion.id}
              className={`bg-white border rounded-lg p-4 ${
                relacion.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    relacion.is_active
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {relacion.operador?.nombre || "Operador eliminado"}
                      </p>
                      {!relacion.is_active && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm">
                      {relacion.codigo_agencia && (
                        <span className="text-gray-600">
                          Código: <span className="font-medium">{relacion.codigo_agencia}</span>
                        </span>
                      )}
                      {relacion.comision_porcentaje && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Percent size={14} />
                          {relacion.comision_porcentaje}%
                        </span>
                      )}
                      {relacion.tarifa_neta && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                          Tarifa Neta
                        </span>
                      )}
                    </div>
                    {(relacion.contacto_nombre || relacion.contacto_email) && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        {relacion.contacto_nombre && (
                          <span>{relacion.contacto_nombre}</span>
                        )}
                        {relacion.contacto_email && (
                          <a
                            href={`mailto:${relacion.contacto_email}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Mail size={12} />
                            {relacion.contacto_email}
                          </a>
                        )}
                      </div>
                    )}
                    {relacion.notas && (
                      <p className="mt-2 text-xs text-gray-500">{relacion.notas}</p>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(relacion)}
                      className={`p-1.5 rounded transition-colors ${
                        relacion.is_active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                      title={relacion.is_active ? "Desactivar" : "Activar"}
                    >
                      {relacion.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => startEdit(relacion)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(relacion.id)}
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
