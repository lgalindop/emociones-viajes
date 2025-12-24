import React from "react";
import { getReceiptLogo } from "../../lib/logoConstants.js";

export default function WhatsAppExportTemplate({
  cotizacion,
  opciones,
  operadores,
}) {
  const logoSrc = getReceiptLogo();

  function getOperadorNombre(operadorId) {
    const op = operadores.find((o) => o.id === operadorId);
    return op?.nombre || "Operador";
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div
      id="whatsapp-export-template"
      style={{
        width: "1080px",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
        color: "#333",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          borderBottom: "3px solid #FF6B35",
          paddingBottom: "20px",
        }}
      >
        <img
          src={logoSrc}
          alt="Emociones Viajes"
          style={{
            maxWidth: "300px",
            height: "auto",
            marginBottom: "15px",
          }}
        />
        <h1
          style={{
            fontSize: "36px",
            color: "#FF6B35",
            margin: "10px 0",
            fontWeight: "bold",
          }}
        >
          Propuesta de Viaje
        </h1>
      </div>

      {/* Cliente Info */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Cliente:</strong>{" "}
          {cotizacion.cliente}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Destino:</strong>{" "}
          {cotizacion.destino}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Fecha de Viaje:</strong>{" "}
          {formatDate(cotizacion.fecha_viaje)}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Duración:</strong>{" "}
          {cotizacion.duracion_dias} días / {cotizacion.duracion_noches} noches
        </div>
        <div>
          <strong style={{ color: "#FF6B35" }}>Pasajeros:</strong>{" "}
          {cotizacion.num_personas}
        </div>
      </div>

      {/* Opciones de Paquete */}
      <div style={{ marginBottom: "30px" }}>
        <h2
          style={{
            fontSize: "28px",
            color: "#FF6B35",
            marginBottom: "20px",
            borderBottom: "2px solid #FF6B35",
            paddingBottom: "10px",
          }}
        >
          Opciones de Paquete
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {opciones.map((opcion, idx) => (
            <div
              key={opcion.id}
              style={{
                border: "2px solid #FF6B35",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "#fff",
              }}
            >
              <h3
                style={{
                  fontSize: "24px",
                  color: "#FF6B35",
                  marginBottom: "15px",
                  fontWeight: "bold",
                }}
              >
                Opción {idx + 1}
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  {getOperadorNombre(opcion.operador_id)}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "5px",
                  }}
                >
                  {opcion.num_personas} {opcion.tipo_habitacion}
                </div>
              </div>

              {/* Vuelos */}
              {opcion.vuelo_ida_fecha && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#FF6B35",
                    }}
                  >
                    ✈️ Vuelos
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    <div>
                      <strong>Ida:</strong> {formatDate(opcion.vuelo_ida_fecha)}{" "}
                      - {opcion.vuelo_ida_salida || "N/A"}
                    </div>
                    <div>
                      <strong>Regreso:</strong>{" "}
                      {formatDate(opcion.vuelo_regreso_fecha)} -{" "}
                      {opcion.vuelo_regreso_salida || "N/A"}
                    </div>
                  </div>
                </div>
              )}

              {/* Hotel */}
              {opcion.hotel && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#FF6B35",
                    }}
                  >
                    🏨 Hotel
                  </div>
                  <div style={{ fontSize: "14px" }}>{opcion.hotel}</div>
                  {opcion.regimen_alimenticio && (
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {opcion.regimen_alimenticio}
                    </div>
                  )}
                </div>
              )}

              {/* Traslados */}
              {opcion.traslados && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#FF6B35",
                    }}
                  >
                    🚗 Traslados
                  </div>
                  <div style={{ fontSize: "14px" }}>{opcion.traslados}</div>
                </div>
              )}

              {/* Tours */}
              {opcion.tours && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#FF6B35",
                    }}
                  >
                    🎯 Tours
                  </div>
                  <div style={{ fontSize: "14px" }}>{opcion.tours}</div>
                </div>
              )}

              {/* Extras */}
              {opcion.extras && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#FF6B35",
                    }}
                  >
                    ⭐ Extras
                  </div>
                  <div style={{ fontSize: "14px" }}>{opcion.extras}</div>
                </div>
              )}

              {/* Precio */}
              <div
                style={{
                  marginTop: "15px",
                  paddingTop: "15px",
                  borderTop: "2px solid #FF6B35",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#FF6B35",
                  }}
                >
                  ${opcion.precio_total?.toLocaleString("es-MX") || "0"} MXN
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  {opcion.tipo_tarifa}
                </div>
              </div>

              {/* Notas */}
              {opcion.notas && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#fff9e6",
                    borderRadius: "5px",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  <strong>Notas:</strong> {opcion.notas}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Contact */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#FF6B35",
          color: "#fff",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "24px", marginBottom: "10px" }}>
          ¡Gracias por tu confianza!
        </h3>
        <div style={{ fontSize: "16px", marginBottom: "5px" }}>
          📞 +52 614 397 2021
        </div>
        <div style={{ fontSize: "16px", marginBottom: "5px" }}>
          📧 emocionesviajes@gmail.com
        </div>
        <div style={{ fontSize: "16px" }}>💬 WhatsApp: +52 614 397 2021</div>
      </div>
    </div>
  );
}
