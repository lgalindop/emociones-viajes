import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeft,
  User,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Edit,
  Save,
  X,
  Plus,
  ChevronDown,
  ExternalLink,
  Clock,
  Heart,
  Plane,
} from "lucide-react";
import CustomerRelaciones from "../components/customers/CustomerRelaciones";
import TravelersManager from "../components/customers/TravelersManager";
import Toast from "../components/ui/Toast";

export default function CustomerDetails({
  clienteId,
  onBack,
  onNavigateToQuote,
  onNavigateToSale,
  onNavigateToCliente,
}) {
  const { canEdit } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [toast, setToast] = useState(null);

  // Related data
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Viajeros state for travelers tab
  const [clienteViajeros, setClienteViajeros] = useState([]);
  const [loadingViajeros, setLoadingViajeros] = useState(false);
  const [savingViajeros, setSavingViajeros] = useState(false);

  // Tag input
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (clienteId) {
      fetchCliente();
    }
  }, [clienteId]);

  useEffect(() => {
    if (cliente && activeTab === "history") {
      fetchRelatedData();
    }
    if (cliente && activeTab === "viajeros") {
      fetchClienteViajeros();
    }
  }, [cliente, activeTab]);

  async function fetchCliente() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select(
          `
          *,
          referido_por_cliente:referido_por(id, nombre_completo),
          created_by_profile:created_by(full_name),
          cotizaciones!cotizaciones_cliente_id_fkey(
            id,
            ventas!ventas_cotizacion_id_fkey(
              id,
              precio_total,
              divisa
            )
          )
        `
        )
        .eq("id", clienteId)
        .single();

      if (error) throw error;

      // Calculate metrics
      const total_cotizaciones = data.cotizaciones?.length || 0;
      const total_ventas =
        data.cotizaciones?.reduce((total, cot) => {
          return total + (cot.ventas?.length || 0);
        }, 0) || 0;

      // Calculate total ingresos from all pagos for all ventas
      let total_ingresos = 0;
      if (data.cotizaciones && data.cotizaciones.length > 0) {
        const ventaIds = [];
        data.cotizaciones.forEach((cot) => {
          cot.ventas?.forEach((venta) => ventaIds.push(venta.id));
        });

        if (ventaIds.length > 0) {
          const { data: pagosData } = await supabase
            .from("pagos")
            .select("monto")
            .in("venta_id", ventaIds);

          total_ingresos =
            pagosData?.reduce(
              (sum, pago) => sum + parseFloat(pago.monto || 0),
              0
            ) || 0;
        }
      }

      const clienteWithMetrics = {
        ...data,
        total_cotizaciones,
        total_ventas,
        total_ingresos,
      };

      setCliente(clienteWithMetrics);
      setEditData(clienteWithMetrics);
    } catch (error) {
      console.error("Error fetching cliente:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelatedData() {
    setLoadingRelated(true);
    try {
      // Fetch cotizaciones
      const { data: cotData } = await supabase
        .from("cotizaciones")
        .select(
          "id, destino, fecha_salida, fecha_regreso, pipeline_stage, created_at"
        )
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false })
        .limit(20);

      setCotizaciones(cotData || []);

      // Fetch ventas through cotizaciones - only if there are cotizaciones
      if (cotData && cotData.length > 0) {
        const { data: ventasData, error: ventasError } = await supabase
          .from("ventas")
          .select(
            `
            id,
            precio_total,
            divisa,
            created_at,
            cotizacion:ventas_cotizacion_id_fkey(destino, fecha_salida)
          `
          )
          .in(
            "cotizacion_id",
            cotData.map((c) => c.id)
          )
          .order("created_at", { ascending: false });

        if (ventasError) {
          console.error("Error fetching ventas:", ventasError);
        }
        setVentas(ventasData || []);
      } else {
        setVentas([]);
      }

      // Fetch viajes (as viajero)
      const { data: viajesData } = await supabase
        .from("viajeros")
        .select(
          `
          id,
          es_titular,
          tipo_viajero,
          venta:venta_id(
            id,
            precio_total,
            cotizacion:cotizacion_id(destino, fecha_salida)
          )
        `
        )
        .eq("cliente_id", clienteId)
        .limit(20);

      setViajes(viajesData || []);
    } catch (error) {
      console.error("Error fetching related data:", error);
    } finally {
      setLoadingRelated(false);
    }
  }

  // Fetch viajeros linked to this client's sales
  async function fetchClienteViajeros() {
    setLoadingViajeros(true);
    try {
      // Get all ventas for this client via cotizaciones
      const { data: cotData } = await supabase
        .from("cotizaciones")
        .select("id")
        .eq("cliente_id", clienteId);

      if (!cotData || cotData.length === 0) {
        setClienteViajeros([]);
        return;
      }

      // Get ventas for these cotizaciones
      const { data: ventasData } = await supabase
        .from("ventas")
        .select(
          "id, folio_venta, cotizacion_id, cotizaciones!ventas_cotizacion_id_fkey(destino, fecha_salida, num_adultos, num_ninos, num_infantes)"
        )
        .in(
          "cotizacion_id",
          cotData.map((c) => c.id)
        );

      if (!ventasData || ventasData.length === 0) {
        setClienteViajeros([]);
        return;
      }

      // Get viajeros for all these ventas
      const { data: viajerosData } = await supabase
        .from("viajeros")
        .select("*")
        .in(
          "venta_id",
          ventasData.map((v) => v.id)
        )
        .order("es_titular", { ascending: false });

      // Group viajeros by venta with venta info
      const groupedViajeros = ventasData
        .map((venta) => ({
          venta,
          viajeros: viajerosData?.filter((v) => v.venta_id === venta.id) || [],
        }))
        .filter((g) => g.viajeros.length > 0 || true); // Show all ventas even without viajeros

      setClienteViajeros(groupedViajeros);
    } catch (error) {
      console.error("Error fetching viajeros:", error);
      setToast({ message: "Error al cargar viajeros", type: "error" });
    } finally {
      setLoadingViajeros(false);
    }
  }

  // Save viajeros for a specific venta
  async function saveViajerosForVenta(ventaId, viajeros, cotizacion) {
    setSavingViajeros(true);
    try {
      // Delete existing viajeros for this venta
      await supabase.from("viajeros").delete().eq("venta_id", ventaId);

      // Insert new viajeros
      if (viajeros.length > 0) {
        const viajerosData = viajeros.map((v) => ({
          venta_id: ventaId,
          cliente_id: v.cliente_id || null,
          nombre_completo: v.nombre_completo,
          tipo_viajero: v.tipo_viajero,
          es_titular: v.es_titular || false,
          fecha_nacimiento: v.fecha_nacimiento || null,
          nacionalidad: v.nacionalidad || null,
          pasaporte_numero: v.pasaporte_numero || null,
          pasaporte_vencimiento: v.pasaporte_vencimiento || null,
          telefono: v.telefono || null,
          email: v.email || null,
          requerimientos_especiales: v.requerimientos_especiales || null,
        }));

        const { error } = await supabase.from("viajeros").insert(viajerosData);

        if (error) throw error;
      }

      setToast({ message: "Viajeros guardados", type: "success" });
      fetchClienteViajeros();
    } catch (error) {
      console.error("Error saving viajeros:", error);
      setToast({
        message: "Error al guardar viajeros: " + error.message,
        type: "error",
      });
    } finally {
      setSavingViajeros(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updateData = {
        nombre_completo: editData.nombre_completo,
        telefono: editData.telefono || null,
        email: editData.email || null,
        telefono_secundario: editData.telefono_secundario || null,
        tipo: editData.tipo,
        preferencia_contacto: editData.preferencia_contacto,
        mejor_horario: editData.mejor_horario || null,
        fecha_nacimiento: editData.fecha_nacimiento || null,
        direccion: editData.direccion || null,
        ciudad: editData.ciudad || null,
        estado: editData.estado || null,
        codigo_postal: editData.codigo_postal || null,
        pais: editData.pais || null,
        rfc: editData.rfc || null,
        razon_social: editData.razon_social || null,
        notas: editData.notas || null,
        etiquetas: editData.etiquetas || [],
      };

      const { error } = await supabase
        .from("clientes")
        .update(updateData)
        .eq("id", clienteId);

      if (error) throw error;

      setCliente({ ...cliente, ...updateData });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving cliente:", error);
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

  const tipoIcons = {
    individual: <User size={24} />,
    corporate: <Building2 size={24} />,
    agency: <Users size={24} />,
  };

  const tipoLabels = {
    individual: "Individual",
    corporate: "Corporativo",
    agency: "Agencia",
  };

  const stageLabels = {
    lead: "Lead",
    contacted: "Contactado",
    quoted: "Cotizado",
    negotiating: "Negociando",
    won: "Ganado",
    lost: "Perdido",
  };

  const stageColors = {
    lead: "bg-gray-100 text-gray-700",
    contacted: "bg-blue-100 text-blue-700",
    quoted: "bg-yellow-100 text-yellow-700",
    negotiating: "bg-purple-100 text-purple-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
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
          <p className="text-gray-500">Cliente no encontrado</p>
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
            Volver a Clientes
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  cliente.tipo === "corporate"
                    ? "bg-blue-100 text-blue-600"
                    : cliente.tipo === "agency"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {tipoIcons[cliente.tipo]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {cliente.nombre_completo}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {tipoLabels[cliente.tipo]}
                  </span>
                  {cliente.etiquetas?.map((tag) => (
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FileText size={18} />
              <span className="text-sm">Cotizaciones</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {cliente.total_cotizaciones || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <DollarSign size={18} />
              <span className="text-sm">Ventas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {cliente.total_ventas || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <DollarSign size={18} />
              <span className="text-sm">Ingresos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${(cliente.total_ingresos || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <div className="flex">
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
                onClick={() => setActiveTab("history")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Historial
              </button>
              <button
                onClick={() => setActiveTab("viajeros")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "viajeros"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Plane size={14} />
                Viajeros
              </button>
              <button
                onClick={() => setActiveTab("relaciones")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "relaciones"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Heart size={14} />
                Relaciones
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
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={editData.nombre_completo || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            nombre_completo: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={editData.tipo || "individual"}
                        onChange={(e) =>
                          setEditData({ ...editData, tipo: e.target.value })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="individual">Individual</option>
                        <option value="corporate">Corporativo</option>
                        <option value="agency">Agencia</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={editData.telefono || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, telefono: e.target.value })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editData.email || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Secundario
                      </label>
                      <input
                        type="tel"
                        value={editData.telefono_secundario || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            telefono_secundario: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferencia de Contacto
                      </label>
                      <select
                        value={editData.preferencia_contacto || "whatsapp"}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            preferencia_contacto: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="call">Llamada</option>
                        <option value="any">Cualquiera</option>
                      </select>
                    </div>
                  </div>

                  {/* Demographics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={editData.fecha_nacimiento || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            fecha_nacimiento: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RFC
                      </label>
                      <input
                        type="text"
                        value={editData.rfc || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            rfc: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Etiquetas
                    </label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {["VIP", "Frecuente", "Corporativo", "Referido"].map(
                        (tag) => (
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
                            className={`text-xs px-2 py-1 rounded-full border transition-all ${
                              editData.etiquetas?.includes(tag)
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-gray-300 text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            + {tag}
                          </button>
                        )
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addTag())
                        }
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
                    {editData.etiquetas?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {editData.etiquetas.map((tag) => (
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
                      value={editData.notas || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, notas: e.target.value })
                      }
                      rows="3"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Notas internas..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(cliente);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !editData.nombre_completo?.trim()}
                      className="px-4 py-2 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cliente.telefono && (
                        <div className="flex items-center gap-3">
                          <Phone size={18} className="text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <p className="font-medium">{cliente.telefono}</p>
                          </div>
                        </div>
                      )}
                      {cliente.email && (
                        <div className="flex items-center gap-3">
                          <Mail size={18} className="text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{cliente.email}</p>
                          </div>
                        </div>
                      )}
                      {cliente.telefono_secundario && (
                        <div className="flex items-center gap-3">
                          <Phone size={18} className="text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Teléfono Secundario
                            </p>
                            <p className="font-medium">
                              {cliente.telefono_secundario}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Preferencia</p>
                          <p className="font-medium capitalize">
                            {cliente.preferencia_contacto}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(cliente.fecha_nacimiento ||
                    cliente.rfc ||
                    cliente.razon_social) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Información Adicional
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cliente.fecha_nacimiento && (
                          <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Fecha de Nacimiento
                              </p>
                              <p className="font-medium">
                                {new Date(
                                  cliente.fecha_nacimiento + "T00:00:00"
                                ).toLocaleDateString("es-MX")}
                              </p>
                            </div>
                          </div>
                        )}
                        {cliente.rfc && (
                          <div>
                            <p className="text-sm text-gray-500">RFC</p>
                            <p className="font-medium">{cliente.rfc}</p>
                          </div>
                        )}
                        {cliente.razon_social && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Razón Social
                            </p>
                            <p className="font-medium">
                              {cliente.razon_social}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {(cliente.direccion || cliente.ciudad) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Dirección
                      </h3>
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-gray-400 mt-0.5" />
                        <div>
                          {cliente.direccion && <p>{cliente.direccion}</p>}
                          <p>
                            {[
                              cliente.ciudad,
                              cliente.estado,
                              cliente.codigo_postal,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          {cliente.pais && (
                            <p className="text-gray-500">{cliente.pais}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {cliente.notas && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Notas
                      </h3>
                      <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                        {cliente.notas}
                      </p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="pt-4 border-t text-sm text-gray-500">
                    <p>
                      Creado el{" "}
                      {new Date(cliente.created_at).toLocaleDateString("es-MX")}
                      {cliente.created_by_profile &&
                        ` por ${cliente.created_by_profile.full_name}`}
                    </p>
                    {cliente.ultima_interaccion && (
                      <p>
                        Última interacción:{" "}
                        {new Date(
                          cliente.ultima_interaccion
                        ).toLocaleDateString("es-MX")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="p-6">
              {loadingRelated ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500 text-sm">
                    Cargando historial...
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Cotizaciones */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                      <FileText size={16} />
                      Cotizaciones ({cotizaciones.length})
                    </h3>
                    {cotizaciones.length > 0 ? (
                      <div className="space-y-2">
                        {cotizaciones.map((cot) => (
                          <div
                            key={cot.id}
                            onClick={() => onNavigateToQuote?.(cot.id)}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="font-medium">{cot.destino}</p>
                              <p className="text-sm text-gray-500">
                                {cot.fecha_salida &&
                                  new Date(
                                    cot.fecha_salida + "T00:00:00"
                                  ).toLocaleDateString("es-MX")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${stageColors[cot.pipeline_stage]}`}
                              >
                                {stageLabels[cot.pipeline_stage]}
                              </span>
                              <ExternalLink
                                size={16}
                                className="text-gray-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm py-4 text-center">
                        No hay cotizaciones registradas
                      </p>
                    )}
                  </div>

                  {/* Ventas */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                      <DollarSign size={16} />
                      Ventas ({ventas.length})
                    </h3>
                    {ventas.length > 0 ? (
                      <div className="space-y-2">
                        {ventas.map((venta) => (
                          <div
                            key={venta.id}
                            onClick={() => onNavigateToSale?.(venta.id)}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="font-medium">
                                {venta.cotizacion?.destino}
                              </p>
                              <p className="text-sm text-gray-500">
                                {venta.cotizacion?.fecha_salida &&
                                  new Date(
                                    venta.cotizacion.fecha_salida + "T00:00:00"
                                  ).toLocaleDateString("es-MX")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">
                                $
                                {parseFloat(
                                  venta.precio_total
                                ).toLocaleString()}{" "}
                                {venta.divisa}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {venta.estatus}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm py-4 text-center">
                        No hay ventas registradas
                      </p>
                    )}
                  </div>

                  {/* Viajes como viajero */}
                  {viajes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                        <User size={16} />
                        Viajes como pasajero ({viajes.length})
                      </h3>
                      <div className="space-y-2">
                        {viajes.map((viaje) => (
                          <div
                            key={viaje.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {viaje.venta?.cotizacion?.destino}
                              </p>
                              <p className="text-sm text-gray-500">
                                {viaje.venta?.cotizacion?.fecha_salida &&
                                  new Date(
                                    viaje.venta.cotizacion.fecha_salida +
                                      "T00:00:00"
                                  ).toLocaleDateString("es-MX")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {viaje.es_titular && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  Titular
                                </span>
                              )}
                              <span className="text-xs text-gray-500 capitalize">
                                {viaje.tipo_viajero}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Viajeros Tab */}
          {activeTab === "viajeros" && (
            <div className="p-6">
              {loadingViajeros ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-2 text-gray-500 text-sm">
                    Cargando viajeros...
                  </p>
                </div>
              ) : clienteViajeros.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Plane size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No hay ventas con viajeros registrados</p>
                  <p className="text-sm mt-1">
                    Los viajeros se registran al crear una venta
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {clienteViajeros.map(({ venta, viajeros }) => (
                    <ViajerosSection
                      key={venta.id}
                      venta={venta}
                      viajeros={viajeros}
                      clienteId={clienteId}
                      canEdit={canEdit()}
                      onSave={(newViajeros) =>
                        saveViajerosForVenta(
                          venta.id,
                          newViajeros,
                          venta.cotizaciones
                        )
                      }
                      saving={savingViajeros}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Relaciones Tab */}
          {activeTab === "relaciones" && (
            <div className="p-6">
              <CustomerRelaciones
                clienteId={clienteId}
                onNavigateToCliente={onNavigateToCliente}
                disabled={!canEdit()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Viajeros Section Component for each venta
function ViajerosSection({
  venta,
  viajeros,
  clienteId,
  canEdit,
  onSave,
  saving,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editViajeros, setEditViajeros] = useState([]);

  function startEditing() {
    setEditViajeros(
      viajeros.map((v) => ({ ...v, id: v.id || crypto.randomUUID() }))
    );
    setIsEditing(true);
  }

  function handleSave() {
    onSave(editViajeros);
    setIsEditing(false);
  }

  const cotizacion = venta.cotizaciones;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{venta.folio_venta}</p>
          <p className="text-sm text-gray-500">
            {cotizacion?.destino} •{" "}
            {cotizacion?.fecha_salida &&
              new Date(
                cotizacion.fecha_salida + "T00:00:00"
              ).toLocaleDateString("es-MX")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {viajeros.length} de{" "}
            {(cotizacion?.num_adultos || 0) +
              (cotizacion?.num_ninos || 0) +
              (cotizacion?.num_infantes || 0)}{" "}
            viajeros
          </span>
          {canEdit && !isEditing && (
            <button
              onClick={startEditing}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Edit size={14} className="inline mr-1" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <>
            <TravelersManager
              viajeros={editViajeros}
              onChange={setEditViajeros}
              numAdultos={cotizacion?.num_adultos || 0}
              numMenores={cotizacion?.num_ninos || 0}
              numInfantes={cotizacion?.num_infantes || 0}
              clienteId={clienteId}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </>
        ) : viajeros.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">
              No hay viajeros registrados para esta venta
            </p>
            {canEdit && (
              <button
                onClick={startEditing}
                className="text-primary hover:text-primary/80 text-sm mt-2"
              >
                + Agregar viajeros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {viajeros.map((viajero) => (
              <div
                key={viajero.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  viajero.es_titular
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      viajero.tipo_viajero === "menor"
                        ? "bg-blue-100 text-blue-600"
                        : viajero.tipo_viajero === "infante"
                          ? "bg-pink-100 text-pink-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <User size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {viajero.nombre_completo}
                      {viajero.es_titular && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full">
                          Titular
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {viajero.tipo_viajero}
                      {viajero.pasaporte_numero &&
                        ` • Pasaporte: ${viajero.pasaporte_numero}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
