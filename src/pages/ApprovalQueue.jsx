import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Check, X, Eye, ArrowLeft } from "lucide-react";
import Toast from "../components/ui/Toast";

// Sanitize user content to prevent XSS attacks
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize URL to prevent javascript: protocol attacks
function sanitizeUrl(url) {
  if (!url) return "";
  const trimmed = String(url).trim();
  // Only allow http, https, and data URLs for images
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  return "";
}

export default function ApprovalQueue() {
  const [pending, setPending] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [toast, setToast] = useState(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/app");
      return;
    }
    fetchPending();
  }, [isAdmin]);

  async function fetchPending() {
    const { data } = await supabase
      .from("landing_page_content")
      .select("*")
      .eq("status", "pending")
      .order("updated_at", { ascending: false });

    setPending(data || []);

    // Fetch creator profiles (filter out null values from deleted users)
    const userIds = [...new Set(data?.map((d) => d.created_by).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = {};
      profileData?.forEach((p) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
    }
  }

  async function approve(item) {
    // Archive current published version
    const { data: current } = await supabase
      .from("landing_page_content")
      .select("*")
      .eq("section", item.section)
      .eq("status", "published")
      .single();

    if (current) {
      await supabase
        .from("landing_page_content")
        .update({ status: "archived" })
        .eq("id", current.id);
    }

    // Publish pending
    const { error } = await supabase
      .from("landing_page_content")
      .update({
        status: "published",
        approved_by: (await supabase.auth.getUser()).data.user.id,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setToast({ message: "Error aprobando: " + error.message, type: "error" });
      return;
    }

    setToast({ message: "Cambios publicados", type: "success" });
    fetchPending();
  }

  async function reject(item) {
    const reason = prompt("Razón de rechazo:");
    if (!reason) return;

    const { error } = await supabase
      .from("landing_page_content")
      .update({
        status: "draft",
        rejection_reason: reason,
      })
      .eq("id", item.id);

    if (error) {
      setToast({ message: "Error rechazando: " + error.message, type: "error" });
      return;
    }

    setToast({ message: "Cambios rechazados", type: "info" });
    fetchPending();
  }

  const sectionLabels = {
    hero: "Hero Banner",
    deals: "Ofertas y Promociones",
    destinations: "Destinos Destacados",
    gallery: "Galería de Flyers",
  };

  function renderPreview(section, content) {
    switch (section) {
      case "hero":
        return `
          <div style="position: relative; height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 20px;">
            ${sanitizeUrl(content.image_url) ? `<img src="${sanitizeUrl(content.image_url)}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : ""}
            <div style="position: relative; z-index: 10;">
              <h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem;">${escapeHtml(content.headline) || "Sin título"}</h2>
              <p style="font-size: 1.2rem; margin-bottom: 1.5rem;">${escapeHtml(content.subheadline)}</p>
              <button style="background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600;">${escapeHtml(content.cta_text) || "Botón"}</button>
            </div>
          </div>
        `;
      case "deals":
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            ${content.deals?.map(deal => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                ${sanitizeUrl(deal.image_url) ? `<img src="${sanitizeUrl(deal.image_url)}" style="width: 100%; height: 150px; object-fit: cover;">` : ""}
                <div style="padding: 15px;">
                  <h3 style="font-weight: bold; margin-bottom: 8px;">${escapeHtml(deal.title)}</h3>
                  <p style="color: #6b7280; font-size: 0.9rem;">${escapeHtml(deal.description)}</p>
                  ${deal.discount_percent ? `<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; display: inline-block; margin-top: 8px;">${escapeHtml(deal.discount_percent)}% OFF</span>` : ""}
                </div>
              </div>
            `).join("") || "<p>No hay ofertas</p>"}
          </div>
        `;
      case "destinations":
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${content.destinations?.map(dest => `
              <div style="position: relative; border-radius: 8px; overflow: hidden; height: 200px;">
                ${sanitizeUrl(dest.image_url) ? `<img src="${sanitizeUrl(dest.image_url)}" style="width: 100%; height: 100%; object-fit: cover;">` : ""}
                <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 15px; color: white;">
                  <h3 style="font-weight: bold; font-size: 1.2rem;">${escapeHtml(dest.name)}</h3>
                  <p style="font-size: 0.9rem;">${escapeHtml(dest.description)}</p>
                  ${dest.starting_price ? `<p style="font-size: 0.85rem; margin-top: 4px;">Desde $${escapeHtml(dest.starting_price.toLocaleString())} MXN</p>` : ""}
                </div>
              </div>
            `).join("") || "<p>No hay destinos</p>"}
          </div>
        `;
      case "gallery":
        return `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${content.flyers?.map(flyer => `
              <div style="border-radius: 8px; overflow: hidden;">
                ${sanitizeUrl(flyer.image_url) ? `<img src="${sanitizeUrl(flyer.image_url)}" style="width: 100%; height: auto;">` : ""}
                <p style="padding: 8px; text-align: center; font-size: 0.9rem;">${escapeHtml(flyer.title)}</p>
              </div>
            `).join("") || "<p>No hay flyers</p>"}
          </div>
        `;
      default:
        return `<pre>${escapeHtml(JSON.stringify(content, null, 2))}</pre>`;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/app/cms")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Volver al CMS
          </button>
          <div>
            <h1 className="text-3xl font-bold">Cola de Aprobación</h1>
            <p className="text-gray-600">{pending.length} cambios pendientes</p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              No hay cambios pendientes de aprobación
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => {
              const creator = profiles[item.created_by];
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {sectionLabels[item.section] || item.section}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Por {item.created_by ? (creator?.full_name || creator?.email || "Usuario") : "Usuario eliminado"}{" "}
                        •{" "}
                        {new Date(item.updated_at).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Pendiente
                    </span>
                  </div>

                  {item.change_notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-1">
                        Notas de cambio:
                      </div>
                      <div className="text-sm text-blue-800">
                        {item.change_notes}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Resumen de cambios:
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(item.content, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        // Create temporary preview by showing content
                        const previewWindow = window.open("", "_blank");
                        if (previewWindow) {
                          const safeTitle = escapeHtml(sectionLabels[item.section] || item.section);
                          const safeNotes = item.change_notes ? escapeHtml(item.change_notes) : "";
                          previewWindow.document.write(`
                            <html>
                              <head>
                                <title>Preview - ${safeTitle}</title>
                                <style>
                                  body { font-family: system-ui; padding: 20px; background: #f3f4f6; }
                                  .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                                  h1 { color: #667eea; margin-bottom: 20px; }
                                  pre { background: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
                                  img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                  <h1>Vista Previa: ${safeTitle}</h1>
                                  <p><strong>Estado:</strong> Pendiente de aprobación</p>
                                  ${safeNotes ? `<p><strong>Notas:</strong> ${safeNotes}</p>` : ""}
                                  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                                  ${renderPreview(item.section, item.content)}
                                </div>
                              </body>
                            </html>
                          `);
                          previewWindow.document.close();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Eye size={18} />
                      Vista Previa
                    </button>
                    <button
                      onClick={() => approve(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex-1"
                    >
                      <Check size={18} />
                      Aprobar y Publicar
                    </button>
                    <button
                      onClick={() => reject(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X size={18} />
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
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
