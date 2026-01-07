import { useState } from "react";
import PropTypes from "prop-types";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Toast from "../components/ui/Toast";
import PromptDialog from "../components/ui/PromptDialog";

export default function Login({ forcePasswordReset = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  // Derive requiresReset and userId from props and user context
  const [localRequiresReset, setLocalRequiresReset] = useState(false);
  const [localUserId, setLocalUserId] = useState(null);

  // Determine if password reset is required
  const requiresReset = forcePasswordReset || localRequiresReset;
  const userId = forcePasswordReset ? user?.id : localUserId;

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if password reset is required
      const { data: profile, error: _profileError } = await supabase
        .from("profiles")
        .select("requires_password_reset")
        .eq("id", data.user.id)
        .single();

      if (profile?.requires_password_reset) {
        setLocalRequiresReset(true);
        setLocalUserId(data.user.id);
        setLoading(false);
        return;
      } else {
        navigate("/app");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Ensure userId is available
    if (!userId) {
      setError("Error: Usuario no identificado. Intenta cerrar sesión y volver a iniciar.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      setError("La contraseña debe tener al menos 8 caracteres y 1 número");
      setLoading(false);
      return;
    }

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ requires_password_reset: false })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Show success message
      setToast({ message: "Contraseña actualizada exitosamente", type: "success" });

      // Refresh the profile in AuthProvider so it sees requires_password_reset: false
      await refreshProfile();

      // Small delay before redirect for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      navigate("/app");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (requiresReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Cambiar Contraseña
            </h1>
            <p className="text-gray-600">
              Debes cambiar tu contraseña antes de continuar
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Mínimo 8 caracteres, 1 número"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Repite la contraseña"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !userId}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {loading ? "Actualizando..." : !userId ? "Cargando..." : "Actualizar Contraseña"}
            </button>
          </form>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Emociones Viajes
          </h1>
          <p className="text-gray-600">Sistema de Gestión de Cotizaciones</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PromptDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onSubmit={async (emailInput) => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(
              emailInput,
              {
                redirectTo: window.location.origin + "/app",
              }
            );
            if (error) throw error;
            setToast({
              message: "Email de recuperación enviado. Revisa tu bandeja de entrada.",
              type: "success",
            });
          } catch (err) {
            setToast({
              message: "Error: " + err.message,
              type: "error",
            });
          }
        }}
        title="Recuperar Contraseña"
        message="Ingresa tu email para recibir un enlace de recuperación:"
        placeholder="tu@email.com"
        inputType="email"
        submitText="Enviar"
      />
    </div>
  );
}

Login.propTypes = {
  forcePasswordReset: PropTypes.bool,
};
