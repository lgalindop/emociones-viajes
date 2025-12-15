import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus,
  User,
  Calendar,
  DollarSign,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react";
import ConvertToSale from "../sales/ConvertToSale";
import DetallesCotizacion from "../../pages/DetallesCotizacion";

const STAGES = [
  {
    key: "lead",
    label: "Lead",
    color: "bg-gray-100 border-gray-300",
    textColor: "text-gray-700",
    prob: 25,
  },
  {
    key: "qualification",
    label: "Calificación",
    color: "bg-blue-100 border-blue-300",
    textColor: "text-blue-700",
    prob: 35,
  },
  {
    key: "quote_sent",
    label: "Cotización Enviada",
    color: "bg-purple-100 border-purple-300",
    textColor: "text-purple-700",
    prob: 50,
  },
  {
    key: "negotiation",
    label: "Negociación",
    color: "bg-yellow-100 border-yellow-300",
    textColor: "text-yellow-700",
    prob: 65,
  },
  {
    key: "booking_confirmed",
    label: "Reserva Confirmada",
    color: "bg-green-100 border-green-300",
    textColor: "text-green-700",
    prob: 90,
  },
  {
    key: "payment_pending",
    label: "Pago Pendiente",
    color: "bg-orange-100 border-orange-300",
    textColor: "text-orange-700",
    prob: 95,
  },
  {
    key: "fully_paid",
    label: "Pagado",
    color: "bg-teal-100 border-teal-300",
    textColor: "text-teal-700",
    prob: 100,
  },
];

