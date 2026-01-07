import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { supabase } from "../../lib/supabase";
import { X } from "lucide-react";
import Toast from "../ui/Toast";

export default function GroupModal({ group, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "otro",
    fecha_evento: "",
    coordinador_nombre: "",
    coordinador_telefono: "",
    coordinador_email: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (group) {
      setFormData({
        nombre: group.nombre || "",
        tipo: group.tipo || "otro",
        fecha_evento: group.fecha_evento || "",
        coordinador_nombre: group.coordinador_nombre || "",
        coordinador_telefono: group.coordinador_telefono || "",
        coordinador_email: group.coordinador_email || "",
        notas: group.notas || "",
      });
    }
  }, [group]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setToast({ message: "El nombre del group es requerido", type: "error" });
      return;
    }

    setLoading(true);

    try {
      if (group) {
        // Update
        const { error } = await supabase
          .from("grupos")
          .update(formData)
          .eq("id", group.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("grupos").insert([formData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      setToast({
        message: "Error al guardar group: " + error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">
            {group ? "Editar Grupo" : "Nuevo Grupo"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Ej: Boda Martinez 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Grupo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="boda">Boda</option>
              <option value="torneo">Torneo</option>
              <option value="corporativo">Corporativo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del Evento
            </label>
            <input
              type="date"
              value={formData.fecha_evento}
              onChange={(e) =>
                setFormData({ ...formData, fecha_evento: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Coordinador (Opcional)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Coordinador
                </label>
                <input
                  type="text"
                  value={formData.coordinador_nombre}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinador_nombre: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Nombre del contacto principal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.coordinador_telefono}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinador_telefono: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.coordinador_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinador_email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Notas adicionales sobre el group..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {loading ? "Guardando..." : group ? "Actualizar" : "Crear Grupo"}
            </button>
          </div>
        </form>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

GroupModal.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    tipo: PropTypes.string,
    fecha_evento: PropTypes.string,
    coordinador_nombre: PropTypes.string,
    coordinador_telefono: PropTypes.string,
    coordinador_email: PropTypes.string,
    notas: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
