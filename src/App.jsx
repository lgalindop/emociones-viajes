import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Operators from "./pages/Operators";
import Quotes from "./pages/Quotes";
import NewQuote from "./pages/NewQuote";
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
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import HomeDashboard from "./pages/HomeDashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import DesktopNav from "./components/navigation/DesktopNav";
import MobileHeader from "./components/navigation/MobileHeader";
import MobileBottomNav from "./components/navigation/MobileBottomNav";
import { LanguageProvider } from "./contexts/LanguageContext";
import AuthProvider from "./components/providers/AuthProvider";
import { useAuth } from "./hooks/useAuth";

function DeactivatedAccount({ onSignOut }) {
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
          onClick={onSignOut}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isSuperAdmin, canManageUsers } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (profile && !profile.is_active) {
    return <DeactivatedAccount onSignOut={signOut} />;
  }

  function handleNavClick(path) {
    navigate(path);
    setMobileMenuOpen(false);
  }

  const showCMS = profile?.content_manager || isSuperAdmin();
  const userName = profile?.full_name || user?.email;

  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopNav
        user={user}
        profile={profile}
        currentPath={location.pathname}
        onNavigate={handleNavClick}
        onSignOut={signOut}
        showCMS={showCMS}
        canManageUsers={canManageUsers()}
      />

      <MobileHeader
        user={user}
        profile={profile}
        currentPath={location.pathname}
        mobileMenuOpen={mobileMenuOpen}
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        onNavigate={handleNavClick}
        onSignOut={signOut}
        showCMS={showCMS}
        canManageUsers={canManageUsers()}
      />

      <main className="pb-20 md:pb-0">
        <Routes>
          <Route
            path="/"
            element={
              <HomeDashboard
                userName={userName}
                onNavigate={navigate}
                showCMS={showCMS}
                canManageUsers={canManageUsers()}
              />
            }
          />
          <Route path="/operadores" element={<Operators />} />
          <Route
            path="/cotizaciones"
            element={
              <Quotes onNewQuote={() => navigate("/app/cotizaciones/nueva")} />
            }
          />
          <Route
            path="/cotizaciones/:id"
            element={
              <Quotes
                onNewQuote={() => navigate("/app/cotizaciones/nueva")}
                initialQuoteId={location.pathname.split("/").pop()}
              />
            }
          />
          <Route
            path="/cotizaciones/nueva"
            element={
              <NewQuote
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
          <Route path="/grupos" element={<Groups />} />
          <Route path="/grupos/:id" element={<GroupDetails />} />
          <Route
            path="/clientes"
            element={
              <Customers
                onViewDetails={(id) => navigate(`/app/customers/${id}`)}
              />
            }
          />
          <Route
            path="/customers/:id"
            element={
              <CustomerDetails
                clienteId={location.pathname.split("/").pop()}
                onBack={() => navigate("/app/clientes")}
                onNavigateToQuote={(id) => navigate(`/app/cotizaciones/${id}`)}
                onNavigateToSale={(id) => navigate(`/app/sales/${id}`)}
                onNavigateToCliente={(id) => navigate(`/app/customers/${id}`)}
              />
            }
          />
          <Route
            path="/hoteles"
            element={
              <Hotels onViewDetails={(id) => navigate(`/app/hoteles/${id}`)} />
            }
          />
          <Route
            path="/hoteles/:id"
            element={
              <HotelDetails
                hotelId={location.pathname.split("/").pop()}
                onBack={() => navigate("/app/hoteles")}
              />
            }
          />
          <Route path="/dashboard" element={<SalesDashboard />} />
          <Route path="/receipts" element={<ReceiptsList />} />
          <Route path="/receipts/wizard" element={<ReceiptWizard />} />
          <Route path="/cms" element={<CMSDashboard />} />
          <Route path="/cms/approvals" element={<ApprovalQueue />} />
          {canManageUsers() && (
            <Route path="/users" element={<UserManagement />} />
          )}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>

      <MobileBottomNav
        onNavigate={handleNavClick}
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        currentPath={location.pathname}
      />
    </div>
  );
}

function AuthenticatedApp() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (profile?.requires_password_reset) {
    return <Login forcePasswordReset={true} />;
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