export default function PipelineKanban({ onNewQuote }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [viewingCotizacionId, setViewingCotizacionId] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // 'list' or 'kanban'
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  async function fetchCotizaciones() {
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .not("pipeline_stage", "in", '("lost","cancelled","delivered")')
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragStart(e, cotizacion) {
    setDraggedCard(cotizacion);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e, targetStage) {
    e.preventDefault();

    if (!draggedCard || draggedCard.pipeline_stage === targetStage) {
      setDraggedCard(null);
      return;
    }

    if (
      targetStage === "booking_confirmed" &&
      draggedCard.pipeline_stage !== "booking_confirmed"
    ) {
      setSelectedCotizacion(draggedCard);
      setShowConvertModal(true);
      setDraggedCard(null);
      return;
    }

    try {
      const stage = STAGES.find((s) => s.key === targetStage);
      const updates = {
        pipeline_stage: targetStage,
        probability: stage?.prob || draggedCard.probability,
      };

      if (targetStage === "booking_confirmed") {
        updates.conversion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("cotizaciones")
        .update(updates)
        .eq("id", draggedCard.id);

      if (error) throw error;

      await supabase.from("actividades").insert({
        cotizacion_id: draggedCard.id,
        tipo: "status_change",
        asunto: `Movido a ${stage?.label || targetStage}`,
        descripcion: `Pipeline stage actualizado de ${draggedCard.pipeline_stage} a ${targetStage}`,
        created_by: user.id,
      });

      fetchCotizaciones();
    } catch (error) {
      console.error("Error updating stage:", error);
      alert("Error al actualizar etapa");
    }

    setDraggedCard(null);
  }

  function handleCardClick(e, cotizacionId) {
    if (e.defaultPrevented) return;
    setViewingCotizacionId(cotizacionId);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }

  function getDaysInStage(createdAt) {
    return Math.floor(
      (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24)
    );
  }

  const cotizacionesByStage = STAGES.reduce((acc, stage) => {
    acc[stage.key] = cotizaciones.filter((c) => c.pipeline_stage === stage.key);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando pipeline...</div>
      </div>
    );
  }

  if (viewingCotizacionId) {
    return (
      <DetallesCotizacion
        cotizacionId={viewingCotizacionId}
        onBack={() => {
          setViewingCotizacionId(null);
          fetchCotizaciones();
        }}
        onDeleted={() => {
          setViewingCotizacionId(null);
          fetchCotizaciones();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 pb-24 md:pb-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Pipeline de Ventas
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {cotizaciones.length} oportunidades activas
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Mobile view toggle */}
            <div className="md:hidden flex gap-1 border rounded-lg p-1 bg-white">
              <button
                onClick={() => setMobileView("list")}
                className={`p-2 rounded transition-colors ${
                  mobileView === "list"
                    ? "bg-primary text-white"
                    : "text-gray-600"
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setMobileView("kanban")}
                className={`p-2 rounded transition-colors ${
                  mobileView === "kanban"
                    ? "bg-primary text-white"
                    : "text-gray-600"
                }`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <button
              onClick={onNewQuote}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex-1 sm:flex-initial"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nueva Cotización</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </div>

        {/* MOBILE LIST VIEW */}
        <div className="md:hidden">
          {mobileView === "list" ? (
            <div className="space-y-3">
              {cotizaciones.map((cotizacion) => {
                const stage = STAGES.find(
                  (s) => s.key === cotizacion.pipeline_stage
                );
                return (
                  <div
                    key={cotizacion.id}
                    onClick={(e) => handleCardClick(e, cotizacion.id)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer active:scale-98 transition-transform"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-gray-500">
                        {cotizacion.folio}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${stage?.color} ${stage?.textColor} font-medium`}
                      >
                        {stage?.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {cotizacion.cliente_nombre}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {cotizacion.destino}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(cotizacion.fecha_salida).toLocaleDateString(
                          "es-MX",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                      {cotizacion.presupuesto_aprox && (
                        <span className="font-medium">
                          {formatCurrency(cotizacion.presupuesto_aprox)}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${cotizacion.probability}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Mobile Kanban - Vertical stages
            <div className="space-y-4">
              {STAGES.map((stage) => {
                const stageCards = cotizacionesByStage[stage.key] || [];
                if (stageCards.length === 0) return null;
                return (
                  <div key={stage.key}>
                    <div
                      className={`${stage.color} border-2 rounded-lg p-3 mb-2`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                          {stage.label}
                        </h3>
                        <span className="text-sm font-medium text-gray-600">
                          {stageCards.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 pl-2">
                      {stageCards.map((cotizacion) => (
                        <div
                          key={cotizacion.id}
                          onClick={(e) => handleCardClick(e, cotizacion.id)}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-gray-500">
                              {cotizacion.folio}
                            </span>
                            <span className="text-xs text-gray-400">
                              {getDaysInStage(cotizacion.created_at)}d
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-800">
                            {cotizacion.cliente_nombre}
                          </h4>
                          <p className="text-xs text-gray-600">
                            📍 {cotizacion.destino}
                          </p>
                          {cotizacion.presupuesto_aprox && (
                            <p className="text-xs font-medium text-gray-700 mt-1">
                              {formatCurrency(cotizacion.presupuesto_aprox)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DESKTOP KANBAN VIEW */}
        <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageCards = cotizacionesByStage[stage.key] || [];
            const stageValue = stageCards.reduce(
              (sum, c) => sum + (c.presupuesto_aprox || 0),
              0
            );

            return (
              <div
                key={stage.key}
                className="flex-shrink-0 w-72"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <div className={`${stage.color} border-2 rounded-lg p-3 mb-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {stage.label}
                    </h3>
                    <span className="text-sm font-medium text-gray-600">
                      {stageCards.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {formatCurrency(stageValue)}
                  </p>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {stageCards.map((cotizacion) => (
                    <div
                      key={cotizacion.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cotizacion)}
                      onClick={(e) => handleCardClick(e, cotizacion.id)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all relative group"
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={14} className="text-primary" />
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-500">
                          {cotizacion.folio}
                        </span>
                        <span className="text-xs text-gray-400">
                          {getDaysInStage(cotizacion.created_at)}d
                        </span>
                      </div>

                      <h4 className="font-semibold text-sm text-gray-800 mb-1 pr-6">
                        {cotizacion.cliente_nombre}
                      </h4>

                      <p className="text-xs text-gray-600 mb-2">
                        📍 {cotizacion.destino}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(cotizacion.fecha_salida).toLocaleDateString(
                            "es-MX",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        {cotizacion.presupuesto_aprox && (
                          <span className="flex items-center gap-1 font-medium">
                            <DollarSign size={12} />
                            {formatCurrency(cotizacion.presupuesto_aprox)}
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${cotizacion.probability}%` }}
                        />
                      </div>

                      {cotizacion.assigned_to && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User size={12} />
                          <span>Asignado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showConvertModal && selectedCotizacion && (
        <ConvertToSale
          cotizacion={selectedCotizacion}
          onClose={() => {
            setShowConvertModal(false);
            setSelectedCotizacion(null);
          }}
          onSuccess={() => {
            setShowConvertModal(false);
            setSelectedCotizacion(null);
            fetchCotizaciones();
          }}
        />
      )}
    </div>
  );
}
