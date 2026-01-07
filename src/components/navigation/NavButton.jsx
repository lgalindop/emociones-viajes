import PropTypes from "prop-types";

export default function NavButton({
  icon: Icon,
  label,
  onClick,
  isActive,
  variant = "desktop"
}) {
  if (variant === "mobile-bottom") {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center py-2 ${
          isActive ? "text-primary" : "text-gray-600"
        }`}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon size={20} aria-hidden="true" />
        <span className="text-xs mt-1">{label}</span>
      </button>
    );
  }

  if (variant === "mobile-menu") {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? "bg-white/20 text-white"
            : "text-white hover:bg-white/10"
        }`}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon size={20} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  // Desktop variant
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded hover:bg-white/10 transition-colors ${
        isActive ? "bg-white/20" : ""
      }`}
      title={label}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}

NavButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  variant: PropTypes.oneOf(["desktop", "mobile-bottom", "mobile-menu"]),
};

NavButton.defaultProps = {
  isActive: false,
  variant: "desktop",
};
