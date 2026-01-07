import PropTypes from "prop-types";
import {
  Home,
  FileText,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Receipt,
  Layout,
  Shield,
  LogOut,
} from "lucide-react";
import NavButton from "./NavButton";

export default function MobileMenu({
  isOpen,
  onClose,
  onNavigate,
  onSignOut,
  currentPath,
  showCMS,
  canManageUsers,
}) {
  if (!isOpen) return null;

  const handleNav = (path) => {
    onNavigate(path);
    onClose();
  };

  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const navItems = [
    { path: "/app", icon: Home, label: "Inicio", exact: true },
    { path: "/app/cotizaciones", icon: FileText, label: "Cotizaciones" },
    { path: "/app/operadores", icon: Building2, label: "Operadores" },
    { path: "/app/pipeline", icon: TrendingUp, label: "Pipeline" },
    { path: "/app/sales", icon: DollarSign, label: "Ventas" },
    { path: "/app/grupos", icon: Users, label: "Grupos" },
    { path: "/app/dashboard", icon: BarChart3, label: "Dashboard" },
    { path: "/app/receipts", icon: Receipt, label: "Recibos" },
  ];

  return (
    <nav
      className="border-t border-white/20 bg-primary/95 px-4 py-3 space-y-1"
      aria-label="Mobile navigation menu"
    >
      {navItems.map((item) => (
        <NavButton
          key={item.path}
          icon={item.icon}
          label={item.label}
          onClick={() => handleNav(item.path)}
          isActive={item.exact ? currentPath === item.path : isActive(item.path)}
          variant="mobile-menu"
        />
      ))}

      {showCMS && (
        <NavButton
          icon={Layout}
          label="CMS"
          onClick={() => handleNav("/app/cms")}
          isActive={isActive("/app/cms")}
          variant="mobile-menu"
        />
      )}

      {canManageUsers && (
        <NavButton
          icon={Shield}
          label="Usuarios"
          onClick={() => handleNav("/app/users")}
          isActive={isActive("/app/users")}
          variant="mobile-menu"
        />
      )}

      <div className="border-t border-white/20 pt-2 mt-2">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} aria-hidden="true" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}

MobileMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired,
  showCMS: PropTypes.bool,
  canManageUsers: PropTypes.bool,
};

MobileMenu.defaultProps = {
  showCMS: false,
  canManageUsers: false,
};
