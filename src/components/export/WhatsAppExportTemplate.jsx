import React from 'react'

export default function WhatsAppExportTemplate({ cotizacion, opciones, operadores }) {
  function getOperadorNombre(operadorId) {
    const op = operadores.find(o => o.id === operadorId)
    return op?.nombre || 'Operador'
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div 
      id="whatsapp-export-template" 
      style={{
        width: '1080px',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '40px',
        boxSizing: 'border-box'
      }}
    >
      {/* Header with Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '4px solid #1e3a5f', paddingBottom: '20px' }}>
        <div style={{ 
          width: '200px', 
          height: '80px', 
          margin: '0 auto 20px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px'
        }}>
          <span style={{ color: '#1e3a5f', fontSize: '24px', fontWeight: 'bold' }}>EMOCIONES</span>
        </div>
        <h1 style={{ color: '#1e3a5f', fontSize: '32px', margin: '0', fontWeight: '700' }}>
          Propuesta de Viaje
        </h1>
        <p style={{ color: '#5eb3d4', fontSize: '18px', margin: '8px 0 0', fontWeight: '500' }}>
          {cotizacion.folio}
        </p>
      </div>

      {/* Client & Travel Info */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '12px', 
        marginBottom: '40px',
        border: '2px solid #e9ecef'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div>
            <h3 style={{ color: '#1e3a5f', fontSize: '18px', marginBottom: '15px', fontWeight: '600' }}>
              📋 Cliente
            </h3>
            <p style={{ margin: '8px 0', fontSize: '16px', color: '#333' }}>
              <strong>Nombre:</strong> {cotizacion.cliente_nombre}
            </p>
            {cotizacion.cliente_telefono && (
              <p style={{ margin: '8px 0', fontSize: '16px', color: '#333' }}>
                <strong>Teléfono:</strong> {cotizacion.cliente_telefono}
              </p>
            )}
          </div>
          
          <div>
            <h3 style={{ color: '#1e3a5f', fontSize: '18px', marginBottom: '15px', fontWeight: '600' }}>
              ✈️ Detalles del Viaje
            </h3>
            <p style={{ margin: '8px 0', fontSize: '16px', color: '#333' }}>
              <strong>Destino:</strong> {cotizacion.destino}
            </p>
            <p style={{ margin: '8px 0', fontSize: '16px', color: '#333' }}>
              <strong>Fechas:</strong> {formatDate(cotizacion.fecha_salida)} - {formatDate(cotizacion.fecha_regreso)}
            </p>
            <p style={{ margin: '8px 0', fontSize: '16px', color: '#333' }}>
              <strong>Viajeros:</strong> {cotizacion.num_adultos} adulto(s), {cotizacion.num_ninos} niño(s)
            </p>
          </div>
        </div>
      </div>

      {/* Package Options */}
      <h2 style={{ color: '#1e3a5f', fontSize: '28px', marginBottom: '30px', fontWeight: '700', textAlign: 'center' }}>
        Opciones de Paquetes
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: opciones.length <= 2 ? '1fr 1fr' : '1fr 1fr', gap: '30px' }}>
        {opciones.map((opcion, idx) => (
          <div 
            key={opcion.id || idx}
            style={{
              border: '3px solid #1e3a5f',
              borderRadius: '12px',
              padding: '25px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '20px',
              backgroundColor: '#5eb3d4',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              OPCIÓN {idx + 1}
            </div>

            <div style={{ marginTop: '10px' }}>
              <h3 style={{ color: '#1e3a5f', fontSize: '20px', marginBottom: '10px', fontWeight: '700', minHeight: '50px' }}>
                {opcion.nombre_paquete}
              </h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px', fontStyle: 'italic' }}>
                {getOperadorNombre(opcion.operador_id)}
              </p>

              <div style={{ 
                backgroundColor: '#1e3a5f', 
                color: '#ffffff', 
                padding: '20px', 
                borderRadius: '8px', 
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '5px' }}>Precio Total</div>
                <div style={{ fontSize: '36px', fontWeight: '700' }}>
                  ${parseFloat(opcion.precio_total).toLocaleString('es-MX')}
                </div>
                {opcion.precio_por_persona > 0 && (
                  <div style={{ fontSize: '14px', marginTop: '5px', opacity: '0.9' }}>
                    ${parseFloat(opcion.precio_por_persona).toLocaleString('es-MX')} por persona
                  </div>
                )}
              </div>

              {opcion.incluye && opcion.incluye.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ color: '#22c55e', fontSize: '16px', marginBottom: '10px', fontWeight: '600' }}>
                    ✓ Incluye:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
                    {opcion.incluye.slice(0, 5).map((item, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{item.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}

              {opcion.no_incluye && opcion.no_incluye.length > 0 && (
                <div>
                  <h4 style={{ color: '#ef4444', fontSize: '16px', marginBottom: '10px', fontWeight: '600' }}>
                    ✗ No incluye:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
                    {opcion.no_incluye.slice(0, 3).map((item, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{item.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '50px', 
        paddingTop: '30px', 
        borderTop: '3px solid #1e3a5f',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: '#1e3a5f', fontWeight: '600', marginBottom: '10px' }}>
          ¿Listo para tu próxima aventura?
        </p>
        <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
          📞 Contáctanos para más información o reservar
        </p>
        <p style={{ fontSize: '14px', color: '#5eb3d4', fontWeight: '600', margin: '10px 0' }}>
          Emociones Viajes - Creando momentos inolvidables
        </p>
      </div>
    </div>
  )
}