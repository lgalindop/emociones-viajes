import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { X, Building, Star, MapPin } from "lucide-react";

const HOTEL_TIPOS = {
  hotel: "Hotel",
  resort: "Resort",
  boutique: "Boutique",
  all_inclusive: "All Inclusive",
  hostal: "Hostal",
  villa: "Villa",
};

export default function HotelQuickCreate({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "hotel",
    estrellas: "",
    destino: "",
    ciudad: "",
    pais: "México",
    telefono_principal: "",
    email_reservaciones: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert("El nombre es requerido");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hoteles")
        .insert({
          nombre: formData.nombre.trim(),
          tipo: formData.tipo,
          estrellas: formData.estrellas ? parseInt(formData.estrellas) : null,
          destino: formData.destino.trim() || null,
          ciudad: formData.ciudad.trim() || null,
          pais: formData.pais.trim() || "México",
          telefono_principal: formData.telefono_principal.trim() || null,
          email_reservaciones: formData.email_reservaciones.trim() || null,
          website: formData.website.trim() || null,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      onCreated?.(data);
      onClose();

      // Reset form
      setFormData({
        nombre: "",
        tipo: "hotel",
        estrellas: "",
        destino: "",
        ciudad: "",
        pais: "México",
        telefono_principal: "",
        email_reservaciones: "",
        website: "",
      });
    } catch (error) {
      console.error("Error creating hotel:", error);
      alert("Error al crear hotel: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Nuevo Hotel</h2>
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Hotel *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Grand Fiesta Americana"
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Tipo y Estrellas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {Object.entries(HOTEL_TIPOS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estrellas
              </label>
              <select
                value={formData.estrellas}
                onChange={(e) => setFormData({ ...formData, estrellas: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Sin clasificar</option>
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="2">2 estrellas</option>
                <option value="1">1 estrella</option>
              </select>
            </div>
          </div>

          {/* Destino y Ciudad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino
              </label>
              <input
                type="text"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                placeholder="Cancún, Riviera Maya..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Ej: Cancún"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* País */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <input
              type="text"
              value={formData.pais}
              onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
              placeholder="México"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Contacto */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Contacto (opcional)</h3>
            <div className="space-y-3">
              <input
                type="tel"
                value={formData.telefono_principal}
                onChange={(e) => setFormData({ ...formData, telefono_principal: e.target.value })}
                placeholder="Teléfono principal"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <input
                type="email"
                value={formData.email_reservaciones}
                onChange={(e) => setFormData({ ...formData, email_reservaciones: e.target.value })}
                placeholder="Email de reservaciones"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="Sitio web (https://...)"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Hotel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
