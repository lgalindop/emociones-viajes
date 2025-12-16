import { Upload } from "lucide-react";
import ImageUploader from "./ImageUploader";

export default function HeroEditor({ content, onChange }) {
  function handleChange(field, value) {
    onChange({ ...content, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Imagen de Fondo
        </label>
        <ImageUploader
          currentUrl={content.image_url || ""}
          onImageUploaded={(url) => handleChange("image_url", url)}
          folder="hero"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Título Principal
        </label>
        <input
          type="text"
          value={content.headline || ""}
          onChange={(e) => handleChange("headline", e.target.value)}
          placeholder="Descubre el Mundo con Emociones Viajes"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Subtítulo</label>
        <input
          type="text"
          value={content.subheadline || ""}
          onChange={(e) => handleChange("subheadline", e.target.value)}
          placeholder="Paquetes personalizados para toda la familia"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Texto del Botón
          </label>
          <input
            type="text"
            value={content.cta_text || ""}
            onChange={(e) => handleChange("cta_text", e.target.value)}
            placeholder="Ver Destinos"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Enlace del Botón
          </label>
          <input
            type="text"
            value={content.cta_link || ""}
            onChange={(e) => handleChange("cta_link", e.target.value)}
            placeholder="#destinations"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="text-sm font-medium mb-2">Vista Previa</div>
        <div
          className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white"
          style={
            content.image_url
              ? {
                  backgroundImage: `url(${content.image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {}
          }
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-2xl font-bold mb-2">
              {content.headline || "Título Principal"}
            </h1>
            <p className="text-sm mb-4">
              {content.subheadline || "Subtítulo descriptivo"}
            </p>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
              {content.cta_text || "Botón"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
