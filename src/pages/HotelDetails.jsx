import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeft,
  Building,
  Star,
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
  Calendar,
  Edit,
  Save,
  X,
  Plus,
  Users,
  Bed,
  DollarSign,
} from "lucide-react";
import HotelContacts from "../components/hotels/HotelContacts";
import HotelRooms from "../components/hotels/HotelRooms";
import HotelOperadores from "../components/hotels/HotelOperadores";
import HotelSeasons from "../components/hotels/HotelSeasons";
import Toast from "../components/ui/Toast";

const HOTEL_TIPOS = {
  hotel: { label: "Hotel", color: "bg-gray-100 text-gray-600" },
  resort: { label: "Resort", color: "bg-blue-100 text-blue-600" },
  boutique: { label: "Boutique", color: "bg-purple-100 text-purple-600" },
  all_inclusive: {
    label: "All Inclusive",
    color: "bg-green-100 text-green-600",
  },
  hostal: { label: "Hostal", color: "bg-orange-100 text-orange-600" },
  villa: { label: "Villa", color: "bg-pink-100 text-pink-600" },
};

const AMENIDADES_OPTIONS = [
  "piscina",
  "spa",
  "gimnasio",
  "restaurante",
  "bar",
  "wifi",
  "estacionamiento",
  "playa",
  "golf",
  "tenis",
  "kids_club",
  "business_center",
  "room_service",
  "lavanderia",
  "traslados",
  "tours",
  "buceo",
  "kayak",
  "jacuzzi",
];

