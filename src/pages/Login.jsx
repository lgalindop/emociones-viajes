import { useState } from "react";
import { supabase } from "../lib/supabase";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("signin"); // 'signin' or 'reset'
  const [resetSent, setResetSent] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is active
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_active, role")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error(
          "Tu cuenta ha sido desactivada. Contacta al administrador."
        );
      }

      // Success - the AuthContext will handle the redirect
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">EV</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Emociones Viajes</h1>
          <p className="text-gray-600 mt-2">Sistema de Cotizaciones</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {mode === "signin" ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Iniciar Sesión
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle
                    size={20}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Restablecer Contraseña
              </h2>

              {resetSent ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">
                    ✅ Te hemos enviado un correo con las instrucciones para
                    restablecer tu contraseña.
                  </p>
                  <button
                    onClick={() => {
                      setMode("signin");
                      setResetSent(false);
                    }}
                    className="mt-4 text-sm text-primary hover:underline"
                  >
                    Volver a inicio de sesión
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle
                        size={20}
                        className="text-red-600 flex-shrink-0 mt-0.5"
                      />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-4">
                    Ingresa tu correo electrónico y te enviaremos las
                    instrucciones para restablecer tu contraseña.
                  </p>

                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? "Enviando..." : "Enviar Instrucciones"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="w-full text-sm text-gray-600 hover:text-gray-900"
                    >
                      Volver a inicio de sesión
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 Emociones Viajes. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
