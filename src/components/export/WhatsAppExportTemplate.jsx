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
    if (!dateString) return "";
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
        <div style={{ fontSize: "18px", color: "#666", marginTop: "10px" }}>
          <strong>Folio:</strong> {cotizacion.folio}
        </div>
      </div>

      {/* Cotización Dates */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#E3F2FD",
          borderRadius: "8px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "15px",
        }}
      >
        {cotizacion.fecha_registro && (
          <div>
            <strong style={{ color: "#1976D2" }}>Fecha Registro:</strong>
            <div style={{ marginTop: "5px" }}>
              {formatDate(cotizacion.fecha_registro)}
            </div>
          </div>
        )}
        {cotizacion.fecha_reserva && (
          <div>
            <strong style={{ color: "#1976D2" }}>Fecha Reserva:</strong>
            <div style={{ marginTop: "5px" }}>
              {formatDate(cotizacion.fecha_reserva)}
            </div>
          </div>
        )}
        {cotizacion.vigente_hasta && (
          <div>
            <strong style={{ color: "#1976D2" }}>Vigente Hasta:</strong>
            <div style={{ marginTop: "5px" }}>
              {formatDate(cotizacion.vigente_hasta)}
            </div>
          </div>
        )}
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
        <h2
          style={{
            fontSize: "24px",
            color: "#FF6B35",
            marginBottom: "15px",
            borderBottom: "2px solid #FF6B35",
            paddingBottom: "8px",
          }}
        >
          Información del Cliente
        </h2>
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Cliente:</strong>{" "}
          {cotizacion.cliente_nombre}
        </div>
        {cotizacion.cliente_telefono && (
          <div style={{ marginBottom: "10px" }}>
            <strong style={{ color: "#FF6B35" }}>Teléfono:</strong>{" "}
            {cotizacion.cliente_telefono}
          </div>
        )}
        {cotizacion.cliente_email && (
          <div style={{ marginBottom: "10px" }}>
            <strong style={{ color: "#FF6B35" }}>Email:</strong>{" "}
            {cotizacion.cliente_email}
          </div>
        )}
      </div>

      {/* Viaje Info */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            color: "#FF6B35",
            marginBottom: "15px",
            borderBottom: "2px solid #FF6B35",
            paddingBottom: "8px",
          }}
        >
          Detalles del Viaje
        </h2>
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Destino:</strong>{" "}
          {cotizacion.destino}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Fechas de Viaje:</strong>{" "}
          {formatDate(cotizacion.fecha_salida)} -{" "}
          {formatDate(cotizacion.fecha_regreso)}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong style={{ color: "#FF6B35" }}>Viajeros:</strong>{" "}
          {cotizacion.num_adultos} adulto(s), {cotizacion.num_ninos} niño(s)
        </div>
        <div>
          <strong style={{ color: "#FF6B35" }}>Cotizado en:</strong>{" "}
          {cotizacion.divisa || "MXN"}
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
          Opciones de Paquetes
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
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

              {/* Package Name */}
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  color: "#333",
                }}
              >
                {opcion.nombre_paquete}
              </div>

              {/* Service Description */}
              {opcion.servicio_descripcion && (
                <div
                  style={{
                    marginBottom: "15px",
                    padding: "12px",
                    backgroundColor: "#FFF3E0",
                    borderRadius: "5px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  {opcion.servicio_descripcion}
                </div>
              )}

              {/* Operador */}
              <div
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "12px",
                  fontStyle: "italic",
                }}
              >
                Operador: {getOperadorNombre(opcion.operador_id)}
              </div>

              {/* Hotel */}
              {opcion.hotel_nombre && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#E3F2FD",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#1976D2",
                    }}
                  >
                    🏨 Hotel
                  </div>
                  <div style={{ fontSize: "14px" }}>{opcion.hotel_nombre}</div>
                  {opcion.ocupacion && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        marginTop: "3px",
                      }}
                    >
                      Ocupación: {opcion.ocupacion}
                    </div>
                  )}
                </div>
              )}

              {/* Vuelos */}
              {(opcion.vuelo_ida_fecha || opcion.vuelo_regreso_fecha) && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#E8F5E9",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "8px",
                      color: "#388E3C",
                    }}
                  >
                    ✈️ Vuelos
                  </div>
                  {opcion.vuelo_ida_fecha && (
                    <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                      <strong>Ida:</strong> {formatDate(opcion.vuelo_ida_fecha)}
                      {opcion.vuelo_ida_horario &&
                        ` • ${opcion.vuelo_ida_horario}`}
                      {opcion.vuelo_ida_ruta && ` • ${opcion.vuelo_ida_ruta}`}
                    </div>
                  )}
                  {opcion.vuelo_regreso_fecha && (
                    <div style={{ fontSize: "14px" }}>
                      <strong>Regreso:</strong>{" "}
                      {formatDate(opcion.vuelo_regreso_fecha)}
                      {opcion.vuelo_regreso_horario &&
                        ` • ${opcion.vuelo_regreso_horario}`}
                      {opcion.vuelo_regreso_ruta &&
                        ` • ${opcion.vuelo_regreso_ruta}`}
                    </div>
                  )}
                </div>
              )}

              {/* Incluye */}
              {opcion.incluye && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    backgroundColor: "#F1F8E9",
                    borderRadius: "5px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      color: "#558B2F",
                    }}
                  >
                    ✓ Incluye
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    {typeof opcion.incluye === "string"
                      ? opcion.incluye
                      : Array.isArray(opcion.incluye)
                        ? opcion.incluye.join(", ")
                        : ""}
                  </div>
                </div>
              )}

              {/* No Incluye */}
              {opcion.no_incluye &&
                Array.isArray(opcion.no_incluye) &&
                opcion.no_incluye.length > 0 && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px",
                      backgroundColor: "#FFEBEE",
                      borderRadius: "5px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#C62828",
                      }}
                    >
                      ✗ No incluye
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {opcion.no_incluye.join(", ")}
                    </div>
                  </div>
                )}

              {/* Disponibilidad */}
              {opcion.disponibilidad && (
                <div
                  style={{
                    marginBottom: "12px",
                    fontSize: "13px",
                    color: "#666",
                    fontStyle: "italic",
                  }}
                >
                  {opcion.disponibilidad}
                </div>
              )}

              {/* Links */}
              <div
                style={{
                  marginBottom: "15px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {opcion.link_paquete && (
                  <div style={{ fontSize: "12px", color: "#1976D2" }}>
                    🔗 Ver paquete
                  </div>
                )}
                {opcion.tour_link && (
                  <div style={{ fontSize: "12px", color: "#7B1FA2" }}>
                    🎯 Ver tours
                  </div>
                )}
              </div>

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
                  ${(opcion.precio_total || 0).toLocaleString("es-MX")}{" "}
                  {cotizacion.divisa}
                </div>
                {opcion.precio_por_persona > 0 && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginTop: "5px",
                    }}
                  >
                    ${(opcion.precio_por_persona || 0).toLocaleString("es-MX")}{" "}
                    por persona
                  </div>
                )}
              </div>

              {/* Notas */}
              {opcion.notas && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#FFF9C4",
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

      {/* Important Notes / Disclaimers */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#FFEBEE",
          borderRadius: "8px",
          borderLeft: "4px solid #D32F2F",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#D32F2F",
            marginBottom: "10px",
          }}
        >
          IMPORTANTE
        </div>
        <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
          • POR PROXIMIDAD SE PAGA AL RESERVAR
        </div>
        <div style={{ fontSize: "13px", color: "#666" }}>
          • TARIFAS SUJETAS A DISPONIBILIDAD Y CAMBIOS SIN PREVIO AVISO. ESTO ES
          UNA COTIZACIÓN Y NO CONSTITUYE UNA RESERVA.
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
