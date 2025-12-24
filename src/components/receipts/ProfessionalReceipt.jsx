import { getReceiptLogo } from "../../lib/logoConstants";

export default function ProfessionalReceipt({ data }) {
  const logoSrc = getReceiptLogo();

  return (
    <div
      style={{
        width: "800px",
        minHeight: "auto",
        background: "#ffffff",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "3px solid #3b82f6",
          paddingBottom: "20px",
          marginBottom: "30px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            color: "#3b82f6",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          Gracias por su pago
        </div>
      </div>

      {/* Check Icon */}
      <div
        style={{
          width: "120px",
          height: "120px",
          background: "#22c55e",
          borderRadius: "50%",
          margin: "0 auto 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="70"
          height="70"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Client & Amount */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div
          style={{
            fontSize: "24px",
            color: "#64748b",
            marginBottom: "10px",
          }}
        >
          {data.client_name}
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#1e293b",
          }}
        >
          $
          {data.amount.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>

      {/* Details Table */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "20px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "18px", color: "#64748b" }}>
            Folio de pago
          </span>
          <span
            style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b" }}
          >
            {data.receipt_number}
          </span>
        </div>
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "18px", color: "#64748b" }}>
            Forma de pago
          </span>
          <span
            style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b" }}
          >
            {data.payment_method}
          </span>
        </div>
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "18px", color: "#64748b" }}>Fecha</span>
          <span
            style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b" }}
          >
            {new Date(data.payment_date).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "18px", color: "#64748b" }}>Referencia</span>
          <span
            style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b" }}
          >
            {data.folio_venta}
          </span>
        </div>

        {/* Custom Line Items */}
        {data.line_items &&
          data.line_items.length > 0 &&
          data.line_items.map(
            (item, index) =>
              item.label && (
                <div
                  key={index}
                  style={{
                    padding: "15px 20px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "18px", color: "#64748b" }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1e293b",
                    }}
                  >
                    $
                    {parseFloat(item.amount || 0).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )
          )}

        {data.show_comision && (
          <div
            style={{
              padding: "15px 20px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "18px", color: "#64748b" }}>
              Comisión:
            </span>
            <span
              style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b" }}
            >
              $
              {parseFloat(data.comision || 0).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}

        <div
          style={{
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "18px", color: "#64748b" }}>Total:</span>
          <span
            style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}
          >
            $
            {data.amount.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Balance - Yellow */}
      {data.balance > 0 && (
        <div
          style={{
            background: "#fef08a",
            borderRadius: "8px",
            padding: "15px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{ fontSize: "18px", fontWeight: "600", color: "#854d0e" }}
          >
            Saldo:
          </span>
          <span
            style={{ fontSize: "22px", fontWeight: "bold", color: "#854d0e" }}
          >
            $
            {data.balance.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      {/* Payment Deadline - Only show if there's still a balance */}
      {data.show_fechas && data.balance > 0 && (
        <div
          style={{
            background: "#fef3c7",
            borderRadius: "8px",
            padding: "15px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "18px", color: "#92400e" }}>
            Fecha límite de pago:
          </span>
          <span
            style={{ fontSize: "18px", fontWeight: "600", color: "#92400e" }}
          >
            {data.fecha_limite_pago
              ? new Date(data.fecha_limite_pago).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Por definir"}
          </span>
        </div>
      )}

      {/* Reservation Info */}
      {data.show_reserva_info && (
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#64748b",
              marginBottom: "15px",
            }}
          >
            Información de Reserva
          </div>
          <div style={{ marginBottom: "10px" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>
              N. de Reserva:{" "}
            </span>
            <span
              style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}
            >
              {data.folio_venta}
            </span>
          </div>
          {data.fecha_viaje && (
            <div style={{ marginBottom: "10px" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>
                Fecha de viaje:{" "}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                {new Date(data.fecha_viaje).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          {data.destino && (
            <div>
              <span style={{ fontSize: "14px", color: "#64748b" }}>
                Destino:{" "}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                {data.destino}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer with Logo */}
      <div
        style={{
          borderTop: "2px solid #e2e8f0",
          paddingTop: "20px",
          marginTop: "30px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "8px",
          }}
        >
          Dudas o aclaraciones
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "5px",
          }}
        >
          Contacto: emocionesviajes@gmail.com
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "5px",
          }}
        >
          Teléfono: +52 614 397 2021
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "15px",
          }}
        >
          Dirección: Chihuahua, Chihuahua, México
        </div>

        {/* Logo */}
        <div style={{ marginTop: "20px" }}>
          <img
            src={logoSrc}
            alt="Emociones Viajes"
            style={{
              height: "60px",
              width: "auto",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>
      </div>
    </div>
  );
}
