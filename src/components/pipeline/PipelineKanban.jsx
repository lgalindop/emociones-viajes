import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Filter, User, Calendar, DollarSign, Eye } from "lucide-react";
import ConvertToSale from "../sales/ConvertToSale";
import DetallesCotizacion from "../../pages/DetallesCotizacion";

const STAGES = [
  {
    key: "lead",
    label: "Lead",
    color: "bg-gray-100 border-gray-300",
    prob: 25,
  },
  {
    key: "qualification",
    label: "Calificación",
    color: "bg-blue-100 border-blue-300",
    prob: 35,
  },
  {
    key: "quote_sent",
    label: "Cotización Enviada",
    color: "bg-purple-100 border-purple-300",
    prob: 50,
  },
  {
    key: "negotiation",
    label: "Negociación",
    color: "bg-yellow-100 border-yellow-300",
    prob: 65,
  },
  {
    key: "booking_confirmed",
    label: "Reserva Confirmada",
    color: "bg-green-100 border-green-300",
    prob: 90,
  },
  {
    key: "payment_pending",
    label: "Pago Pendiente",
    color: "bg-orange-100 border-orange-300",
    prob: 95,
  },
  {
    key: "fully_paid",
    label: "Pagado",
    color: "bg-teal-100 border-teal-300",
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

    // If moving to booking_confirmed, show convert modal
    if (
      targetStage === "booking_confirmed" &&
      draggedCard.pipeline_stage !== "booking_confirmed"
    ) {
      setSelectedCotizacion(draggedCard);
      setShowConvertModal(true);
      setDraggedCard(null);
      return;
    }

    // Update stage
    try {
      const stage = STAGES.find((s) => s.key === targetStage);
      const updates = {
        pipeline_stage: targetStage,
        probability: stage?.prob || draggedCard.probability,
      };

      // Set conversion date if moving to booking_confirmed
      if (targetStage === "booking_confirmed") {
        updates.conversion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("cotizaciones")
        .update(updates)
        .eq("id", draggedCard.id);

      if (error) throw error;

      // Log activity
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
    // Don't open details if we're dragging
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
    const days = Math.floor(
      (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24)
    );
    return days;
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

  // Show DetallesCotizacion if viewing a card
  if (viewingCotizacionId) {
    return (
      <DetallesCotizacion
        cotizacionId={viewingCotizacionId}
        onBack={() => {
          setViewingCotizacionId(null);
          fetchCotizaciones(); // Refresh in case changes were made
        }}
        onDeleted={() => {
          setViewingCotizacionId(null);
          fetchCotizaciones();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24 md:pb-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Pipeline de Ventas
            </h1>
            <p className="text-gray-600">
              {cotizaciones.length} oportunidades activas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onNewQuote}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus size={20} />
              Nueva Cotización
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageCards = cotizacionesByStage[stage.key] || [];
            const stageValue = stageCards.reduce(
              (sum, c) => sum + (c.presupuesto_aprox || 0),
              0
            );

            return (
              <div
                key={stage.key}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                {/* Stage Header */}
                <div className={`${stage.color} border-2 rounded-lg p-3 mb-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800">
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

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {stageCards.map((cotizacion) => (
                    <div
                      key={cotizacion.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cotizacion)}
                      onClick={(e) => handleCardClick(e, cotizacion.id)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all relative group"
                    >
                      {/* View icon on hover */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={16} className="text-primary" />
                      </div>

                      {/* Folio */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-500">
                          {cotizacion.folio}
                        </span>
                        <span className="text-xs text-gray-400">
                          {getDaysInStage(cotizacion.created_at)}d
                        </span>
                      </div>

                      {/* Cliente */}
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {cotizacion.cliente_nombre}
                      </h4>

                      {/* Destino */}
                      <p className="text-sm text-gray-600 mb-3">
                        📍 {cotizacion.destino}
                      </p>

                      {/* Detalles */}
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
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} />
                            {formatCurrency(cotizacion.presupuesto_aprox)}
                          </span>
                        )}
                      </div>

                      {/* Probability bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${cotizacion.probability}%` }}
                        />
                      </div>

                      {/* Assigned to */}
                      {cotizacion.assigned_to && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User size={12} />
                          <span>Asignado</span>
                        </div>
                      )}

                      {/* Hint text */}
                      <div className="text-xs text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click para ver detalles
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert to Sale Modal */}
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
