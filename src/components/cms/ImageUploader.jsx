import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Upload,
  X,
  Link as LinkIcon,
  Maximize2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";

const IMAGE_SPECS = {
  hero: { width: 1920, height: 1080, name: "Hero Banner" },
  deals: { width: 800, height: 600, name: "Ofertas" },
  destinations: { width: 800, height: 600, name: "Destinos" },
  flyers: { width: 600, height: 800, name: "Flyers" },
  general: { width: 1200, height: 800, name: "General" },
};

export default function ImageUploader({
  currentUrl,
  onImageUploaded,
  folder = "general",
}) {
  const [uploading, setUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showResize, setShowResize] = useState(false);
  const [imageToProcess, setImageToProcess] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fitMode, setFitMode] = useState("cover");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const canvasRef = useRef(null);

  const spec = IMAGE_SPECS[folder];

  useEffect(() => {
    if (!imagePreview || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;

      canvas.width = spec.width;
      canvas.height = spec.height;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let dx, dy, dw, dh;

      if (fitMode === "cover") {
        const scale =
          Math.max(canvas.width / img.width, canvas.height / img.height) * zoom;
        const sw = img.width;
        const sh = img.height;
        dw = img.width * scale;
        dh = img.height * scale;
        dx = (canvas.width - dw) / 2 + offsetX;
        dy = (canvas.height - dh) / 2 + offsetY;
        ctx.drawImage(img, 0, 0, sw, sh, dx, dy, dw, dh);
      } else if (fitMode === "contain") {
        const scale =
          Math.min(canvas.width / img.width, canvas.height / img.height) * zoom;
        dw = img.width * scale;
        dh = img.height * scale;
        dx = (canvas.width - dw) / 2 + offsetX;
        dy = (canvas.height - dh) / 2 + offsetY;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    img.src = imagePreview;

    // Cleanup to prevent memory leaks
    return () => {
      cancelled = true;
      img.onload = null;
      img.src = "";
    };
  }, [imagePreview, fitMode, zoom, offsetX, offsetY, spec.width, spec.height]);

  async function processImage() {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = spec.width;
      canvas.height = spec.height;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let sx, sy, sw, sh, dx, dy, dw, dh;

        if (fitMode === "cover") {
          const scale =
            Math.max(canvas.width / img.width, canvas.height / img.height) *
            zoom;
          sw = img.width;
          sh = img.height;
          dw = img.width * scale;
          dh = img.height * scale;
          dx = (canvas.width - dw) / 2 + offsetX;
          dy = (canvas.height - dh) / 2 + offsetY;
          ctx.drawImage(img, 0, 0, sw, sh, dx, dy, dw, dh);
        } else if (fitMode === "contain") {
          const scale =
            Math.min(canvas.width / img.width, canvas.height / img.height) *
            zoom;
          dw = img.width * scale;
          dh = img.height * scale;
          dx = (canvas.width - dw) / 2 + offsetX;
          dy = (canvas.height - dh) / 2 + offsetY;
          ctx.drawImage(img, dx, dy, dw, dh);
        } else {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob], imageToProcess.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.92
        );
      };
      img.src = imagePreview;
    });
  }

  async function handleFileSelect(event) {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const needsResize =
          img.width !== spec.width || img.height !== spec.height;

        if (needsResize) {
          setImageToProcess(file);
          setImagePreview(e.target.result);
          setShowResize(true);
          setZoom(1);
          setOffsetX(0);
          setOffsetY(0);
        } else {
          uploadImage(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function uploadImage(file) {
    try {
      setUploading(true);

      const fileExt = "jpg";
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("landing-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("landing-images").getPublicUrl(fileName);

      onImageUploaded(publicUrl);
      setImageToProcess(null);
      setImagePreview(null);
      setShowResize(false);
    } catch (error) {
      alert("Error subiendo imagen: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleProcessAndUpload() {
    if (!imageToProcess) return;
    const processed = await processImage();
    await uploadImage(processed);
  }

  function handleUrlSubmit() {
    if (urlInput.trim()) {
      onImageUploaded(urlInput.trim());
      setUrlInput("");
      setUseUrl(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Image specs info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium text-blue-900">
            Especificaciones: {spec.name}
          </div>
          <div className="text-blue-700">
            Tamaño requerido: {spec.width}x{spec.height}px
          </div>
        </div>
      </div>

      {currentUrl && (
        <div className="relative">
          <img
            src={currentUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <button
            onClick={() => onImageUploaded("")}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Image processing modal */}
      {showResize && imagePreview && (
        <div className="p-4 bg-white border-2 border-primary rounded-lg space-y-3">
          <div className="font-medium text-gray-900">
            Ajustar imagen a especificaciones
          </div>

          <div className="bg-gray-100 rounded-lg p-2">
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded border-2 border-gray-300"
              style={{ maxHeight: "400px" }}
            />
          </div>

          {/* Fit Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Modo de ajuste:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFitMode("cover")}
                className={`p-2 border rounded text-sm ${
                  fitMode === "cover"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Cubrir
              </button>
              <button
                onClick={() => setFitMode("contain")}
                className={`p-2 border rounded text-sm ${
                  fitMode === "contain"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Contener
              </button>
              <button
                onClick={() => setFitMode("exact")}
                className={`p-2 border rounded text-sm ${
                  fitMode === "exact"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Estirar
              </button>
            </div>
          </div>

          {/* Advanced Controls */}
          {fitMode !== "exact" && (
            <div className="space-y-3 p-3 bg-gray-50 rounded">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Zoom</label>
                  <span className="text-xs text-gray-600">
                    {zoom.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                    className="p-1 border rounded hover:bg-white"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <input
                    type="range"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    min="0.1"
                    max="3"
                    step="0.1"
                    className="flex-1"
                  />
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="p-1 border rounded hover:bg-white"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Move size={14} />
                  Posición Horizontal
                </label>
                <input
                  type="range"
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseInt(e.target.value))}
                  min={-spec.width}
                  max={spec.width}
                  step="10"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Move size={14} />
                  Posición Vertical
                </label>
                <input
                  type="range"
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseInt(e.target.value))}
                  min={-spec.height}
                  max={spec.height}
                  step="10"
                  className="w-full"
                />
              </div>

              <button
                onClick={() => {
                  setZoom(1);
                  setOffsetX(0);
                  setOffsetY(0);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:bg-white"
              >
                Restablecer
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleProcessAndUpload}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "Procesar y Subir"}
            </button>
            <button
              onClick={() => {
                setImageToProcess(null);
                setImagePreview(null);
                setShowResize(false);
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Upload controls */}
      {!showResize && (
        <>
          <div className="flex gap-2">
            <label className="flex-1">
              <div
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  uploading
                    ? "bg-gray-100 cursor-not-allowed"
                    : "hover:border-primary hover:bg-primary/5"
                }`}
              >
                <Upload size={20} />
                <span>{uploading ? "Subiendo..." : "Subir Imagen"}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setUseUrl(!useUrl)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
              title="Usar URL externa"
            >
              <LinkIcon size={20} />
            </button>
          </div>

          {useUrl && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Usar URL
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
