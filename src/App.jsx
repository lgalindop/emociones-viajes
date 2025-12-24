import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Operadores from "./pages/Operadores";
import Cotizaciones from "./pages/Cotizaciones";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import PipelineKanban from "./components/pipeline/PipelineKanban";
import SalesList from "./pages/SalesList";
import SalesDashboard from "./pages/SalesDashboard";
import LandingPage from "./pages/LandingPage";
import CMSDashboard from "./pages/CMSDashboard";
import ApprovalQueue from "./pages/ApprovalQueue";
import ReceiptsList from "./pages/ReceiptsList";
import ReceiptWizard from "./pages/ReceiptWizard";
import {
  Home,
  Users,
  FileText,
  LogOut,
  Shield,
  TrendingUp,
  DollarSign,
  BarChart3,
  Menu,
  X,
  Layout,
  Receipt,
} from "lucide-react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function MainApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  function handleNavClick(path) {
    navigate(path);
    setMobileMenuOpen(false);
  }

  function isActive(path) {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  }

  const showCMS = profile?.content_manager || isAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <nav className="bg-primary text-white shadow-lg hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="hover:opacity-80 transition-opacity"
              >
                <img
                  src="/emociones-logo-full.png"
                  alt="Emociones Viajes"
                  className="h-10 w-auto"
                />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleNavClick("/app")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${location.pathname === "/app" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Home size={20} />
                  Inicio
                </button>
                <button
                  onClick={() => handleNavClick("/app/cotizaciones")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/cotizaciones") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <FileText size={20} />
                  Cotizaciones
                </button>
                <button
                  onClick={() => handleNavClick("/app/operadores")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/operadores") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Users size={20} />
                  Operadores
                </button>
                <button
                  onClick={() => handleNavClick("/app/pipeline")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/pipeline") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <TrendingUp size={20} />
                  Pipeline
                </button>
                <button
                  onClick={() => handleNavClick("/app/sales")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/sales") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <DollarSign size={20} />
                  Ventas
                </button>
                <button
                  onClick={() => handleNavClick("/app/dashboard")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/dashboard") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <BarChart3 size={20} />
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavClick("/app/receipts")}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/receipts") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Receipt size={20} />
                  Recibos
                </button>
                {showCMS && (
                  <button
                    onClick={() => handleNavClick("/app/cms")}
                    className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/cms") ? "bg-white/20" : "hover:bg-white/10"}`}
                  >
                    <Layout size={20} />
                    CMS
                  </button>
                )}
                {isAdmin() && (
                  <button
                    onClick={() => handleNavClick("/app/users")}
                    className={`px-4 py-2 rounded flex items-center gap-2 ${isActive("/app/users") ? "bg-white/20" : "hover:bg-white/10"}`}
                  >
                    <Shield size={20} />
                    Usuarios
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right min-w-[120px]">
                <p className="text-sm font-medium whitespace-nowrap">
                  {profile?.full_name || user?.email}
                </p>
                <div className="mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(profile?.role)}`}
                  >
                    {getRoleLabel(profile?.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 rounded hover:bg-white/10 flex items-center gap-2 whitespace-nowrap"
              >
                <LogOut size={24} />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="text-lg font-bold hover:opacity-80"
          >
            Emociones Viajes
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

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
                  onClick={() => handleNavClick("/app")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${location.pathname === "/app" ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Home size={20} />
                  <span>Inicio</span>
                </button>
                <button
                  onClick={() => handleNavClick("/app/cotizaciones")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/cotizaciones") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <FileText size={20} />
                  <span>Cotizaciones</span>
                </button>
                <button
                  onClick={() => handleNavClick("/app/operadores")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/operadores") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Users size={20} />
                  <span>Operadores</span>
                </button>
                <button
                  onClick={() => handleNavClick("/app/pipeline")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/pipeline") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <TrendingUp size={20} />
                  <span>Pipeline</span>
                </button>
                <button
                  onClick={() => handleNavClick("/app/sales")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/sales") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <DollarSign size={20} />
                  <span>Ventas</span>
                </button>
                <button
                  onClick={() => handleNavClick("/app/dashboard")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/dashboard") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <BarChart3 size={20} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavClick("/app/receipts")}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/receipts") ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <Receipt size={20} />
                  <span>Recibos</span>
                </button>
                {showCMS && (
                  <button
                    onClick={() => handleNavClick("/app/cms")}
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/cms") ? "bg-white/20" : "hover:bg-white/10"}`}
                  >
                    <Layout size={20} />
                    <span>CMS</span>
                  </button>
                )}
                {isAdmin() && (
                  <button
                    onClick={() => handleNavClick("/app/users")}
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${isActive("/app/users") ? "bg-white/20" : "hover:bg-white/10"}`}
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
      <main className="pb-20 md:pb-0 relative">
        {/* Watermark */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <img
            src="/emociones-logo-icon.png"
            alt=""
            className="w-1/2 max-w-2xl opacity-5"
          />
        </div>

        <Routes>
          <Route
            index
            element={
              <div className="max-w-7xl mx-auto px-4 py-6">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                  Bienvenido
                </h2>
                <p className="text-gray-600 mb-6">
                  Sistema de Gestión de Cotizaciones para Emociones Viajes
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate("/app/cotizaciones")}
                    className="p-6 border-2 border-secondary rounded-lg hover:bg-secondary/5 text-left transition-colors"
                  >
                    <FileText size={32} className="text-secondary mb-2" />
                    <h3 className="font-semibold text-lg">Cotizaciones</h3>
                    <p className="text-sm text-gray-600">
                      Ver y gestionar cotizaciones
                    </p>
                  </button>
                  <button
                    onClick={() => navigate("/app/operadores")}
                    className="p-6 border-2 border-primary rounded-lg hover:bg-primary/5 text-left transition-colors"
                  >
                    <Users size={32} className="text-primary mb-2" />
                    <h3 className="font-semibold text-lg">Operadores</h3>
                    <p className="text-sm text-gray-600">
                      Gestionar operadores turísticos
                    </p>
                  </button>
                  <button
                    onClick={() => navigate("/app/pipeline")}
                    className="p-6 border-2 border-teal-600 rounded-lg hover:bg-teal-50 text-left transition-colors"
                  >
                    <TrendingUp size={32} className="text-teal-600 mb-2" />
                    <h3 className="font-semibold text-lg">Pipeline</h3>
                    <p className="text-sm text-gray-600">
                      Visualizar pipeline de ventas
                    </p>
                  </button>
                  <button
                    onClick={() => navigate("/app/sales")}
                    className="p-6 border-2 border-green-600 rounded-lg hover:bg-green-50 text-left transition-colors"
                  >
                    <DollarSign size={32} className="text-green-600 mb-2" />
                    <h3 className="font-semibold text-lg">Ventas</h3>
                    <p className="text-sm text-gray-600">
                      Gestionar ventas y pagos
                    </p>
                  </button>
                  <button
                    onClick={() => navigate("/app/dashboard")}
                    className="p-6 border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-left transition-colors"
                  >
                    <BarChart3 size={32} className="text-blue-600 mb-2" />
                    <h3 className="font-semibold text-lg">Dashboard</h3>
                    <p className="text-sm text-gray-600">Reportes y métricas</p>
                  </button>
                  <button
                    onClick={() => navigate("/app/receipts")}
                    className="p-6 border-2 border-orange-600 rounded-lg hover:bg-orange-50 text-left transition-colors"
                  >
                    <Receipt size={32} className="text-orange-600 mb-2" />
                    <h3 className="font-semibold text-lg">Recibos</h3>
                    <p className="text-sm text-gray-600">
                      Generar y gestionar recibos
                    </p>
                  </button>
                  {showCMS && (
                    <button
                      onClick={() => navigate("/app/cms")}
                      className="p-6 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 text-left transition-colors"
                    >
                      <Layout size={32} className="text-indigo-600 mb-2" />
                      <h3 className="font-semibold text-lg">CMS</h3>
                      <p className="text-sm text-gray-600">
                        Gestionar página pública
                      </p>
                    </button>
                  )}
                  {isAdmin() && (
                    <button
                      onClick={() => navigate("/app/users")}
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
            }
          />
          <Route path="/operadores" element={<Operadores />} />
          <Route
            path="/cotizaciones"
            element={
              <Cotizaciones
                onNewCotizacion={() => navigate("/app/cotizaciones/nueva")}
              />
            }
          />
          <Route
            path="/cotizaciones/nueva"
            element={
              <NuevaCotizacion
                onBack={() => navigate("/app/cotizaciones")}
                onSuccess={() => navigate("/app/cotizaciones")}
              />
            }
          />
          <Route
            path="/pipeline"
            element={
              <PipelineKanban
                onNewQuote={() => navigate("/app/cotizaciones/nueva")}
              />
            }
          />
          <Route path="/sales" element={<SalesList />} />
          <Route path="/dashboard" element={<SalesDashboard />} />
          <Route path="/receipts" element={<ReceiptsList />} />
          <Route path="/receipts/wizard" element={<ReceiptWizard />} />
          <Route path="/cms" element={<CMSDashboard />} />
          <Route path="/cms/approvals" element={<ApprovalQueue />} />
          {isAdmin() && <Route path="/users" element={<UserManagement />} />}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => handleNavClick("/app")}
            className={`flex flex-col items-center justify-center py-2 ${location.pathname === "/app" ? "text-primary" : "text-gray-600"}`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Inicio</span>
          </button>
          <button
            onClick={() => handleNavClick("/app/cotizaciones")}
            className={`flex flex-col items-center justify-center py-2 ${isActive("/app/cotizaciones") ? "text-primary" : "text-gray-600"}`}
          >
            <FileText size={20} />
            <span className="text-xs mt-1">Cotiz.</span>
          </button>
          <button
            onClick={() => handleNavClick("/app/pipeline")}
            className={`flex flex-col items-center justify-center py-2 ${isActive("/app/pipeline") ? "text-primary" : "text-gray-600"}`}
          >
            <TrendingUp size={20} />
            <span className="text-xs mt-1">Pipeline</span>
          </button>
          <button
            onClick={() => handleNavClick("/app/sales")}
            className={`flex flex-col items-center justify-center py-2 ${isActive("/app/sales") ? "text-primary" : "text-gray-600"}`}
          >
            <DollarSign size={20} />
            <span className="text-xs mt-1">Ventas</span>
          </button>
          <button
            onClick={() => handleNavClick("/app/dashboard")}
            className={`flex flex-col items-center justify-center py-2 ${isActive("/app/dashboard") ? "text-primary" : "text-gray-600"}`}
          >
            <BarChart3 size={20} />
            <span className="text-xs mt-1">Panel</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app/*" element={<AuthenticatedApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
