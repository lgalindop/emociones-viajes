import PropTypes from "prop-types";
import { Menu, X } from "lucide-react";
import { getRoleBadgeColor, getRoleLabel } from "../../lib/roleUtils";
import MobileMenu from "./MobileMenu";

export default function MobileHeader({
  user,
  profile,
  currentPath,
  mobileMenuOpen,
  onMenuToggle,
  onNavigate,
  onSignOut,
  showCMS,
  canManageUsers,
}) {
  return (
    <nav className="md:hidden bg-primary text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => onNavigate("/")}
          className="hover:opacity-80 transition-opacity"
          aria-label="Ir a inicio"
        >
          <img
            src="/emociones-logo-full.png"
            alt="Emociones Viajes"
            className="h-8 w-auto"
          />
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium truncate max-w-[120px]">
              {profile?.full_name || user?.email}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                profile?.role
              )}`}
            >
              {getRoleLabel(profile?.role)}
            </span>
          </div>
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => onMenuToggle()}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        currentPath={currentPath}
        showCMS={showCMS}
        canManageUsers={canManageUsers}
      />
    </nav>
  );
}

MobileHeader.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
  }),
  profile: PropTypes.shape({
    full_name: PropTypes.string,
    role: PropTypes.string,
  }),
  currentPath: PropTypes.string.isRequired,
  mobileMenuOpen: PropTypes.bool.isRequired,
  onMenuToggle: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  showCMS: PropTypes.bool,
  canManageUsers: PropTypes.bool,
};

MobileHeader.defaultProps = {
  showCMS: false,
  canManageUsers: false,
};
