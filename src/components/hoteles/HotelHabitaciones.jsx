import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Bed,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function HotelHabitaciones({ hotelId, disabled = false }) {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    capacidad_adultos: 2,
    capacidad_ninos: 2,
    capacidad_total: 4,
    descripcion: "",
    amenidades: [],
    tarifa_rack_sencilla: "",
    tarifa_rack_doble: "",
    tarifa_rack_triple: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const AMENIDADES_HABITACION = [
    "vista_mar", "vista_jardin", "balcon", "terraza", "jacuzzi",
    "minibar", "caja_fuerte", "aire_acondicionado", "tv_cable",
    "wifi", "plancha", "secadora", "cafetera", "cocina"
  ];

  useEffect(() => {
    if (hotelId) {
      fetchHabitaciones();
    }
  }, [hotelId]);

  async function fetchHabitaciones() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotel_habitaciones")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("nombre");

      if (error) throw error;
      setHabitaciones(data || []);
    } catch (error) {
      console.error("Error fetching habitaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      nombre: "",
      codigo: "",
      capacidad_adultos: 2,
      capacidad_ninos: 2,
      capacidad_total: 4,
      descripcion: "",
      amenidades: [],
      tarifa_rack_sencilla: "",
      tarifa_rack_doble: "",
      tarifa_rack_triple: "",
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(habitacion) {
    setFormData({
      nombre: habitacion.nombre || "",
      codigo: habitacion.codigo || "",
      capacidad_adultos: habitacion.capacidad_adultos || 2,
      capacidad_ninos: habitacion.capacidad_ninos || 2,
      capacidad_total: habitacion.capacidad_total || 4,
      descripcion: habitacion.descripcion || "",
      amenidades: habitacion.amenidades || [],
      tarifa_rack_sencilla: habitacion.tarifa_rack_sencilla || "",
      tarifa_rack_doble: habitacion.tarifa_rack_doble || "",
      tarifa_rack_triple: habitacion.tarifa_rack_triple || "",
      is_active: habitacion.is_active !== false,
    });
    setEditingId(habitacion.id);
    setShowForm(true);
  }

  function toggleAmenidad(amenidad) {
    const current = formData.amenidades || [];
    if (current.includes(amenidad)) {
      setFormData({ ...formData, amenidades: current.filter(a => a !== amenidad) });
    } else {
      setFormData({ ...formData, amenidades: [...current, amenidad] });
    }
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
        codigo: formData.codigo.trim() || null,
        capacidad_adultos: parseInt(formData.capacidad_adultos) || 2,
        capacidad_ninos: parseInt(formData.capacidad_ninos) || 2,
        capacidad_total: parseInt(formData.capacidad_total) || 4,
        descripcion: formData.descripcion.trim() || null,
        amenidades: formData.amenidades,
        tarifa_rack_sencilla: formData.tarifa_rack_sencilla ? parseFloat(formData.tarifa_rack_sencilla) : null,
        tarifa_rack_doble: formData.tarifa_rack_doble ? parseFloat(formData.tarifa_rack_doble) : null,
        tarifa_rack_triple: formData.tarifa_rack_triple ? parseFloat(formData.tarifa_rack_triple) : null,
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("hotel_habitaciones")
          .update(saveData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hotel_habitaciones")
          .insert(saveData);

        if (error) throw error;
      }

      fetchHabitaciones();
      resetForm();
    } catch (error) {
      console.error("Error saving habitacion:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este tipo de habitación?")) return;

    try {
      const { error } = await supabase
        .from("hotel_habitaciones")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchHabitaciones();
    } catch (error) {
      console.error("Error deleting habitacion:", error);
      alert("Error al eliminar: " + error.message);
    }
  }

  async function toggleActive(habitacion) {
    try {
      const { error } = await supabase
        .from("hotel_habitaciones")
        .update({ is_active: !habitacion.is_active })
        .eq("id", habitacion.id);

      if (error) throw error;
      fetchHabitaciones();
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-2 text-sm text-gray-500">Cargando habitaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Tipos de Habitación
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
                placeholder="Ej: Suite Junior, Deluxe, Standard"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: SJR, DLX, STD"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
              />
            </div>
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Adultos</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacidad_adultos}
                  onChange={(e) => setFormData({ ...formData, capacidad_adultos: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Niños</label>
                <input
                  type="number"
                  min="0"
                  value={formData.capacidad_ninos}
                  onChange={(e) => setFormData({ ...formData, capacidad_ninos: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total máx.</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacidad_total}
                  onChange={(e) => setFormData({ ...formData, capacidad_total: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Tarifas Rack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarifas Rack (referencia)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sencilla</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tarifa_rack_sencilla}
                  onChange={(e) => setFormData({ ...formData, tarifa_rack_sencilla: e.target.value })}
                  placeholder="$0.00"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Doble</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tarifa_rack_doble}
                  onChange={(e) => setFormData({ ...formData, tarifa_rack_doble: e.target.value })}
                  placeholder="$0.00"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Triple</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tarifa_rack_triple}
                  onChange={(e) => setFormData({ ...formData, tarifa_rack_triple: e.target.value })}
                  placeholder="$0.00"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Amenidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenidades
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENIDADES_HABITACION.map((amenidad) => (
                <button
                  key={amenidad}
                  type="button"
                  onClick={() => toggleAmenidad(amenidad)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    formData.amenidades?.includes(amenidad)
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {amenidad.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Activa (disponible para reservar)
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
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {habitaciones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bed size={32} className="mx-auto mb-2 opacity-50" />
          <p>No hay tipos de habitación registrados</p>
          {!disabled && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-primary hover:underline text-sm"
            >
              + Agregar primer tipo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habitaciones.map((habitacion) => (
            <div
              key={habitacion.id}
              className={`bg-white border rounded-lg p-4 ${
                habitacion.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{habitacion.nombre}</h4>
                    {habitacion.codigo && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {habitacion.codigo}
                      </span>
                    )}
                    {!habitacion.is_active && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Users size={14} />
                    {habitacion.capacidad_adultos} adultos, {habitacion.capacidad_ninos} niños
                    <span className="text-xs">(máx. {habitacion.capacidad_total})</span>
                  </div>
                </div>
                {!disabled && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(habitacion)}
                      className={`p-1.5 rounded transition-colors ${
                        habitacion.is_active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                      title={habitacion.is_active ? "Desactivar" : "Activar"}
                    >
                      {habitacion.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => startEdit(habitacion)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(habitacion.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tarifas */}
              {(habitacion.tarifa_rack_sencilla || habitacion.tarifa_rack_doble || habitacion.tarifa_rack_triple) && (
                <div className="flex gap-3 text-sm mb-2">
                  {habitacion.tarifa_rack_sencilla && (
                    <div className="text-gray-600">
                      <span className="text-xs text-gray-400">SGL:</span> ${parseFloat(habitacion.tarifa_rack_sencilla).toLocaleString()}
                    </div>
                  )}
                  {habitacion.tarifa_rack_doble && (
                    <div className="text-gray-600">
                      <span className="text-xs text-gray-400">DBL:</span> ${parseFloat(habitacion.tarifa_rack_doble).toLocaleString()}
                    </div>
                  )}
                  {habitacion.tarifa_rack_triple && (
                    <div className="text-gray-600">
                      <span className="text-xs text-gray-400">TPL:</span> ${parseFloat(habitacion.tarifa_rack_triple).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Amenidades */}
              {habitacion.amenidades?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {habitacion.amenidades.slice(0, 5).map((amenidad) => (
                    <span
                      key={amenidad}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {amenidad.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {habitacion.amenidades.length > 5 && (
                    <span className="text-xs text-gray-400">
                      +{habitacion.amenidades.length - 5}
                    </span>
                  )}
                </div>
              )}

              {habitacion.descripcion && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {habitacion.descripcion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
