import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import DetallesCotizacion from "../../pages/DetallesCotizacion";
import ConvertToSale from "../sales/ConvertToSale";

const STAGES = {
  lead: { label: "Lead", color: "bg-gray-100 border-gray-300" },
  qualification: {
    label: "Calificación",
    color: "bg-blue-100 border-blue-300",
  },
  quote_sent: {
    label: "Cotización Enviada",
    color: "bg-purple-100 border-purple-300",
  },
  negotiation: {
    label: "Negociación",
    color: "bg-yellow-100 border-yellow-300",
  },
  booking_confirmed: {
    label: "Reserva Confirmada",
    color: "bg-green-100 border-green-300",
  },
};

const STAGE_ORDER = [
  "lead",
  "qualification",
  "quote_sent",
  "negotiation",
  "booking_confirmed",
];

export default function PipelineKanban({ onNewQuote }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCot, setSelectedCot] = useState(null);
  const [moveDirection, setMoveDirection] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [viewingCotizacionId, setViewingCotizacionId] = useState(null);
  const [showConvertToSale, setShowConvertToSale] = useState(false);
  const [convertingCotizacion, setConvertingCotizacion] = useState(null);
  const [convertOpciones, setConvertOpciones] = useState([]);
  const [convertOperadores, setConvertOperadores] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  async function fetchCotizaciones() {
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStageIndex(stage) {
    return STAGE_ORDER.indexOf(stage);
  }

  function canMoveForward(stage) {
    return getStageIndex(stage) < STAGE_ORDER.length - 1;
  }

  function canMoveBack(stage) {
    return getStageIndex(stage) > 0;
  }

  function getNextStage(currentStage) {
    const idx = getStageIndex(currentStage);
    return STAGE_ORDER[idx + 1];
  }

  function getPrevStage(currentStage) {
    const idx = getStageIndex(currentStage);
    return STAGE_ORDER[idx - 1];
  }

  function promptMoveForward(cot) {
    setSelectedCot(cot);
    setMoveDirection("forward");
    setShowConfirmModal(true);
  }

  function promptMoveBack(cot) {
    setSelectedCot(cot);
    setMoveDirection("back");
    setShowConfirmModal(true);
  }

  async function confirmMove() {
    if (!selectedCot) return;

    const currentStage = selectedCot.pipeline_stage;
    const newStage =
      moveDirection === "forward"
        ? getNextStage(currentStage)
        : getPrevStage(currentStage);

    // If moving to booking_confirmed, show convert to sale modal
    if (newStage === "booking_confirmed") {
      setShowConfirmModal(false);

      // Fetch opciones and operadores for this cotizacion
      const { data: opciones } = await supabase
        .from("opciones_cotizacion")
        .select("*")
        .eq("cotizacion_id", selectedCot.id);

      const { data: operadores } = await supabase
        .from("operadores")
        .select("*");

      setConvertOpciones(opciones || []);
      setConvertOperadores(operadores || []);
      setConvertingCotizacion(selectedCot);
      setShowConvertToSale(true);
      setSelectedCot(null);
      return;
    }

    try {
      // Update cotización
      const { error: updateError } = await supabase
        .from("cotizaciones")
        .update({
          pipeline_stage: newStage,
          last_stage_change_by: user.id,
          last_stage_change_at: new Date().toISOString(),
        })
        .eq("id", selectedCot.id);

      if (updateError) throw updateError;

      // Log history
      await supabase.from("cotizacion_stage_history").insert({
        cotizacion_id: selectedCot.id,
        from_stage: currentStage,
        to_stage: newStage,
        changed_by: user.id,
        notes: `Movido de ${STAGES[currentStage].label} a ${STAGES[newStage].label}`,
      });

      fetchCotizaciones();
      setShowConfirmModal(false);
      setSelectedCot(null);
    } catch (error) {
      console.error("Error moving cotización:", error);
      alert("Error al mover cotización: " + error.message);
    }
  }

  // If viewing a cotización, show details instead of pipeline
  if (viewingCotizacionId) {
    return (
      <DetallesCotizacion
        cotizacionId={viewingCotizacionId}
        onBack={() => {
          setViewingCotizacionId(null);
          fetchCotizaciones();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando pipeline...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Pipeline de Ventas</h1>
        <button
          onClick={onNewQuote}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus size={20} />
          Nueva Cotización
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stageKey) => {
          const stage = STAGES[stageKey];
          const stageCotizaciones = cotizaciones.filter(
            (c) => c.pipeline_stage === stageKey
          );

          return (
            <div key={stageKey} className="flex-shrink-0 w-80">
              <div className={`rounded-lg border-2 ${stage.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">{stage.label}</h2>
                  <span className="px-2 py-1 bg-white rounded-full text-sm font-medium">
                    {stageCotizaciones.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageCotizaciones.map((cot) => (
                    <div
                      key={cot.id}
                      className="bg-white rounded-lg shadow p-4 border-2 border-gray-200 hover:border-primary transition-colors"
                    >
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-gray-500">
                            {cot.folio}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              cot.probability >= 70
                                ? "bg-green-100 text-green-700"
                                : cot.probability >= 40
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {cot.probability}%
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">
                          {cot.cliente_nombre}
                        </h3>
                        <p className="text-sm text-gray-600">{cot.destino}</p>
                        {cot.presupuesto_aprox && (
                          <p className="text-sm font-semibold text-primary mt-1">
                            $
                            {parseFloat(cot.presupuesto_aprox).toLocaleString(
                              "es-MX"
                            )}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setViewingCotizacionId(cot.id)}
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                        >
                          <Eye size={14} />
                          Ver
                        </button>

                        {/* Movement Buttons */}
                        <div className="flex gap-2">
                          {canMoveBack(stageKey) && (
                            <button
                              onClick={() => promptMoveBack(cot)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              <ChevronLeft size={14} />
                              Volver
                            </button>
                          )}
                          {canMoveForward(stageKey) && (
                            <button
                              onClick={() => promptMoveForward(cot)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Mover
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageCotizaciones.length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-sm">
                      No hay cotizaciones
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmar Movimiento
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Mover <strong>{selectedCot.folio}</strong> -{" "}
              <strong>{selectedCot.cliente_nombre}</strong> de{" "}
              <strong>{STAGES[selectedCot.pipeline_stage].label}</strong> a{" "}
              <strong>
                {
                  STAGES[
                    moveDirection === "forward"
                      ? getNextStage(selectedCot.pipeline_stage)
                      : getPrevStage(selectedCot.pipeline_stage)
                  ].label
                }
              </strong>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedCot(null);
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmMove}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Sale Modal */}
      {showConvertToSale && convertingCotizacion && (
        <ConvertToSale
          cotizacion={convertingCotizacion}
          opciones={convertOpciones}
          operadores={convertOperadores}
          onClose={() => {
            setShowConvertToSale(false);
            setConvertingCotizacion(null);
            setConvertOpciones([]);
            setConvertOperadores([]);
          }}
          onSuccess={() => {
            setShowConvertToSale(false);
            setConvertingCotizacion(null);
            setConvertOpciones([]);
            setConvertOperadores([]);
            fetchCotizaciones();
          }}
        />
      )}
    </div>
  );
}