export default function HotelDetalle({ hotelId, onBack }) {
  const { canEdit } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [toast, setToast] = useState(null);

  // Tag input for etiquetas
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (hotelId) {
      fetchHotel();
    }
  }, [hotelId]);

  async function fetchHotel() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hoteles")
        .select(
          `
          *,
          created_by_profile:created_by(full_name)
        `
        )
        .eq("id", hotelId)
        .single();

      if (error) throw error;
      setHotel(data);
      setEditData(data);
    } catch (error) {
      console.error("Error fetching hotel:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updateData = {
        nombre: editData.nombre,
        destino: editData.destino || null,
        categoria: editData.categoria || null,
        tipo: editData.tipo || "hotel",
        estrellas: editData.estrellas ? parseInt(editData.estrellas) : null,
        direccion: editData.direccion || null,
        ciudad: editData.ciudad || null,
        pais: editData.pais || "México",
        telefono_principal: editData.telefono_principal || null,
        email_reservaciones: editData.email_reservaciones || null,
        website: editData.website || null,
        comision_porcentaje: editData.comision_porcentaje
          ? parseFloat(editData.comision_porcentaje)
          : null,
        dias_pago: editData.dias_pago ? parseInt(editData.dias_pago) : 30,
        politica_cancelacion: editData.politica_cancelacion || null,
        politica_ninos: editData.politica_ninos || null,
        check_in_hora: editData.check_in_hora || "15:00",
        check_out_hora: editData.check_out_hora || "12:00",
        amenidades: editData.amenidades || [],
        etiquetas: editData.etiquetas || [],
        notas: editData.notas || null,
      };

      const { error } = await supabase
        .from("hoteles")
        .update(updateData)
        .eq("id", hotelId);

      if (error) throw error;

      setHotel({ ...hotel, ...updateData });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving hotel:", error);
      setToast({
        message: "Error al guardar: " + error.message,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !editData.etiquetas?.includes(tag)) {
      setEditData((prev) => ({
        ...prev,
        etiquetas: [...(prev.etiquetas || []), tag],
      }));
      setTagInput("");
    }
  }

  function removeTag(tagToRemove) {
    setEditData((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.filter((t) => t !== tagToRemove),
    }));
  }

  function toggleAmenidad(amenidad) {
    const current = editData.amenidades || [];
    if (current.includes(amenidad)) {
      setEditData((prev) => ({
        ...prev,
        amenidades: current.filter((a) => a !== amenidad),
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        amenidades: [...current, amenidad],
      }));
    }
  }

  function renderStars(count, editable = false) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!editable}
          onClick={() => editable && setEditData({ ...editData, estrellas: i })}
          className={`${editable ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={editable ? 24 : 16}
            className={
              i <= (editable ? editData.estrellas : count)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }
          />
        </button>
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Cargando hotel...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">Hotel no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Volver a Hoteles
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                  HOTEL_TIPOS[hotel.tipo || "hotel"]?.color ||
                  "bg-gray-100 text-gray-600"
                }`}
              >
                <Building size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {hotel.nombre}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {renderStars(hotel.estrellas)}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      HOTEL_TIPOS[hotel.tipo || "hotel"]?.color ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {HOTEL_TIPOS[hotel.tipo || "hotel"]?.label || "Hotel"}
                  </span>
                  {hotel.etiquetas?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {canEdit() && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit size={18} />
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Calendar size={18} />
              <span className="text-sm">Reservaciones</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {hotel.total_reservaciones || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Bed size={18} />
              <span className="text-sm">Noches</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {hotel.total_noches || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <DollarSign size={18} />
              <span className="text-sm">Ingresos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${(hotel.total_ingresos || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Star size={18} />
              <span className="text-sm">Calificación</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {hotel.calificacion_promedio?.toFixed(1) || "-"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 overflow-x-auto">
            <div className="flex min-w-max">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "info"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Información
              </button>
              <button
                onClick={() => setActiveTab("contactos")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "contactos"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users size={14} />
                Contactos
              </button>
              <button
                onClick={() => setActiveTab("habitaciones")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "habitaciones"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Bed size={14} />
                Habitaciones
              </button>
              <button
                onClick={() => setActiveTab("operadores")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "operadores"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Building size={14} />
                Operadores
              </button>
              <button
                onClick={() => setActiveTab("temporadas")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "temporadas"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calendar size={14} />
                Temporadas
              </button>
            </div>
          </div>

          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="p-6">
              {isEditing ? (
                /* Edit Form */
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={editData.nombre || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, nombre: e.target.value })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={editData.tipo || "hotel"}
                        onChange={(e) =>
                          setEditData({ ...editData, tipo: e.target.value })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        {Object.entries(HOTEL_TIPOS).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Stars */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estrellas
                    </label>
                    {renderStars(editData.estrellas, true)}
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destino
                      </label>
                      <input
                        type="text"
                        value={editData.destino || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, destino: e.target.value })
                        }
                        placeholder="Cancún, Riviera Maya, etc."
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={editData.ciudad || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, ciudad: e.target.value })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={editData.direccion || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            direccion: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        País
                      </label>
                      <input
                        type="text"
                        value={editData.pais || "México"}
                        onChange={(e) =>
                          setEditData({ ...editData, pais: e.target.value })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Principal
                      </label>
                      <input
                        type="tel"
                        value={editData.telefono_principal || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            telefono_principal: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Reservaciones
                      </label>
                      <input
                        type="email"
                        value={editData.email_reservaciones || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            email_reservaciones: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sitio Web
                      </label>
                      <input
                        type="url"
                        value={editData.website || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, website: e.target.value })
                        }
                        placeholder="https://"
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Business Terms */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Términos Comerciales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Comisión (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.comision_porcentaje || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              comision_porcentaje: e.target.value,
                            })
                          }
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Días de Pago
                        </label>
                        <input
                          type="number"
                          value={editData.dias_pago || 30}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              dias_pago: e.target.value,
                            })
                          }
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoría
                        </label>
                        <input
                          type="text"
                          value={editData.categoria || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              categoria: e.target.value,
                            })
                          }
                          placeholder="Lujo, Primera Clase, etc."
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Check-in/out */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in
                      </label>
                      <input
                        type="time"
                        value={editData.check_in_hora || "15:00"}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            check_in_hora: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-out
                      </label>
                      <input
                        type="time"
                        value={editData.check_out_hora || "12:00"}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            check_out_hora: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Policies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Política de Cancelación
                      </label>
                      <textarea
                        value={editData.politica_cancelacion || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            politica_cancelacion: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Política de Niños
                      </label>
                      <textarea
                        value={editData.politica_ninos || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            politica_ninos: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Amenidades */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenidades
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AMENIDADES_OPTIONS.map((amenidad) => (
                        <button
                          key={amenidad}
                          type="button"
                          onClick={() => toggleAmenidad(amenidad)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            editData.amenidades?.includes(amenidad)
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {amenidad}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Etiquetas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Etiquetas
                    </label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {[
                        "familiar",
                        "romántico",
                        "negocios",
                        "aventura",
                        "playa",
                        "ciudad",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!editData.etiquetas?.includes(tag)) {
                              setEditData((prev) => ({
                                ...prev,
                                etiquetas: [...(prev.etiquetas || []), tag],
                              }));
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            editData.etiquetas?.includes(tag)
                              ? "bg-primary/20 text-primary"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addTag())
                        }
                        placeholder="Agregar etiqueta..."
                        className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    {editData.etiquetas?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editData.etiquetas.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-red-500"
                            >
                              <X size={14} />
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
                      value={editData.notas || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, notas: e.target.value })
                      }
                      rows={3}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Notas internas sobre el hotel..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setEditData(hotel);
                        setIsEditing(false);
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">
                        {hotel.destino || "Sin destino"}
                        {hotel.ciudad && ` • ${hotel.ciudad}`}
                      </p>
                      {hotel.direccion && (
                        <p className="text-sm text-gray-500">
                          {hotel.direccion}
                        </p>
                      )}
                      {hotel.pais && hotel.pais !== "México" && (
                        <p className="text-sm text-gray-500">{hotel.pais}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  {(hotel.telefono_principal || hotel.email_reservaciones) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hotel.telefono_principal && (
                        <div className="flex items-center gap-3">
                          <Phone size={20} className="text-gray-400" />
                          <a
                            href={`tel:${hotel.telefono_principal}`}
                            className="text-primary hover:underline"
                          >
                            {hotel.telefono_principal}
                          </a>
                        </div>
                      )}
                      {hotel.email_reservaciones && (
                        <div className="flex items-center gap-3">
                          <Mail size={20} className="text-gray-400" />
                          <a
                            href={`mailto:${hotel.email_reservaciones}`}
                            className="text-primary hover:underline truncate"
                          >
                            {hotel.email_reservaciones}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {hotel.website && (
                    <div className="flex items-center gap-3">
                      <Globe size={20} className="text-gray-400" />
                      <a
                        href={
                          hotel.website.startsWith("http")
                            ? hotel.website
                            : `https://${hotel.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {hotel.website}
                      </a>
                    </div>
                  )}

                  {/* Check-in/out */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Check-in:{" "}
                        <span className="font-medium">
                          {hotel.check_in_hora || "15:00"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Check-out:{" "}
                        <span className="font-medium">
                          {hotel.check_out_hora || "12:00"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Business Terms */}
                  {(hotel.comision_porcentaje || hotel.dias_pago) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Términos Comerciales
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {hotel.comision_porcentaje && (
                          <div>
                            <span className="text-gray-500">Comisión:</span>
                            <span className="font-medium ml-2">
                              {hotel.comision_porcentaje}%
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Días de pago:</span>
                          <span className="font-medium ml-2">
                            {hotel.dias_pago || 30}
                          </span>
                        </div>
                        {hotel.categoria && (
                          <div>
                            <span className="text-gray-500">Categoría:</span>
                            <span className="font-medium ml-2">
                              {hotel.categoria}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Policies */}
                  {(hotel.politica_cancelacion || hotel.politica_ninos) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hotel.politica_cancelacion && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Política de Cancelación
                          </h4>
                          <p className="text-sm text-gray-600">
                            {hotel.politica_cancelacion}
                          </p>
                        </div>
                      )}
                      {hotel.politica_ninos && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Política de Niños
                          </h4>
                          <p className="text-sm text-gray-600">
                            {hotel.politica_ninos}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Amenidades */}
                  {hotel.amenidades?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Amenidades
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {hotel.amenidades.map((amenidad) => (
                          <span
                            key={amenidad}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {amenidad}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {hotel.notas && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">
                        Notas
                      </h4>
                      <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                        {hotel.notas}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-gray-400 pt-4 border-t">
                    Creado{" "}
                    {hotel.created_at &&
                      new Date(hotel.created_at).toLocaleDateString()}
                    {hotel.created_by_profile?.full_name &&
                      ` por ${hotel.created_by_profile.full_name}`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contactos Tab */}
          {activeTab === "contactos" && (
            <div className="p-6">
              <HotelContacts hotelId={hotelId} disabled={!canEdit()} />
            </div>
          )}

          {/* Habitaciones Tab */}
          {activeTab === "habitaciones" && (
            <div className="p-6">
              <HotelRooms hotelId={hotelId} disabled={!canEdit()} />
            </div>
          )}

          {/* Operadores Tab */}
          {activeTab === "operadores" && (
            <div className="p-6">
              <HotelOperadores hotelId={hotelId} disabled={!canEdit()} />
            </div>
          )}

          {/* Temporadas Tab */}
          {activeTab === "temporadas" && (
            <div className="p-6">
              <HotelSeasons hotelId={hotelId} disabled={!canEdit()} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
