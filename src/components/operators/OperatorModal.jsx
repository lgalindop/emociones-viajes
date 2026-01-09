import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { supabase } from "../../lib/supabase";
import { X } from "lucide-react";
import Toast from "../ui/Toast";

export default function OperatorModal({ operator, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    sitio_web: "",
    comision: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (operator) {
      setFormData({
        nombre: operator.nombre || "",
        contacto: operator.contacto || "",
        sitio_web: operator.sitio_web || "",
        comision: operator.comision || "",
        notas: operator.notas || "",
      });
    }
  }, [operator]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setToast({ message: "El nombre del operador es requerido", type: "error" });
      return;
    }

    setLoading(true);

    try {
      if (operator) {
        // Update
        const { error } = await supabase
          .from("operadores")
          .update(formData)
          .eq("id", operator.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("operadores").insert([formData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      setToast({
        message: "Error al guardar operador: " + error.message,
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
            {operator ? "Editar Operador" : "Nuevo Operador"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Operador *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: Ruta Maya, Viajes Caribe"
            />
          </div>

          {/* Contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contacto
            </label>
            <input
              type="text"
              value={formData.contacto}
              onChange={(e) =>
                setFormData({ ...formData, contacto: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Teléfono o email de contacto"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puede ser teléfono, email o ambos
            </p>
          </div>

          {/* Sitio Web */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sitio Web
            </label>
            <input
              type="url"
              value={formData.sitio_web}
              onChange={(e) =>
                setFormData({ ...formData, sitio_web: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          {/* Comisión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comisión (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.comision}
              onChange={(e) =>
                setFormData({ ...formData, comision: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: 10.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Porcentaje de comisión que cobra el operador
            </p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="3"
              placeholder="Notas adicionales sobre el operador..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? "Guardando..." : operator ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium transition-colors"
            >
              Cancelar
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

OperatorModal.propTypes = {
  operator: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
