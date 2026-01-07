/**
 * Get the CSS classes for a role badge based on the user's role
 * @param {string} role - The user's role
 * @returns {string} - Tailwind CSS classes for the badge
 */
export function getRoleBadgeColor(role) {
  const colors = {
    super_admin: "bg-red-100 text-red-800",
    admin: "bg-purple-100 text-purple-800",
    manager: "bg-indigo-100 text-indigo-800",
    agent: "bg-blue-100 text-blue-800",
    viewer: "bg-gray-100 text-gray-800",
  };
  return colors[role] || colors.viewer;
}

/**
 * Get the display label for a user's role
 * @param {string} role - The user's role
 * @returns {string} - Human-readable role label
 */
export function getRoleLabel(role) {
  const labels = {
    super_admin: "Super Admin",
    admin: "Admin",
    manager: "Manager",
    agent: "Agente",
    viewer: "Visualizador",
  };
  return labels[role] || role;
}
