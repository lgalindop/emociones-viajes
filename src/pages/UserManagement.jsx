import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import Toast from "../components/ui/Toast";
import {
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Key,
  Mail,
  RefreshCw,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function UserManagement() {
  const { isSuperAdmin, isAdmin, profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (isSuperAdmin() || isAdmin()) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId, currentStatus) {
    // Prevent deactivating super_admins
    const user = users.find((u) => u.id === userId);
    if (user.role === "super_admin") {
      showToast("No puedes desactivar un Super Admin", "error");
      return;
    }

    // Admins can't deactivate other admins/super_admins
    if (!isSuperAdmin() && ["admin", "super_admin"].includes(user.role)) {
      showToast("No tienes permiso para modificar este usuario", "error");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      fetchUsers();
      showToast(
        `Usuario ${!currentStatus ? "activado" : "desactivado"} exitosamente`
      );
    } catch (error) {
      console.error("Error updating user:", error);
      showToast("Error al actualizar usuario", "error");
    }
  }

  async function updateUserRole(userId, newRole, currentRole) {
    if (updating) return; // Prevent multiple simultaneous updates

    // Super admin can't be demoted
    if (currentRole === "super_admin") {
      showToast("No puedes cambiar el rol de un Super Admin", "error");
      return;
    }

    // Only super_admin can promote to admin/super_admin
    if (["admin", "super_admin"].includes(newRole) && !isSuperAdmin()) {
      showToast("Solo Super Admins pueden crear Admins", "error");
      return;
    }

    // Admins can't modify other admins
    if (!isSuperAdmin() && currentRole === "admin") {
      showToast("No tienes permiso para modificar este usuario", "error");
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      // Update local state immediately
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      showToast("Rol actualizado exitosamente");
    } catch (error) {
      console.error("Error updating role:", error);
      showToast("Error al actualizar rol: " + error.message, "error");
      // Refetch on error to reset
      fetchUsers();
    } finally {
      setUpdating(false);
    }
  }

  function getRoleBadge(role) {
    const badges = {
      super_admin: "bg-red-100 text-red-800",
      admin: "bg-purple-100 text-purple-800",
      manager: "bg-indigo-100 text-indigo-800",
      agent: "bg-blue-100 text-blue-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return badges[role] || badges.viewer;
  }

  function getRoleLabel(role) {
    const labels = {
      super_admin: "Super Admin",
      admin: "Admin",
      manager: "Manager",
      agent: "Agente",
      viewer: "Visualizador",
    };
    return labels[role] || role;
  }

  function formatDate(dateString) {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function canEditUser(user) {
    if (user.role === "super_admin") return false;
    if (isSuperAdmin()) return true;
    if (isAdmin() && !["admin", "super_admin"].includes(user.role)) return true;
    return false;
  }

  function canDeleteUser(user) {
    // Cannot delete yourself
    if (user.id === profile?.id) return false;
    // Cannot delete super_admin
    if (user.role === "super_admin") return false;
    // Super admins can delete anyone else
    if (isSuperAdmin()) return true;
    // Admins cannot delete other admins
    if (isAdmin() && user.role === "admin") return false;
    // Admins can delete non-admin users
    if (isAdmin()) return true;
    return false;
  }

  async function deleteUser() {
    if (!userToDelete || deleting) return;

    setDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: userToDelete.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error deleting user");
      }

      showToast(result.message || "Usuario eliminado exitosamente");
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Error al eliminar usuario: " + error.message, "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!isSuperAdmin() && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            Solo los administradores pueden acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 mt-1">
              {users.length} usuarios totales
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus size={20} />
            Crear Usuario
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.full_name || "Sin nombre"}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.requires_password_reset && (
                        <div className="text-xs text-orange-600 mt-1">
                          ⚠️ Requiere cambio de contraseña
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {canEditUser(user) ? (
                      <select
                        key={`${user.id}-${user.role}`}
                        value={user.role}
                        disabled={updating}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== user.role) {
                            updateUserRole(user.id, newRole, user.role);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleBadge(user.role)} ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isSuperAdmin() && (
                          <option value="super_admin">Super Admin</option>
                        )}
                        {isSuperAdmin() && <option value="admin">Admin</option>}
                        <option value="manager">Manager</option>
                        <option value="agent">Agente</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.last_login)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canEditUser(user) && (
                        <>
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id, user.is_active)
                            }
                            className="text-gray-600 hover:text-gray-900"
                            title={user.is_active ? "Desactivar" : "Activar"}
                          >
                            {user.is_active ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => setResetPasswordUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Resetear contraseña"
                          >
                            <Key size={18} />
                          </button>
                        </>
                      )}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchUsers();
            }}
            isSuperAdmin={isSuperAdmin()}
            showToast={showToast}
          />
        )}

        {resetPasswordUser && (
          <ResetPasswordModal
            user={resetPasswordUser}
            onClose={() => setResetPasswordUser(null)}
            onSuccess={() => {
              setResetPasswordUser(null);
              fetchUsers();
            }}
            showToast={showToast}
          />
        )}

        <ConfirmDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={deleteUser}
          title="Eliminar Usuario"
          message={userToDelete ? `¿Estás seguro de que deseas eliminar a ${userToDelete.full_name || userToDelete.email}? Esta acción es permanente y no se puede deshacer.` : ""}
          confirmText={deleting ? "Eliminando..." : "Eliminar"}
          cancelText="Cancelar"
          variant="danger"
        />

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, isSuperAdmin, showToast }) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "agent",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function validatePassword(pwd) {
    if (!pwd) {
      return "La contraseña es requerida";
    }
    if (pwd.length < 8) {
      return "Mínimo 8 caracteres";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Debe incluir al menos una minúscula";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Debe incluir al menos una mayúscula";
    }
    if (!/\d/.test(pwd)) {
      return "Debe incluir al menos un número";
    }
    if (!/[^a-zA-Z0-9]/.test(pwd)) {
      return "Debe incluir al menos un símbolo (!@#$%^&*)";
    }
    return "";
  }

  function handlePasswordChange(pwd) {
    setFormData({ ...formData, password: pwd });
    setPasswordError(validatePassword(pwd));
  }

  function generatePassword() {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    let pwd = "";
    // Ensure at least one of each required type
    pwd += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pwd += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Fill rest with random characters
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = pwd.length; i < 12; i++) {
      pwd += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password
    pwd = pwd
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setGeneratedPassword(pwd);
    setFormData({ ...formData, password: pwd });
    setPasswordError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const pwdError = validatePassword(formData.password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    setLoading(true);
    setPasswordError("");

    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Call Edge Function to create user
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.fullName,
            role: formData.role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error creating user");
      }

      showToast(
        `Usuario creado: ${formData.email}. Copia la contraseña del formulario.`,
        "success"
      );

      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      setPasswordError(error.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Crear Nuevo Usuario</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              {isSuperAdmin && <option value="admin">Admin</option>}
              <option value="manager">Manager</option>
              <option value="agent">Agente</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña Temporal *
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Generar
              </button>
            </div>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              className={`w-full border rounded-lg px-3 py-2 font-mono ${
                passwordError && formData.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-primary"
              }`}
              placeholder="Contraseña segura"
            />

            {/* Password Requirements */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    formData.password.length >= 8
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span
                  className={
                    formData.password.length >= 8
                      ? "text-green-700"
                      : "text-gray-500"
                  }
                >
                  Mínimo 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    /[a-z]/.test(formData.password) &&
                    /[A-Z]/.test(formData.password)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span
                  className={
                    /[a-z]/.test(formData.password) &&
                    /[A-Z]/.test(formData.password)
                      ? "text-green-700"
                      : "text-gray-500"
                  }
                >
                  Mayúsculas y minúsculas
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    /\d/.test(formData.password)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span
                  className={
                    /\d/.test(formData.password)
                      ? "text-green-700"
                      : "text-gray-500"
                  }
                >
                  Al menos un número
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    /[^a-zA-Z0-9]/.test(formData.password)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span
                  className={
                    /[^a-zA-Z0-9]/.test(formData.password)
                      ? "text-green-700"
                      : "text-gray-500"
                  }
                >
                  Al menos un símbolo (!@#$%^&*)
                </span>
              </div>
            </div>

            {passwordError && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                {passwordError}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              El usuario deberá cambiarla en su primer inicio de sesión
            </p>
          </div>

          {generatedPassword && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-800 mb-1">
                ⚠️ Contraseña generada:
              </p>
              <p className="font-mono text-sm text-yellow-900">
                {generatedPassword}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Cópiala ahora, no se volverá a mostrar
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSuccess, showToast }) {
  const [mode, setMode] = useState("email"); // 'email' or 'manual'
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    setNewPassword(pwd);
  }

  async function handleEmailReset() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + "/app",
      });

      if (error) throw error;

      showToast(`Email de recuperación enviado a ${user.email}`);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      showToast("Error al enviar email: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualReset() {
    if (!newPassword || newPassword.length < 8 || !/\d/.test(newPassword)) {
      showToast("La contraseña debe tener al menos 8 caracteres y 1 número", "error");
      return;
    }

    setLoading(true);
    try {
      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Call Edge Function to reset password
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/reset-user-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            new_password: newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error resetting password");
      }

      showToast(
        `Contraseña reseteada para ${user.email}. Copia la contraseña antes de cerrar.`
      );
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      showToast("Error al resetear contraseña: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Resetear Contraseña</h3>
        <p className="text-sm text-gray-600 mb-4">
          Usuario: <span className="font-semibold">{user.email}</span>
        </p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("email")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              mode === "email"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Mail size={16} className="inline mr-2" />
            Por Email
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              mode === "manual"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Key size={16} className="inline mr-2" />
            Manual
          </button>
        </div>

        {mode === "email" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Se enviará un email con un link de recuperación a{" "}
              <span className="font-semibold">{user.email}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmailReset}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Email"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Nueva Contraseña
                </label>
                <button
                  onClick={generatePassword}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Generar
                </button>
              </div>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 font-mono"
                placeholder="Mín. 8 caracteres, 1 número"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualReset}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Reseteando..." : "Resetear"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
