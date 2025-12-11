import { useState } from 'react'
import html2canvas from 'html2canvas'
import { Share2, Loader2 } from 'lucide-react'
import WhatsAppExportTemplate from './WhatsAppExportTemplate'

export default function ExportToWhatsApp({ cotizacion, opciones, operadores }) {
  const [generating, setGenerating] = useState(false)

  async function handleExport() {
    setGenerating(true)
    
    try {
      const element = document.getElementById('whatsapp-export-template')
      if (!element) {
        throw new Error('Export template not found')
      }

      // Wait for any images to load
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1080,
        windowWidth: 1080
      })

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to generate image')
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `propuesta-${cotizacion.folio}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        setGenerating(false)
      }, 'image/png', 1.0)

    } catch (error) {
      console.error('Export error:', error)
      alert('Error al generar imagen: ' + error.message)
      setGenerating(false)
    }
  }

  return (
    <>
      <button
        onClick={handleExport}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {generating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Share2 size={18} />
            WhatsApp
          </>
        )}
      </button>

      {/* Hidden template */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <WhatsAppExportTemplate
          cotizacion={cotizacion}
          opciones={opciones}
          operadores={operadores}
        />
      </div>
    </>
  )
}