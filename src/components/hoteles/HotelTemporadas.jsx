import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";

const TEMPORADA_PRESETS = [
  { nombre: "Alta", factor: 1.20 },
  { nombre: "Baja", factor: 0.85 },
  { nombre: "Semana Santa", factor: 1.30 },
  { nombre: "Navidad", factor: 1.40 },
  { nombre: "Fin de Año", factor: 1.50 },
  { nombre: "Verano", factor: 1.15 },
  { nombre: "Puentes", factor: 1.25 },
];

export default function HotelTemporadas({ hotelId, disabled = false }) {
  const [temporadas, setTemporadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    factor_precio: 1.00,
    notas: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hotelId) {
      fetchTemporadas();
    }
  }, [hotelId]);

  async function fetchTemporadas() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotel_temporadas")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("fecha_inicio");

      if (error) throw error;
      setTemporadas(data || []);
    } catch (error) {
      console.error("Error fetching temporadas:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      nombre: "",
      fecha_inicio: "",
      fecha_fin: "",
      factor_precio: 1.00,
      notas: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(temporada) {
    setFormData({
      nombre: temporada.nombre || "",
      fecha_inicio: temporada.fecha_inicio || "",
      fecha_fin: temporada.fecha_fin || "",
      factor_precio: temporada.factor_precio || 1.00,
      notas: temporada.notas || "",
    });
    setEditingId(temporada.id);
    setShowForm(true);
  }

  function applyPreset(preset) {
    setFormData(prev => ({
      ...prev,
      nombre: preset.nombre,
      factor_precio: preset.factor,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert("El nombre es requerido");
      return;
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      alert("Las fechas son requeridas");
      return;
    }

    if (formData.fecha_inicio > formData.fecha_fin) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        hotel_id: hotelId,
        nombre: formData.nombre.trim(),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        factor_precio: parseFloat(formData.factor_precio) || 1.00,
        notas: formData.notas.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("hotel_temporadas")
          .update(saveData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hotel_temporadas")
          .insert(saveData);

        if (error) throw error;
      }

      fetchTemporadas();
      resetForm();
    } catch (error) {
      console.error("Error saving temporada:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta temporada?")) return;

    try {
      const { error } = await supabase
        .from("hotel_temporadas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchTemporadas();
    } catch (error) {
      console.error("Error deleting temporada:", error);
      alert("Error al eliminar: " + error.message);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
  }

  function getFactorDisplay(factor) {
    if (factor === 1) return { text: "Normal", color: "text-gray-600", icon: null };
    if (factor > 1) {
      const percent = ((factor - 1) * 100).toFixed(0);
      return {
        text: `+${percent}%`,
        color: "text-red-600",
        icon: <TrendingUp size={14} />,
      };
    }
    const percent = ((1 - factor) * 100).toFixed(0);
    return {
      text: `-${percent}%`,
      color: "text-green-600",
      icon: <TrendingDown size={14} />,
    };
  }

  function isCurrentSeason(temporada) {
    const today = new Date().toISOString().split("T")[0];
    return temporada.fecha_inicio <= today && temporada.fecha_fin >= today;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-2 text-sm text-gray-500">Cargando temporadas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Temporadas y Precios
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
          {/* Presets */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">
              Plantillas rápidas
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPORADA_PRESETS.map((preset) => (
                <button
                  key={preset.nombre}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    formData.nombre === preset.nombre
                      ? "bg-primary text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {preset.nombre} ({preset.factor > 1 ? '+' : ''}{((preset.factor - 1) * 100).toFixed(0)}%)
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Temporada Alta, Semana Santa"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factor de Precio *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="5"
                  value={formData.factor_precio}
                  onChange={(e) => setFormData({ ...formData, factor_precio: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
                <span className={`text-sm font-medium whitespace-nowrap ${
                  formData.factor_precio > 1 ? "text-red-600" :
                  formData.factor_precio < 1 ? "text-green-600" : "text-gray-600"
                }`}>
                  {formData.factor_precio > 1 ? '+' : ''}{((formData.factor_precio - 1) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                1.00 = precio normal, 1.20 = +20%, 0.80 = -20%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                min={formData.fecha_inicio}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                required
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
              placeholder="Condiciones especiales, restricciones, etc."
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
      {temporadas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p>No hay temporadas definidas</p>
          {!disabled && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-primary hover:underline text-sm"
            >
              + Agregar primera temporada
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {temporadas.map((temporada) => {
            const factorInfo = getFactorDisplay(temporada.factor_precio);
            const isCurrent = isCurrentSeason(temporada);

            return (
              <div
                key={temporada.id}
                className={`bg-white border rounded-lg p-4 ${
                  isCurrent ? "border-primary/30 bg-primary/5" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCurrent
                        ? "bg-primary/20 text-primary"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{temporada.nombre}</p>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-gray-600">
                          {formatDate(temporada.fecha_inicio)} - {formatDate(temporada.fecha_fin)}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${factorInfo.color}`}>
                          {factorInfo.icon}
                          {factorInfo.text}
                        </span>
                      </div>
                      {temporada.notas && (
                        <p className="mt-2 text-xs text-gray-500">{temporada.notas}</p>
                      )}
                    </div>
                  </div>
                  {!disabled && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(temporada)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(temporada.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline visualization */}
      {temporadas.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Vista de calendario</h4>
          <div className="bg-gray-100 rounded-lg p-3 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Months header */}
              <div className="flex mb-2">
                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month) => (
                  <div key={month} className="flex-1 text-xs text-gray-500 text-center">
                    {month}
                  </div>
                ))}
              </div>
              {/* Seasons bars */}
              <div className="relative h-8 bg-white rounded">
                {temporadas.map((temporada) => {
                  const startMonth = new Date(temporada.fecha_inicio + "T00:00:00").getMonth();
                  const endMonth = new Date(temporada.fecha_fin + "T00:00:00").getMonth();
                  const startDay = new Date(temporada.fecha_inicio + "T00:00:00").getDate();
                  const endDay = new Date(temporada.fecha_fin + "T00:00:00").getDate();

                  const startPercent = ((startMonth + startDay / 31) / 12) * 100;
                  const endPercent = ((endMonth + endDay / 31) / 12) * 100;
                  const width = endPercent - startPercent;

                  const bgColor = temporada.factor_precio > 1
                    ? "bg-red-300"
                    : temporada.factor_precio < 1
                      ? "bg-green-300"
                      : "bg-gray-300";

                  return (
                    <div
                      key={temporada.id}
                      className={`absolute top-1 h-6 ${bgColor} rounded text-xs flex items-center justify-center text-white font-medium overflow-hidden`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${Math.max(width, 5)}%`,
                      }}
                      title={`${temporada.nombre}: ${formatDate(temporada.fecha_inicio)} - ${formatDate(temporada.fecha_fin)}`}
                    >
                      <span className="truncate px-1">{temporada.nombre}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
