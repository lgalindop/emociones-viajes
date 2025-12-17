export default function ProfessionalReceipt({ data }) {
  return (
    <div
      style={{
        width: "1080px",
        height: "1527px", // A4 aspect ratio (210x297mm at 150dpi)
        background: "#ffffff",
        padding: "60px",
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          borderBottom: "4px solid #3b82f6",
          paddingBottom: "30px",
          marginBottom: "40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "42px",
            color: "#3b82f6",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Gracias por su pago
        </div>
      </div>

      {/* Green Check Circle */}
      <div
        style={{
          width: "180px",
          height: "180px",
          background: "#22c55e",
          borderRadius: "50%",
          margin: "0 auto 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)",
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Client Name and Amount */}
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <div
          style={{
            fontSize: "32px",
            color: "#64748b",
            marginBottom: "12px",
          }}
        >
          {data.client_name}
        </div>
        <div
          style={{
            fontSize: "72px",
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

      {/* Payment Details Table */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "40px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            padding: "20px 30px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "28px", color: "#64748b" }}>
            Folio de pago
          </span>
          <span
            style={{ fontSize: "28px", fontWeight: "600", color: "#1e293b" }}
          >
            {data.receipt_number}
          </span>
        </div>
        <div
          style={{
            padding: "20px 30px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "28px", color: "#64748b" }}>
            Forma de pago
          </span>
          <span
            style={{ fontSize: "28px", fontWeight: "600", color: "#1e293b" }}
          >
            {data.payment_method}
          </span>
        </div>
        <div
          style={{
            padding: "20px 30px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "28px", color: "#64748b" }}>Fecha</span>
          <span
            style={{ fontSize: "28px", fontWeight: "600", color: "#1e293b" }}
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
            padding: "20px 30px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "28px", color: "#64748b" }}>Referencia</span>
          <span
            style={{ fontSize: "28px", fontWeight: "600", color: "#1e293b" }}
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
                    padding: "20px 30px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "28px", color: "#64748b" }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "28px",
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
              padding: "20px 30px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "28px", color: "#64748b" }}>
              Comisión:
            </span>
            <span
              style={{ fontSize: "28px", fontWeight: "600", color: "#1e293b" }}
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
            padding: "20px 30px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "28px", color: "#64748b" }}>Total:</span>
          <span
            style={{ fontSize: "28px", fontWeight: "bold", color: "#1e293b" }}
          >
            $
            {data.amount.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Balance Info - Yellow Highlight */}
      <div
        style={{
          background: "#fef08a",
          borderRadius: "12px",
          padding: "20px 30px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "28px", fontWeight: "600", color: "#854d0e" }}>
          Saldo:
        </span>
        <span
          style={{ fontSize: "32px", fontWeight: "bold", color: "#854d0e" }}
        >
          $
          {data.balance.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      <div
        style={{
          background: "#fef08a",
          borderRadius: "12px",
          padding: "20px 30px",
          marginBottom: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "26px", color: "#854d0e" }}>
          Fecha Próximo Abono
        </span>
        <span style={{ fontSize: "26px", fontWeight: "600", color: "#854d0e" }}>
          {/* Calculate next payment date estimate */}
          {new Date(
            new Date(data.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      <div
        style={{
          background: "#fef08a",
          borderRadius: "12px",
          padding: "20px 30px",
          marginBottom: "50px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "26px", color: "#854d0e" }}>
          Fecha Límite de Pago
        </span>
        <span style={{ fontSize: "26px", fontWeight: "600", color: "#854d0e" }}>
          {data.fecha_viaje
            ? new Date(
                new Date(data.fecha_viaje).getTime() - 7 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-"}
        </span>
      </div>

      {/* Reservation Info */}
      <div
        style={{
          borderTop: "2px solid #e2e8f0",
          paddingTop: "30px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "#1e293b",
            marginBottom: "20px",
          }}
        >
          Información importante de la reservación
        </div>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              padding: "18px 30px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "26px", color: "#64748b" }}>
              No folio reserva
            </span>
            <span
              style={{ fontSize: "26px", fontWeight: "600", color: "#1e293b" }}
            >
              {data.folio_venta}
            </span>
          </div>
          <div
            style={{
              padding: "18px 30px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "26px", color: "#64748b" }}>
              Fecha y hora
            </span>
            <span
              style={{ fontSize: "26px", fontWeight: "600", color: "#1e293b" }}
            >
              {new Date().toLocaleString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
          <div
            style={{
              padding: "18px 30px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "26px", color: "#64748b" }}>
              Total reserva
            </span>
            <span
              style={{ fontSize: "26px", fontWeight: "600", color: "#1e293b" }}
            >
              $
              {data.total_price.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "2px solid #e2e8f0",
          paddingTop: "30px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#1e293b",
            marginBottom: "12px",
          }}
        >
          Dudas o aclaraciones
        </div>
        <div
          style={{ fontSize: "22px", color: "#64748b", marginBottom: "8px" }}
        >
          Correo electrónico: emocionesviajes@gmail.com
        </div>
        <div
          style={{ fontSize: "22px", color: "#64748b", marginBottom: "8px" }}
        >
          Teléfono: +52 614 397 2021
        </div>
        <div
          style={{ fontSize: "22px", color: "#64748b", marginBottom: "30px" }}
        >
          Dirección: Huerto los duraznos #444, Los Huertos
        </div>

        {/* Logo at bottom */}
        <div style={{ marginTop: "30px" }}>
          <div
            style={{
              display: "inline-block",
              width: "120px",
              height: "120px",
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="80" height="80" viewBox="0 0 120 120" fill="none">
              <path
                d="M60 30 L75 60 L60 90 L45 60 Z"
                fill="white"
                opacity="0.3"
              />
              <circle
                cx="60"
                cy="60"
                r="25"
                stroke="white"
                strokeWidth="4"
                fill="none"
              />
              <path
                d="M35 60 Q60 40, 85 60"
                stroke="white"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#5eb6d4",
              fontStyle: "italic",
              marginTop: "12px",
            }}
          >
            emociones
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#1e40af",
              fontWeight: "bold",
            }}
          >
            viajes
          </div>
        </div>
      </div>
    </div>
  );
}
