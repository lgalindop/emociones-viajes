import PropTypes from "prop-types";
import {
  Home,
  FileText,
  TrendingUp,
  DollarSign,
  Menu,
} from "lucide-react";
import NavButton from "./NavButton";

export default function MobileBottomNav({
  onNavigate,
  onMenuToggle,
  currentPath,
}) {
  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
      aria-label="Mobile bottom navigation"
    >
      <div className="grid grid-cols-5 gap-1">
        <NavButton
          icon={Home}
          label="Inicio"
          onClick={() => onNavigate("/app")}
          isActive={currentPath === "/app"}
          variant="mobile-bottom"
        />
        <NavButton
          icon={FileText}
          label="Cotiz."
          onClick={() => onNavigate("/app/cotizaciones")}
          isActive={isActive("/app/cotizaciones")}
          variant="mobile-bottom"
        />
        <NavButton
          icon={TrendingUp}
          label="Pipeline"
          onClick={() => onNavigate("/app/pipeline")}
          isActive={isActive("/app/pipeline")}
          variant="mobile-bottom"
        />
        <NavButton
          icon={DollarSign}
          label="Ventas"
          onClick={() => onNavigate("/app/sales")}
          isActive={isActive("/app/sales")}
          variant="mobile-bottom"
        />
        <button
          onClick={onMenuToggle}
          className="flex flex-col items-center justify-center py-2 text-gray-600"
          aria-label="Abrir menú completo"
          aria-haspopup="true"
        >
          <Menu size={20} aria-hidden="true" />
          <span className="text-xs mt-1">Más</span>
        </button>
      </div>
    </nav>
  );
}

MobileBottomNav.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  onMenuToggle: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired,
};
