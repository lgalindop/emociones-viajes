import { Plus, Trash2 } from "lucide-react";
import ImageUploader from "./ImageUploader";

export default function GalleryEditor({ content, onChange }) {
  const flyers = content.flyers || [];

  function addFlyer() {
    const newFlyer = {
      id: `flyer-${Date.now()}`,
      image_url: "",
      title: "",
      upload_date: new Date().toISOString().split("T")[0],
    };
    onChange({ flyers: [...flyers, newFlyer] });
  }

  function updateFlyer(index, field, value) {
    const updated = [...flyers];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ flyers: updated });
  }

  function removeFlyer(index) {
    onChange({ flyers: flyers.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Flyers Promocionales ({flyers.length})</h3>
        <button
          onClick={addFlyer}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus size={18} />
          Agregar Flyer
        </button>
      </div>

      {flyers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay flyers. Haz clic en "Agregar Flyer" para comenzar.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {flyers.map((flyer, index) => (
          <div key={flyer.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <div className="text-sm font-medium text-gray-700">
                Flyer #{index + 1}
              </div>
              <button
                onClick={() => removeFlyer(index)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={flyer.title}
                  onChange={(e) => updateFlyer(index, "title", e.target.value)}
                  placeholder="Promo Semana Santa"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Imagen del Flyer
                </label>
                <ImageUploader
                  currentUrl={flyer.image_url}
                  onImageUploaded={(url) =>
                    updateFlyer(index, "image_url", url)
                  }
                  folder="flyers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={flyer.upload_date}
                  onChange={(e) =>
                    updateFlyer(index, "upload_date", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-blue-900 mb-2">
          💡 Consejos para Flyers
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa imágenes de alta calidad (min. 800x1000px)</li>
          <li>• Formato vertical funciona mejor</li>
          <li>• Sube a un servicio de imágenes (Imgur, Cloudinary, etc.)</li>
          <li>• Mantén texto legible incluso en móviles</li>
        </ul>
      </div>
    </div>
  );
}
