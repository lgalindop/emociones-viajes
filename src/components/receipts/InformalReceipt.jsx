export default function InformalReceipt({ data }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return { day, month, year };
  };

  const paymentDate = formatDate(data.payment_date);

  return (
    <div style={{
      width: '1080px',
      height: '1920px',
      background: 'linear-gradient(to bottom right, #f0f9ff 0%, #ffffff 50%, #f0f9ff 100%)',
      padding: '80px 60px',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100px',
        height: '100%',
        background: 'linear-gradient(180deg, #6eb6d4 0%, #4a9bbc 100%)'
      }} />
      
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '150px',
        height: '100%',
        background: 'linear-gradient(180deg, #6eb6d4 0%, #4a9bbc 100%)'
      }} />

      {/* Header with Logo */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '60px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          {/* Logo placeholder - using gradient circle */}
          <div style={{
            width: '180px',
            height: '180px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '6px solid white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M60 30 L75 60 L60 90 L45 60 Z" fill="white" opacity="0.3"/>
              <circle cx="60" cy="60" r="25" stroke="white" strokeWidth="4" fill="none"/>
              <path d="M35 60 Q60 40, 85 60" stroke="white" strokeWidth="3" fill="none"/>
            </svg>
          </div>
        </div>
        
        <div style={{
          fontSize: '52px',
          color: '#5eb6d4',
          fontWeight: '300',
          letterSpacing: '3px',
          fontStyle: 'italic',
          marginBottom: '8px'
        }}>
          emociones
        </div>
        <div style={{
          fontSize: '36px',
          color: '#1e40af',
          fontWeight: 'bold',
          letterSpacing: '4px'
        }}>
          viajes
        </div>
        <div style={{
          fontSize: '20px',
          color: '#64748b',
          marginTop: '12px',
          letterSpacing: '2px'
        }}>
          by FRAVEO
        </div>

        <h1 style={{
          fontSize: '96px',
          fontWeight: 'bold',
          color: '#1e293b',
          margin: '40px 0 0 0',
          letterSpacing: '2px'
        }}>
          RECIBO
        </h1>
      </div>

      {/* Date Calendar */}
      <div style={{
        position: 'absolute',
        top: '80px',
        right: '200px',
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '3px solid #e2e8f0'
      }}>
        <div style={{
          background: '#6eb6d4',
          color: 'white',
          padding: '16px 40px',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {paymentDate.month}
        </div>
        <div style={{
          padding: '30px 40px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '96px',
            fontWeight: 'bold',
            color: '#1e293b',
            lineHeight: '1'
          }}>
            {paymentDate.day}
          </div>
          <div style={{
            fontSize: '48px',
            color: '#64748b',
            marginTop: '8px'
          }}>
            {paymentDate.year}
          </div>
        </div>
      </div>

      {/* Amount Badge */}
      <div style={{
        background: '#fbbf24',
        color: '#1e293b',
        padding: '24px 60px',
        fontSize: '42px',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '0 auto 60px',
        maxWidth: '700px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(251, 191, 36, 0.4)'
      }}>
        BUENO POR: ${data.amount.toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '36px',
        lineHeight: '1.8',
        color: '#1e293b',
        textAlign: 'justify',
        marginBottom: '80px',
        padding: '0 40px',
        position: 'relative',
        zIndex: 1
      }}>
        {data.custom_text}
      </div>

      {/* Financial Summary Box */}
      <div style={{
        background: 'linear-gradient(135deg, #6eb6d4 0%, #4a9bbc 100%)',
        color: '#1e293b',
        padding: '50px',
        borderRadius: '20px',
        marginBottom: '80px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '38px', fontWeight: '600' }}>Precio:</span>
          <span style={{ fontSize: '48px', fontWeight: 'bold' }}>
            ${data.total_price.toLocaleString('es-MX')}
          </span>
        </div>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '38px', fontWeight: '600' }}>Anticipo:</span>
          <span style={{ fontSize: '48px', fontWeight: 'bold' }}>
            ${data.previous_payments.toLocaleString('es-MX')}
          </span>
        </div>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '38px', fontWeight: '600' }}>Pago:</span>
          <span style={{ fontSize: '48px', fontWeight: 'bold' }}>
            ${data.amount.toLocaleString('es-MX')}
          </span>
        </div>
        <div style={{ 
          paddingTop: '30px', 
          borderTop: '4px solid rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '42px', fontWeight: 'bold' }}>Saldo:</span>
          <span style={{ fontSize: '52px', fontWeight: 'bold' }}>
            ${data.balance.toLocaleString('es-MX')}
          </span>
        </div>
      </div>

      {/* Signature */}
      <div style={{
        textAlign: 'center',
        marginTop: '80px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Signature image placeholder */}
        <div style={{
          margin: '0 auto',
          width: '400px',
          height: '120px',
          borderBottom: '3px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <svg width="300" height="80" viewBox="0 0 300 80" fill="none">
            <path 
              d="M 20 40 Q 40 10, 60 40 T 100 40 Q 120 10, 140 40 T 180 40 Q 200 60, 220 40 T 260 40 L 280 35" 
              stroke="#1e293b" 
              strokeWidth="3" 
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{
          fontSize: '34px',
          color: '#1e293b',
          fontWeight: '500'
        }}>
          Maribel Ornelas Ramos
        </div>
      </div>
    </div>
  );
}
