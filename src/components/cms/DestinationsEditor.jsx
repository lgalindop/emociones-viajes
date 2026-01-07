import PropTypes from "prop-types";
import ImageUploader from "./ImageUploader";
import FormField from "./FormField";
import ListHeader from "./ListHeader";
import ListItemControls from "./ListItemControls";
import EmptyState from "./EmptyState";

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
      <ListHeader
        title="Destinos"
        count={destinations.length}
        onAdd={addDestination}
        addLabel="Agregar Destino"
      />

      {destinations.length === 0 && (
        <EmptyState message='No hay destinos. Haz clic en "Agregar Destino" para comenzar.' />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {destinations.map((dest, index) => (
          <div key={dest.id} className="border rounded-lg p-4 bg-gray-50">
            <ListItemControls
              index={index}
              total={destinations.length}
              onMoveUp={() => moveDestination(index, "up")}
              onMoveDown={() => moveDestination(index, "down")}
              onDelete={() => removeDestination(index)}
              itemLabel="Destino"
            />

            <div className="space-y-3">
              <FormField
                label="Nombre"
                value={dest.name}
                onChange={(value) => updateDestination(index, "name", value)}
                placeholder="Cancun"
              />

              <div>
                <label className="block text-sm font-medium mb-1">Imagen</label>
                <ImageUploader
                  currentUrl={dest.image_url}
                  onImageUploaded={(url) =>
                    updateDestination(index, "image_url", url)
                  }
                  folder="destinations"
                />
              </div>

              <FormField
                label="Descripcion"
                value={dest.description}
                onChange={(value) => updateDestination(index, "description", value)}
                placeholder="Playas paradisiacas"
              />

              <FormField
                label="Precio Desde (MXN)"
                type="number"
                value={dest.starting_price}
                onChange={(value) => updateDestination(index, "starting_price", value)}
                min="0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

DestinationsEditor.propTypes = {
  content: PropTypes.shape({
    destinations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        image_url: PropTypes.string,
        description: PropTypes.string,
        starting_price: PropTypes.number,
      })
    ),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
