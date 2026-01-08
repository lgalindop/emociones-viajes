import PropTypes from "prop-types";
import {
  Home,
  FileText,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  UserCircle,
  BarChart3,
  Receipt,
  Layout,
  Shield,
  LogOut,
  Building,
} from "lucide-react";
import { getRoleBadgeColor, getRoleLabel } from "../../lib/roleUtils";

export default function DesktopNav({
  user,
  profile,
  currentPath,
  onNavigate,
  onSignOut,
  showCMS,
  canManageUsers,
}) {
  function isActive(path) {
    return currentPath === path || currentPath.startsWith(path + "/");
  }

  const navItems = [
    { path: "/app", icon: Home, label: "Inicio", exact: true },
    { path: "/app/cotizaciones", icon: FileText, label: "Cotizaciones" },
    { path: "/app/clientes", icon: UserCircle, label: "Clientes" },
    { path: "/app/operadores", icon: Building2, label: "Operadores" },
    { path: "/app/hoteles", icon: Building, label: "Hoteles" },
    { path: "/app/pipeline", icon: TrendingUp, label: "Pipeline" },
    { path: "/app/sales", icon: DollarSign, label: "Ventas" },
    { path: "/app/grupos", icon: Users, label: "Grupos" },
    { path: "/app/dashboard", icon: BarChart3, label: "Dashboard" },
    { path: "/app/receipts", icon: Receipt, label: "Recibos" },
  ];

  return (
    <nav className="bg-primary text-white shadow-lg hidden md:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("/")}
              className="hover:opacity-80 transition-opacity"
              aria-label="Ir a inicio"
            >
              <img
                src="/emociones-logo-full.png"
                alt="Emociones Viajes"
                className="h-10 w-auto"
              />
            </button>
            <div className="flex gap-1" role="navigation" aria-label="Navegacion principal">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? currentPath === item.path
                  : isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`p-3 rounded hover:bg-white/10 transition-colors relative group ${
                      active ? "bg-white/20" : ""
                    }`}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {item.label}
                    </span>
                  </button>
                );
              })}
              {showCMS && (
                <button
                  onClick={() => onNavigate("/app/cms")}
                  className={`p-3 rounded hover:bg-white/10 transition-colors relative group ${
                    isActive("/app/cms") ? "bg-white/20" : ""
                  }`}
                  aria-label="CMS"
                  aria-current={isActive("/app/cms") ? "page" : undefined}
                >
                  <Layout size={20} aria-hidden="true" />
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    CMS
                  </span>
                </button>
              )}
              {canManageUsers && (
                <button
                  onClick={() => onNavigate("/app/users")}
                  className={`p-3 rounded hover:bg-white/10 transition-colors relative group ${
                    isActive("/app/users") ? "bg-white/20" : ""
                  }`}
                  aria-label="Usuarios"
                  aria-current={isActive("/app/users") ? "page" : undefined}
                >
                  <Shield size={20} aria-hidden="true" />
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Usuarios
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium whitespace-nowrap">
                {profile?.full_name || user?.email}
              </p>
              <div className="mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                    profile?.role
                  )}`}
                >
                  {getRoleLabel(profile?.role)}
                </span>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 hover:bg-white/10 rounded transition-colors relative group"
              aria-label="Cerrar sesion"
            >
              <LogOut size={20} aria-hidden="true" />
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

DesktopNav.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
  }),
  profile: PropTypes.shape({
    full_name: PropTypes.string,
    role: PropTypes.string,
  }),
  currentPath: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  showCMS: PropTypes.bool,
  canManageUsers: PropTypes.bool,
};

DesktopNav.defaultProps = {
  showCMS: false,
  canManageUsers: false,
};
