// pages/DetalleCotizacion.jsx
import React, { useRef } from "react";
import html2canvas from "html2canvas";
import { formatMoneyDisplay, parseMoneyToNumber } from "../lib/money";

export default function DetalleCotizacion({ cotizacion, onBack }) {
  const cardRef = useRef(null);
  const opciones = cotizacion.opciones_cotizacion || [];

  function formatDate(d) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  }

  async function exportAsImage() {
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${cotizacion.folio || "cotizacion"}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Error generando la imagen");
    }
  }

  const totalSum = opciones.reduce((acc, op) => {
    const p =
      op.precio_total !== undefined && op.precio_total !== null
        ? Number(op.precio_total)
        : (parseMoneyToNumber(op.precio_total_raw) ?? 0);
    return acc + (p || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          ← Volver
        </button>

        <div
          ref={cardRef}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div
            className="p-6 text-center"
            style={{ background: "linear-gradient(90deg,#60a5fa22,#7dd3fc22)" }}
          >
            <h1 className="text-2xl font-bold tracking-wider">
              EMOCIONES VIAJES
            </h1>
            <p className="text-sm text-gray-600 mt-1">Cotización profesional</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Cliente</h3>
                <p>{cotizacion.cliente_nombre}</p>
                {cotizacion.cliente_telefono && (
                  <p className="text-sm text-gray-600">
                    {cotizacion.cliente_telefono}
                  </p>
                )}
                {cotizacion.cliente_email && (
                  <p className="text-sm text-gray-600">
                    {cotizacion.cliente_email}
                  </p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Viaje</h3>
                <p>{cotizacion.destino}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(cotizacion.fecha_salida)} →{" "}
                  {formatDate(cotizacion.fecha_regreso)}
                </p>
                <p className="text-sm text-gray-600">
                  Adultos: {cotizacion.num_adultos} — Niños:{" "}
                  {cotizacion.num_ninos}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Divisa: {cotizacion.divisa || "MXN"}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Opciones</h3>
              {opciones.length === 0 && (
                <p className="text-sm text-gray-500">No hay opciones</p>
              )}

              {opciones.map((op) => (
                <div
                  key={op.id || op.temp_id}
                  className="mt-3 p-3 bg-gray-50 rounded"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium">{op.nombre_paquete}</p>
                      {op.operador_nombre && (
                        <p className="text-sm text-gray-600">
                          {op.operador_nombre}
                        </p>
                      )}
                      {op.incluye && op.incluye.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Incluye: {op.incluye.join(", ")}
                        </p>
                      )}
                      {op.no_incluye && op.no_incluye.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          No incluye: {op.no_incluye.join(", ")}
                        </p>
                      )}
                      {op.disponibilidad && (
                        <p className="text-sm text-gray-600 mt-1">
                          Disponibilidad: {op.disponibilidad}
                        </p>
                      )}
                      {op.link_paquete && (
                        <p className="text-sm mt-1">
                          <a
                            href={op.link_paquete}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-light hover:underline"
                          >
                            Ver paquete
                          </a>
                        </p>
                      )}
                      {op.notas && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          Notas: {op.notas}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {cotizacion.divisa || "MXN"}{" "}
                        {formatMoneyDisplay(
                          op.precio_total ??
                            parseMoneyToNumber(op.precio_total_raw) ??
                            0,
                          cotizacion.divisa
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 text-right">
                <p className="font-semibold">
                  Total aproximado: {cotizacion.divisa || "MXN"}{" "}
                  {formatMoneyDisplay(totalSum, cotizacion.divisa)}
                </p>
              </div>
            </div>

            {cotizacion.notas && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Notas</h3>
                <p className="text-sm text-gray-600">{cotizacion.notas}</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-100 text-center text-sm text-gray-600">
            Emociones Viajes • Cotización generada
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={exportAsImage}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Exportar imagen (WhatsApp)
          </button>
          <button
            onClick={onBack}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
