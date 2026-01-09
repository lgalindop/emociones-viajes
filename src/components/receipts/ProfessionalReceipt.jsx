import { getReceiptLogo } from "../../lib/logoConstants";
import { formatDateShort, formatDateLong } from "../../utils/dateUtils";

export default function ProfessionalReceipt({ data, companyInfo }) {
  const logoSrc = getReceiptLogo();

  // Use passed company info or fallback to defaults
  const company = companyInfo || {
    email: "emocionesviajes@gmail.com",
    phone: "+52 614 397 2021",
    address: "Chihuahua, Chihuahua, México",
  };

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

      {/* Check Icon - Using CSS checkmark for html2canvas compatibility */}
      <div
        style={{
          width: "120px",
          height: "120px",
          margin: "0 auto 30px",
          background: "#22c55e",
          borderRadius: "50%",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "50px",
            height: "25px",
            borderLeft: "8px solid white",
            borderBottom: "8px solid white",
            transform: "translate(-50%, -60%) rotate(-45deg)",
          }}
        />
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
      <table
        style={{
          width: "100%",
          background: "#f8fafc",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "20px",
          border: "1px solid #e2e8f0",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "15px 20px", fontSize: "18px", color: "#64748b" }}>
              Folio de pago
            </td>
            <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#1e293b", textAlign: "right" }}>
              {data.receipt_number}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "15px 20px", fontSize: "18px", color: "#64748b" }}>
              Forma de pago
            </td>
            <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#1e293b", textAlign: "right" }}>
              {data.payment_method}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "15px 20px", fontSize: "18px", color: "#64748b" }}>
              Fecha
            </td>
            <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#1e293b", textAlign: "right" }}>
              {formatDateShort(data.payment_date)}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "15px 20px", fontSize: "18px", color: "#64748b" }}>
              Referencia
            </td>
            <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#1e293b", textAlign: "right" }}>
              {data.folio_venta}
            </td>
          </tr>

          {/* Custom Line Items */}
          {data.line_items &&
            data.line_items.length > 0 &&
            data.line_items.map(
              (item, index) =>
                item.label && (
                  <tr key={index} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "15px 20px", fontSize: "18px", color: "#64748b" }}>
                      {item.label}
                    </td>
                    <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#1e293b", textAlign: "right" }}>
                      $
                      {parseFloat(item.amount || 0).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                )
            )}

          {data.show_comision && (
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "15px 20px", fontSize: "18px", color: "#64748b" }}>
                Comisión:
              </td>
              <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#1e293b", textAlign: "right" }}>
                $
                {parseFloat(data.comision || 0).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          )}

          <tr>
            <td style={{ padding: "15px 20px", fontSize: "18px", color: "#64748b" }}>
              Total:
            </td>
            <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "bold", color: "#1e293b", textAlign: "right" }}>
              $
              {data.amount.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Balance - Yellow */}
      {data.balance > 0 && (
        <table
          style={{
            width: "100%",
            background: "#fef08a",
            borderRadius: "8px",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#854d0e" }}>
                Saldo:
              </td>
              <td style={{ padding: "15px 20px", fontSize: "22px", fontWeight: "bold", color: "#854d0e", textAlign: "right" }}>
                $
                {data.balance.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Payment Deadline - Always show if there's a balance and fecha_limite exists */}
      {data.balance > 0 && data.fecha_limite_pago && (
        <table
          style={{
            width: "100%",
            background: "#fef3c7",
            borderRadius: "8px",
            marginBottom: "20px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "15px 20px", fontSize: "18px", color: "#92400e" }}>
                Fecha límite de pago:
              </td>
              <td style={{ padding: "15px 20px", fontSize: "18px", fontWeight: "600", color: "#92400e", textAlign: "right" }}>
                {formatDateShort(data.fecha_limite_pago)}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Reservation Info - Always show if destino or fecha_viaje exists */}
      {(data.destino || data.fecha_viaje) && (
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
                {formatDateLong(data.fecha_viaje)}
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

      {/* Footer with Logo - USING COMPANY INFO */}
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
          Contacto: {company.email}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "5px",
          }}
        >
          Teléfono: {company.phone}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "15px",
          }}
        >
          Dirección: {company.address}
        </div>

        {/* Logo */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <img
            src={logoSrc}
            alt="Emociones Viajes"
            crossOrigin="anonymous"
            style={{
              height: "60px",
              width: "auto",
              display: "inline-block",
            }}
          />
        </div>
      </div>
    </div>
  );
}
