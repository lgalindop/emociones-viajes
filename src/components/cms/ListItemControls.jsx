import PropTypes from "prop-types";
import { MoveUp, MoveDown, Trash2 } from "lucide-react";

/**
 * Reusable list item controls for move up/down and delete
 */
export default function ListItemControls({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  itemLabel = "Item",
}) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="text-sm font-medium text-gray-700">
        {itemLabel} #{index + 1}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
          aria-label={`Mover ${itemLabel.toLowerCase()} arriba`}
        >
          <MoveUp size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
          aria-label={`Mover ${itemLabel.toLowerCase()} abajo`}
        >
          <MoveDown size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-red-600 hover:text-red-800"
          aria-label={`Eliminar ${itemLabel.toLowerCase()}`}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

ListItemControls.propTypes = {
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  itemLabel: PropTypes.string,
};
