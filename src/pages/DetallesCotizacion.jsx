import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Share2,
  Calendar,
  Users,
  MapPin,
  DollarSign,
} from "lucide-react";
import EditarCotizacion from "./EditarCotizacion";
import ExportToWhatsApp from "../components/export/ExportToWhatsApp";
import ExportToPDF from "../components/export/ExportToPDF";

export default function DetallesCotizacion({
  cotizacionId,
  onBack,
  onDeleted,
}) {
  const [cotizacion, setCotizacion] = useState(null);
  const [opciones, setOpciones] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const { user, profile, isAdmin, canEdit } = useAuth();

  useEffect(() => {
    fetchCotizacion();
  }, [cotizacionId]);

  async function fetchCotizacion() {
    try {
      const { data: cotData, error: cotError } = await supabase
        .from("cotizaciones")
        .select("*")
        .eq("id", cotizacionId)
        .single();

      if (cotError) throw cotError;

      const { data: opcsData, error: opcsError } = await supabase
        .from("opciones_cotizacion")
        .select("*, operadores(nombre)")
        .eq("cotizacion_id", cotizacionId);

      if (opcsError) throw opcsError;

      const { data: operData, error: operError } = await supabase
        .from("operadores")
        .select("*")
        .eq("activo", true);

      if (operError) throw operError;

      setCotizacion(cotData);
      setOpciones(opcsData || []);
      setOperadores(operData || []);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar cotización");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    // Only admins can delete
    if (!isAdmin()) {
      alert("Solo administradores pueden eliminar cotizaciones");
      return;
    }

    if (!confirm("¿Eliminar esta cotización?")) return;

    try {
      const { error } = await supabase
        .from("cotizaciones")
        .delete()
        .eq("id", cotizacionId);

      if (error) throw error;

      alert("Cotización eliminada");
      onDeleted();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar: " + error.message);
    }
  }

  // Check if current user can edit this cotizacion
  function canEditThis() {
    if (!cotizacion || !user || !profile) return false;

    // Admins can edit everything
    if (isAdmin()) return true;

    // Agents can edit only their own
    if (profile.role === "agent" && cotizacion.created_by === user.id)
      return true;

    // Viewers cannot edit
    return false;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getEstatusColor(estatus) {
    const colors = {
      nueva: "bg-blue-100 text-blue-800",
      enviada: "bg-purple-100 text-purple-800",
      seguimiento: "bg-yellow-100 text-yellow-800",
      cerrada: "bg-green-100 text-green-800",
      perdida: "bg-red-100 text-red-800",
    };
    return colors[estatus] || "bg-gray-100 text-gray-800";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!cotizacion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Cotización no encontrada</div>
      </div>
    );
  }

  if (editMode) {
    return (
      <EditarCotizacion
        cotizacion={{ ...cotizacion, opciones_cotizacion: opciones }}
        onBack={() => setEditMode(false)}
        onSuccess={() => {
          setEditMode(false);
          fetchCotizacion();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Regresar</span>
          </button>

          <div className="flex gap-3">
            <ExportToWhatsApp
              cotizacion={cotizacion}
              opciones={opciones}
              operadores={operadores}
            />
            <ExportToPDF
              cotizacion={cotizacion}
              opciones={opciones}
              operadores={operadores}
            />
            {canEditThis() && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit size={18} />
                Editar
              </button>
            )}
            {isAdmin() && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} />
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Folio</p>
                <h1 className="text-3xl font-bold">{cotizacion.folio}</h1>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getEstatusColor(cotizacion.estatus)}`}
              >
                {cotizacion.estatus}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client Info */}
            <div className="border-l-4 border-primary pl-4">
              <h2 className="text-xl font-semibold mb-3 text-primary">
                👤 Información del Cliente
              </h2>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {cotizacion.cliente_nombre}
                </p>
                {cotizacion.cliente_telefono && (
                  <p className="text-gray-600">
                    📞 {cotizacion.cliente_telefono}
                  </p>
                )}
                {cotizacion.cliente_email && (
                  <p className="text-gray-600">✉️ {cotizacion.cliente_email}</p>
                )}
              </div>
            </div>

            {/* Trip Details */}
            <div className="border-l-4 border-teal-500 pl-4">
              <h2 className="text-xl font-semibold mb-3 text-teal-700">
                ✈️ Detalles del Viaje
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-teal-600 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Destino</p>
                    <p className="font-semibold">{cotizacion.destino}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="text-teal-600 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Fechas</p>
                    <p className="font-semibold">
                      {formatDate(cotizacion.fecha_salida)} -{" "}
                      {formatDate(cotizacion.fecha_regreso)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="text-teal-600 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Viajeros</p>
                    <p className="font-semibold">
                      {cotizacion.num_adultos} adulto(s)
                      {cotizacion.num_ninos > 0 &&
                        `, ${cotizacion.num_ninos} niño(s)`}
                    </p>
                  </div>
                </div>
                {cotizacion.presupuesto_aprox && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="text-teal-600 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">
                        Presupuesto Aprox.
                      </p>
                      <p className="font-semibold">
                        $
                        {parseFloat(
                          cotizacion.presupuesto_aprox
                        ).toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            {opciones.length > 0 && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h2 className="text-xl font-semibold mb-3 text-purple-700">
                  📋 Opciones de Paquetes
                </h2>
                <div className="space-y-4">
                  {opciones.map((opcion, idx) => (
                    <div
                      key={opcion.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-lg">
                            Opción {idx + 1}: {opcion.nombre_paquete}
                          </p>
                          <p className="text-sm text-gray-600">
                            {opcion.operadores?.nombre}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            $
                            {parseFloat(opcion.precio_total).toLocaleString(
                              "es-MX"
                            )}
                          </p>
                          {opcion.precio_por_persona > 0 && (
                            <p className="text-sm text-gray-500">
                              $
                              {parseFloat(
                                opcion.precio_por_persona
                              ).toLocaleString("es-MX")}{" "}
                              por persona
                            </p>
                          )}
                        </div>
                      </div>

                      {opcion.incluye && opcion.incluye.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-green-700 mb-1">
                            ✓ Incluye:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {opcion.incluye.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {opcion.no_incluye && opcion.no_incluye.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-red-700 mb-1">
                            ✗ No incluye:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {opcion.no_incluye.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {opcion.disponibilidad && (
                        <p className="text-sm text-gray-600 mt-2">
                          📅 Disponibilidad: {opcion.disponibilidad}
                        </p>
                      )}

                      {opcion.link_paquete && (
                        <a
                          href={opcion.link_paquete}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          🔗 Ver más información
                        </a>
                      )}

                      {opcion.notas && (
                        <p className="text-sm text-gray-600 mt-2 italic bg-yellow-50 p-2 rounded">
                          📝 {opcion.notas}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {cotizacion.notas && (
              <div className="border-l-4 border-gray-400 pl-4">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  📝 Notas
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {cotizacion.notas}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
