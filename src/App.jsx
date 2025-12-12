import { useState } from "react";
import Operadores from "./pages/Operadores";
import Cotizaciones from "./pages/Cotizaciones";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import PipelineKanban from "./components/pipeline/PipelineKanban";
import SalesList from "./pages/SalesList";
import SalesDashboard from "./pages/SalesDashboard";
import {
  Home,
  Users,
  FileText,
  LogOut,
  Shield,
  User,
  TrendingUp,
  DollarSign,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import LanguageSelector from "./components/LanguageSelector";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
  const [currentPage, setCurrentPage] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user, profile, signOut, isAdmin } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show inactive account message
  if (profile && !profile.is_active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Cuenta Desactivada
          </h2>
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido desactivada. Por favor contacta al administrador.
          </p>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  function getRoleBadgeColor(role) {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      agent: "bg-blue-100 text-blue-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.viewer;
  }

  function getRoleLabel(role) {
    const labels = {
      admin: "Admin",
      agent: "Agente",
      viewer: "Visualizador",
    };
    return labels[role] || role;
  }

  function handleNavClick(page) {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <nav className="bg-primary text-white shadow-lg hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Emociones Viajes</h1>
              <LanguageSelector />
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage("home")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "home" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Home size={20} />
                  {t("nav.home")}
                </button>
                <button
                  onClick={() => setCurrentPage("cotizaciones")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "cotizaciones" || currentPage === "nueva-cotizacion" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <FileText size={20} />
                  {t("nav.cotizaciones")}
                </button>
                <button
                  onClick={() => setCurrentPage("operadores")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "operadores" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Users size={20} />
                  {t("nav.operators")}
                </button>
                <button
                  onClick={() => setCurrentPage("pipeline")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "pipeline" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <TrendingUp size={20} />
                  Pipeline
                </button>
                <button
                  onClick={() => setCurrentPage("sales")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "sales" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <DollarSign size={20} />
                  Ventas
                </button>
                <button
                  onClick={() => setCurrentPage("dashboard")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "dashboard" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <BarChart3 size={20} />
                  Dashboard
                </button>
                {isAdmin() && (
                  <button
                    onClick={() => setCurrentPage("users")}
                    className={`px-4 py-2 rounded flex items-center gap-2 ${currentPage === "users" ? "bg-white/20" : "hover:bg-white/10"}`}
                  >
                    <Shield size={20} />
                    Usuarios
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {profile?.full_name || user?.email}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(profile?.role)}`}
                >
                  {getRoleLabel(profile?.role)}
                </span>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 rounded hover:bg-white/10 flex items-center gap-2"
              >
                <LogOut size={20} />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Emociones Viajes</h1>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-primary border-t border-white/20 shadow-lg">
            <div className="p-4">
              <div className="mb-4 pb-4 border-b border-white/20">
                <p className="text-sm font-medium">
                  {profile?.full_name || user?.email}
                </p>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getRoleBadgeColor(profile?.role)}`}
                >
                  {getRoleLabel(profile?.role)}
                </span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick("home")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${currentPage === "home" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Home size={20} />
                  <span>{t("nav.home")}</span>
                </button>
                <button
                  onClick={() => handleNavClick("cotizaciones")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${currentPage === "cotizaciones" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <FileText size={20} />
                  <span>{t("nav.cotizaciones")}</span>
                </button>
                <button
                  onClick={() => handleNavClick("operadores")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${currentPage === "operadores" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Users size={20} />
                  <span>{t("nav.operators")}</span>
                </button>
                <button
                  onClick={() => handleNavClick("pipeline")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${currentPage === "pipeline" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <TrendingUp size={20} />
                  <span>Pipeline</span>
                </button>
                <button
                  onClick={() => handleNavClick("sales")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${currentPage === "sales" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <DollarSign size={20} />
                  <span>Ventas</span>
                </button>
                <button
                  onClick={() => handleNavClick("dashboard")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${currentPage === "dashboard" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <BarChart3 size={20} />
                  <span>Dashboard</span>
                </button>
                {isAdmin() && (
                  <button
                    onClick={() => handleNavClick("users")}
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${currentPage === "users" ? "bg-white/20" : "hover:bg-white/10"}`}
                  >
                    <Shield size={20} />
                    <span>Usuarios</span>
                  </button>
                )}
                <button
                  onClick={signOut}
                  className="w-full px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-white/10 border-t border-white/20 mt-2 pt-4"
                >
                  <LogOut size={20} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {currentPage === "home" && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              {t("Emociones Viajes")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("Sistema de Cotizaciones de Emociones Viajes")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setCurrentPage("cotizaciones")}
                className="p-6 border-2 border-secondary rounded-lg hover:bg-secondary/5 text-left transition-colors"
              >
                <FileText size={32} className="text-secondary mb-2" />
                <h3 className="font-semibold text-lg">
                  {t("nav.cotizaciones")}
                </h3>
                <p className="text-sm text-gray-600">
                  Ver y gestionar cotizaciones
                </p>
              </button>
              <button
                onClick={() => setCurrentPage("operadores")}
                className="p-6 border-2 border-primary rounded-lg hover:bg-primary/5 text-left transition-colors"
              >
                <Users size={32} className="text-primary mb-2" />
                <h3 className="font-semibold text-lg">{t("nav.operators")}</h3>
                <p className="text-sm text-gray-600">
                  Gestionar operadores turísticos
                </p>
              </button>
              <button
                onClick={() => setCurrentPage("pipeline")}
                className="p-6 border-2 border-teal-600 rounded-lg hover:bg-teal-50 text-left transition-colors"
              >
                <TrendingUp size={32} className="text-teal-600 mb-2" />
                <h3 className="font-semibold text-lg">Pipeline</h3>
                <p className="text-sm text-gray-600">
                  Visualizar pipeline de ventas
                </p>
              </button>
              <button
                onClick={() => setCurrentPage("sales")}
                className="p-6 border-2 border-green-600 rounded-lg hover:bg-green-50 text-left transition-colors"
              >
                <DollarSign size={32} className="text-green-600 mb-2" />
                <h3 className="font-semibold text-lg">Ventas</h3>
                <p className="text-sm text-gray-600">
                  Gestionar ventas y pagos
                </p>
              </button>
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="p-6 border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-left transition-colors"
              >
                <BarChart3 size={32} className="text-blue-600 mb-2" />
                <h3 className="font-semibold text-lg">Dashboard</h3>
                <p className="text-sm text-gray-600">Reportes y métricas</p>
              </button>
              {isAdmin() && (
                <button
                  onClick={() => setCurrentPage("users")}
                  className="p-6 border-2 border-purple-600 rounded-lg hover:bg-purple-50 text-left transition-colors"
                >
                  <Shield size={32} className="text-purple-600 mb-2" />
                  <h3 className="font-semibold text-lg">Usuarios</h3>
                  <p className="text-sm text-gray-600">
                    Gestionar usuarios del sistema
                  </p>
                </button>
              )}
            </div>
          </div>
        )}
        {currentPage === "operadores" && <Operadores />}
        {currentPage === "cotizaciones" && (
          <Cotizaciones
            onNewCotizacion={() => setCurrentPage("nueva-cotizacion")}
          />
        )}
        {currentPage === "nueva-cotizacion" && (
          <NuevaCotizacion
            onBack={() => setCurrentPage("cotizaciones")}
            onSuccess={() => setCurrentPage("cotizaciones")}
          />
        )}
        {currentPage === "pipeline" && (
          <PipelineKanban
            onNewQuote={() => setCurrentPage("nueva-cotizacion")}
          />
        )}
        {currentPage === "sales" && <SalesList />}
        {currentPage === "dashboard" && <SalesDashboard />}
        {currentPage === "users" && isAdmin() && <UserManagement />}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => handleNavClick("home")}
            className={`flex flex-col items-center justify-center py-2 ${currentPage === "home" ? "text-primary" : "text-gray-600"}`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Inicio</span>
          </button>
          <button
            onClick={() => handleNavClick("cotizaciones")}
            className={`flex flex-col items-center justify-center py-2 ${currentPage === "cotizaciones" || currentPage === "nueva-cotizacion" ? "text-primary" : "text-gray-600"}`}
          >
            <FileText size={20} />
            <span className="text-xs mt-1">Cotiz.</span>
          </button>
          <button
            onClick={() => handleNavClick("pipeline")}
            className={`flex flex-col items-center justify-center py-2 ${currentPage === "pipeline" ? "text-primary" : "text-gray-600"}`}
          >
            <TrendingUp size={20} />
            <span className="text-xs mt-1">Pipeline</span>
          </button>
          <button
            onClick={() => handleNavClick("sales")}
            className={`flex flex-col items-center justify-center py-2 ${currentPage === "sales" ? "text-primary" : "text-gray-600"}`}
          >
            <DollarSign size={20} />
            <span className="text-xs mt-1">Ventas</span>
          </button>
          <button
            onClick={() => handleNavClick("dashboard")}
            className={`flex flex-col items-center justify-center py-2 ${currentPage === "dashboard" ? "text-primary" : "text-gray-600"}`}
          >
            <BarChart3 size={20} />
            <span className="text-xs mt-1">Panel</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
