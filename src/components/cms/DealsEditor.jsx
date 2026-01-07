import PropTypes from "prop-types";
import ImageUploader from "./ImageUploader";
import FormField from "./FormField";
import ListHeader from "./ListHeader";
import ListItemControls from "./ListItemControls";
import EmptyState from "./EmptyState";

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
      <ListHeader
        title="Ofertas"
        count={deals.length}
        onAdd={addDeal}
        addLabel="Agregar Oferta"
      />

      {deals.length === 0 && (
        <EmptyState message='No hay ofertas. Haz clic en "Agregar Oferta" para comenzar.' />
      )}

      <div className="space-y-4">
        {deals.map((deal, index) => (
          <div key={deal.id} className="border rounded-lg p-4 bg-gray-50">
            <ListItemControls
              index={index}
              total={deals.length}
              onMoveUp={() => moveDeal(index, "up")}
              onMoveDown={() => moveDeal(index, "down")}
              onDelete={() => removeDeal(index)}
              itemLabel="Oferta"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField
                  label="Titulo"
                  value={deal.title}
                  onChange={(value) => updateDeal(index, "title", value)}
                  placeholder="Cancun Todo Incluido"
                />
              </div>

              <div className="col-span-2">
                <FormField
                  label="Descripcion"
                  type="textarea"
                  value={deal.description}
                  onChange={(value) => updateDeal(index, "description", value)}
                  placeholder="5 dias 4 noches desde $12,000 MXN"
                  rows={2}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Imagen</label>
                <ImageUploader
                  currentUrl={deal.image_url}
                  onImageUploaded={(url) => updateDeal(index, "image_url", url)}
                  folder="deals"
                />
              </div>

              <FormField
                label="Valido Hasta"
                type="date"
                value={deal.valid_until}
                onChange={(value) => updateDeal(index, "valid_until", value)}
              />

              <FormField
                label="Descuento (%)"
                type="number"
                value={deal.discount_percent}
                onChange={(value) => updateDeal(index, "discount_percent", value)}
                min="0"
                max="100"
              />

              <div className="col-span-2">
                <FormField
                  label="Enlace"
                  value={deal.link}
                  onChange={(value) => updateDeal(index, "link", value)}
                  placeholder="#contact"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

DealsEditor.propTypes = {
  content: PropTypes.shape({
    deals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        image_url: PropTypes.string,
        valid_until: PropTypes.string,
        discount_percent: PropTypes.number,
        link: PropTypes.string,
      })
    ),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
