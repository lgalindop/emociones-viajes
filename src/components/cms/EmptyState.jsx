import PropTypes from "prop-types";

/**
 * Empty state message for CMS lists
 */
export default function EmptyState({ message }) {
  return (
    <div className="text-center py-8 text-gray-500">
      {message}
    </div>
  );
}

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
};
