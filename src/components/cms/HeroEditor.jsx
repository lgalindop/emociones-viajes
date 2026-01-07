import PropTypes from "prop-types";
import ImageUploader from "./ImageUploader";
import FormField from "./FormField";

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

      <FormField
        label="Titulo Principal"
        value={content.headline || ""}
        onChange={(value) => handleChange("headline", value)}
        placeholder="Descubre el Mundo con Emociones Viajes"
      />

      <FormField
        label="Subtitulo"
        value={content.subheadline || ""}
        onChange={(value) => handleChange("subheadline", value)}
        placeholder="Paquetes personalizados para toda la familia"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Texto del Boton"
          value={content.cta_text || ""}
          onChange={(value) => handleChange("cta_text", value)}
          placeholder="Ver Destinos"
        />

        <FormField
          label="Enlace del Boton"
          value={content.cta_link || ""}
          onChange={(value) => handleChange("cta_link", value)}
          placeholder="#destinations"
        />
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
              {content.headline || "Titulo Principal"}
            </h1>
            <p className="text-sm mb-4">
              {content.subheadline || "Subtitulo descriptivo"}
            </p>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
              {content.cta_text || "Boton"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

HeroEditor.propTypes = {
  content: PropTypes.shape({
    image_url: PropTypes.string,
    headline: PropTypes.string,
    subheadline: PropTypes.string,
    cta_text: PropTypes.string,
    cta_link: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
