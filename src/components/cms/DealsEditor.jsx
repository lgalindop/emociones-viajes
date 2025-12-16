import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import ImageUploader from "./ImageUploader";

export default function DealsEditor({ content, onChange }) {
  const deals = content.deals || [];

  function addDeal() {
    const newDeal = {
      id: `deal-${Date.now()}`,
      title: "",
      description: "",
      image_url: "",
      valid_until: "",
      discount_percent: 0,
      link: "#contact",
    };
    onChange({ deals: [...deals, newDeal] });
  }

  function updateDeal(index, field, value) {
    const updated = [...deals];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ deals: updated });
  }

  function removeDeal(index) {
    onChange({ deals: deals.filter((_, i) => i !== index) });
  }

  function moveDeal(index, direction) {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === deals.length - 1)
    )
      return;

    const updated = [...deals];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange({ deals: updated });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Ofertas ({deals.length})</h3>
        <button
          onClick={addDeal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus size={18} />
          Agregar Oferta
        </button>
      </div>

      {deals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay ofertas. Haz clic en "Agregar Oferta" para comenzar.
        </div>
      )}

      <div className="space-y-4">
        {deals.map((deal, index) => (
          <div key={deal.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-700">
                Oferta #{index + 1}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => moveDeal(index, "up")}
                  disabled={index === 0}
                  className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                >
                  <MoveUp size={18} />
                </button>
                <button
                  onClick={() => moveDeal(index, "down")}
                  disabled={index === deals.length - 1}
                  className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                >
                  <MoveDown size={18} />
                </button>
                <button
                  onClick={() => removeDeal(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={deal.title}
                  onChange={(e) => updateDeal(index, "title", e.target.value)}
                  placeholder="Cancún Todo Incluido"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Descripción
                </label>
                <textarea
                  value={deal.description}
                  onChange={(e) =>
                    updateDeal(index, "description", e.target.value)
                  }
                  placeholder="5 días 4 noches desde $12,000 MXN"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Imagen
                </label>
                <ImageUploader
                  currentUrl={deal.image_url}
                  onImageUploaded={(url) => updateDeal(index, "image_url", url)}
                  folder="deals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Válido Hasta
                </label>
                <input
                  type="date"
                  value={deal.valid_until}
                  onChange={(e) =>
                    updateDeal(index, "valid_until", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  value={deal.discount_percent}
                  onChange={(e) =>
                    updateDeal(index, "discount_percent", parseInt(e.target.value))
                  }
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Enlace
                </label>
                <input
                  type="text"
                  value={deal.link}
                  onChange={(e) => updateDeal(index, "link", e.target.value)}
                  placeholder="#contact"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
