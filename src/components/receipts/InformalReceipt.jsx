import { getReceiptLogo } from "../../lib/logoConstants";

export default function InformalReceipt({ data }) {
  const logoSrc = getReceiptLogo();

  const formatDate = (dateStr) => {
    if (!dateStr) return { day: "", month: "", year: "" };
    // Handle dates by extracting just the date part and adding T00:00:00 to avoid timezone issues
    const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const date = new Date(dateOnly + "T00:00:00");
    const day = date.getDate();
    const month = date
      .toLocaleDateString("es-MX", { month: "short" })
      .replace(".", "")
      .toUpperCase();
    const year = date.getFullYear();
    return { day, month, year };
  };

  const paymentDate = formatDate(data.payment_date);

  return (
    <div
      style={{
        width: "1080px",
        minHeight: "1750px",
        backgroundColor: "#4A9FBD",
        padding: "60px 50px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* White content box */}
      <div
        style={{
          backgroundColor: "white",
          padding: "60px 70px",
          borderRadius: "0px",
          minHeight: "1400px",
        }}
      >
        {/* Header with logo and date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "50px",
          }}
        >
          {/* Logo */}
          <div style={{ flex: "0 0 auto" }}>
            <img
              src={logoSrc}
              alt="Emociones Viajes"
              style={{
                height: "200px",
                width: "auto",
                display: "block",
              }}
            />
          </div>

          {/* Date calendar */}
          <div
            style={{
              backgroundColor: "#4A9FBD",
              borderRadius: "12px",
              overflow: "hidden",
              minWidth: "220px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                backgroundColor: "#4A9FBD",
                padding: "20px 24px",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "white",
                  textTransform: "uppercase",
                }}
              >
                {paymentDate.month}
              </div>
            </div>
            <div
              style={{
                backgroundColor: "white",
                padding: "0px 20px 30px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "100px",
                  fontWeight: "700",
                  color: "#1a1a1a",
                  lineHeight: "1",
                  marginBottom: "8px",
                }}
              >
                {paymentDate.day}
              </div>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "400",
                  color: "#666",
                }}
              >
                {paymentDate.year}
              </div>
            </div>
          </div>
        </div>

        {/* RECIBO title */}
        <h1
          style={{
            fontSize: "96px",
            fontWeight: "700",
            color: "#1a1a1a",
            textAlign: "center",
            margin: "40px 0 60px 0",
            letterSpacing: "4px",
          }}
        >
          RECIBO
        </h1>

        {/* Amount box */}
        <div
          style={{
            backgroundColor: "#FDB913",
            padding: "20px 40px",
            textAlign: "center",
            marginBottom: "50px",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "36px",
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            BUENO POR: $
            {parseFloat(data.amount).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Custom text description */}
        <div
          style={{
            fontSize: "34px",
            lineHeight: "1.7",
            color: "#1a1a1a",
            marginBottom: "60px",
            textAlign: "left",
          }}
        >
          {data.custom_text}
        </div>
      </div>

      {/* Financial Summary Box - Outside white box, in blue area */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          padding: "50px 60px",
          marginTop: "40px",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: "36px", fontWeight: "600", color: "#1a1a1a" }}
          >
            Precio:
          </span>
          <span
            style={{ fontSize: "40px", fontWeight: "700", color: "#1a1a1a" }}
          >
            ${parseFloat(data.total_price || 0).toLocaleString("es-MX")}
          </span>
        </div>
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: "36px", fontWeight: "600", color: "#1a1a1a" }}
          >
            Pago:
          </span>
          <span
            style={{ fontSize: "40px", fontWeight: "700", color: "#1a1a1a" }}
          >
            ${parseFloat(data.amount).toLocaleString("es-MX")}
          </span>
        </div>
        {data.balance > 0 && (
          <div
            style={{
              paddingTop: "24px",
              borderTop: "3px solid rgba(0,0,0,0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "40px", fontWeight: "700", color: "#1a1a1a" }}
            >
              Saldo:
            </span>
            <span
              style={{ fontSize: "44px", fontWeight: "700", color: "#1a1a1a" }}
            >
              ${parseFloat(data.balance).toLocaleString("es-MX")}
            </span>
          </div>
        )}
      </div>

      {/* Signature - In white box at bottom */}
      <div
        style={{
          backgroundColor: "white",
          padding: "60px 80px",
          marginTop: "40px",
          borderRadius: "0px",
          textAlign: "center",
        }}
      >
        {/* Signature line with decorative wave */}
        <div
          style={{
            margin: "0 auto",
            width: "600px",
            paddingBottom: "5px",
            borderBottom: "3px solid #1a1a1a",
            marginBottom: "25px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <img
            src="/firma-maribel-ornelas.png"
            alt="Firma"
            style={{
              display: "block",
              height: "360px",
              width: "auto",
              marginBottom: "0px",
            }}
          />
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#1a1a1a",
            fontWeight: "500",
          }}
        >
          Maribel Ornelas Ramos
        </div>
      </div>
    </div>
  );
}
