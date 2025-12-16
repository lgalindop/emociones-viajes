import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import ImageUploader from "./ImageUploader";

export default function DestinationsEditor({ content, onChange }) {
  const destinations = content.destinations || [];

  function addDestination() {
    const newDest = {
      id: `dest-${Date.now()}`,
      name: "",
      image_url: "",
      description: "",
      starting_price: 0,
    };
    onChange({ destinations: [...destinations, newDest] });
  }

  function updateDestination(index, field, value) {
    const updated = [...destinations];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ destinations: updated });
  }

  function removeDestination(index) {
    onChange({ destinations: destinations.filter((_, i) => i !== index) });
  }

  function moveDestination(index, direction) {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === destinations.length - 1)
    )
      return;

    const updated = [...destinations];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange({ destinations: updated });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Destinos ({destinations.length})</h3>
        <button
          onClick={addDestination}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus size={18} />
          Agregar Destino
        </button>
      </div>

      {destinations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay destinos. Haz clic en "Agregar Destino" para comenzar.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {destinations.map((dest, index) => (
          <div key={dest.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-700">
                Destino #{index + 1}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => moveDestination(index, "up")}
                  disabled={index === 0}
                  className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                >
                  <MoveUp size={18} />
                </button>
                <button
                  onClick={() => moveDestination(index, "down")}
                  disabled={index === destinations.length - 1}
                  className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                >
                  <MoveDown size={18} />
                </button>
                <button
                  onClick={() => removeDestination(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={dest.name}
                  onChange={(e) => updateDestination(index, "name", e.target.value)}
                  placeholder="Cancún"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Imagen
                </label>
                <ImageUploader
                  currentUrl={dest.image_url}
                  onImageUploaded={(url) =>
                    updateDestination(index, "image_url", url)
                  }
                  folder="destinations"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={dest.description}
                  onChange={(e) =>
                    updateDestination(index, "description", e.target.value)
                  }
                  placeholder="Playas paradisíacas"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Precio Desde (MXN)
                </label>
                <input
                  type="number"
                  value={dest.starting_price}
                  onChange={(e) =>
                    updateDestination(index, "starting_price", parseInt(e.target.value))
                  }
                  min="0"
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
