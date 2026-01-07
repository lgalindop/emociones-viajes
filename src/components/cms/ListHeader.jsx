import PropTypes from "prop-types";
import { Plus } from "lucide-react";

/**
 * Header for CMS list editors with title and add button
 */
export default function ListHeader({ title, count, onAdd, addLabel = "Agregar" }) {
  return (
    <div className="flex justify-between items-center">
      <h3 className="font-medium">
        {title} ({count})
      </h3>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Plus size={18} aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}

ListHeader.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  onAdd: PropTypes.func.isRequired,
  addLabel: PropTypes.string,
};
