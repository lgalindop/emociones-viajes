import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Edit, Eye, Send, Save, ArrowLeft } from "lucide-react";
import HeroEditor from "../components/cms/HeroEditor";
import DealsEditor from "../components/cms/DealsEditor";
import DestinationsEditor from "../components/cms/DestinationsEditor";
import GalleryEditor from "../components/cms/GalleryEditor";

export default function CMSDashboard() {
  const [sections, setSections] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState(null);
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.content_manager && !isAdmin()) {
      navigate("/app");
      return;
    }
    fetchSections();
    fetchPendingCount();
  }, [profile, isAdmin]);

  async function fetchSections() {
    const { data } = await supabase
      .from("landing_page_content")
      .select("*")
      .order("section");
    setSections(data || []);
  }

  async function fetchPendingCount() {
    const { count } = await supabase
      .from("landing_page_content")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count || 0);
  }

  function startEdit(section) {
    // Try to find draft first, then published, then use defaults
    const draft = sections.find(
      (s) => s.section === section && s.status === "draft"
    );
    const published = sections.find(
      (s) => s.section === section && s.status === "published"
    );
    const current = draft || published;

    setEditingSection(section);
    setEditContent(current?.content || getDefaultContent(section));
  }

  function getDefaultContent(section) {
    const defaults = {
      hero: {
        image_url: "",
        headline: "",
        subheadline: "",
        cta_text: "Ver Destinos",
        cta_link: "#destinations",
      },
      deals: { deals: [] },
      destinations: { destinations: [] },
      gallery: { flyers: [] },
    };
    return defaults[section] || {};
  }

  async function saveDraft() {
    const existing = sections.find((s) => s.section === editingSection);

    if (existing && existing.status === "pending") {
      alert("Esta sección tiene cambios pendientes de aprobación");
      return;
    }

    // Check if draft already exists for this section
    const existingDraft = sections.find(
      (s) => s.section === editingSection && s.status === "draft"
    );

    let error;
    if (existingDraft) {
      // Update existing draft
      const result = await supabase
        .from("landing_page_content")
        .update({
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDraft.id);
      error = result.error;
    } else {
      // Create new draft
      const result = await supabase.from("landing_page_content").insert({
        section: editingSection,
        content: editContent,
        status: "draft",
        created_by: user.id,
      });
      error = result.error;
    }

    if (error) {
      alert("Error guardando borrador: " + error.message);
      return;
    }

    alert("Borrador guardado");
    setEditingSection(null);
    fetchSections();
  }

  async function submitForApproval() {
    const changeNotes = prompt("Notas de cambio (opcional):");
    if (changeNotes === null) return;

    const existing = sections.find(
      (s) => s.section === editingSection && s.status === "draft"
    );

    if (!existing) {
      alert("Primero guarda como borrador");
      return;
    }

    const { error } = await supabase
      .from("landing_page_content")
      .update({
        status: "pending",
        change_notes: changeNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      alert("Error enviando: " + error.message);
      return;
    }

    alert("Enviado para aprobación");
    setEditingSection(null);
    fetchSections();
    fetchPendingCount();
  }

  function renderEditor() {
    switch (editingSection) {
      case "hero":
        return <HeroEditor content={editContent} onChange={setEditContent} />;
      case "deals":
        return <DealsEditor content={editContent} onChange={setEditContent} />;
      case "destinations":
        return (
          <DestinationsEditor content={editContent} onChange={setEditContent} />
        );
      case "gallery":
        return (
          <GalleryEditor content={editContent} onChange={setEditContent} />
        );
      default:
        return null;
    }
  }

  if (editingSection) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setEditingSection(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              Volver
            </button>
            <div className="flex gap-2">
              <button
                onClick={saveDraft}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Save size={18} />
                Guardar Borrador
              </button>
              <button
                onClick={submitForApproval}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Send size={18} />
                Enviar para Aprobación
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 capitalize">
              Editar {editingSection}
            </h2>
            {renderEditor()}
          </div>
        </div>
      </div>
    );
  }

  const sectionLabels = {
    hero: "Hero Banner",
    deals: "Ofertas y Promociones",
    destinations: "Destinos Destacados",
    gallery: "Galería de Flyers",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">CMS Landing Page</h1>
          <p className="text-gray-600">
            Gestiona el contenido de la página pública
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Publicadas</div>
            <div className="text-2xl font-bold">
              {sections.filter((s) => s.status === "published").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Borradores</div>
            <div className="text-2xl font-bold">
              {sections.filter((s) => s.status === "draft").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
          </div>
          {isAdmin() && (
            <div className="bg-white p-4 rounded-lg shadow">
              <button
                onClick={() => navigate("/app/cms/approvals")}
                className="w-full text-left"
              >
                <div className="text-sm text-gray-600">Cola de Aprobación</div>
                <div className="text-2xl font-bold text-blue-600">
                  {pendingCount} →
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(sectionLabels).map((section) => {
            const published = sections.find(
              (s) => s.section === section && s.status === "published"
            );
            const draft = sections.find(
              (s) => s.section === section && s.status === "draft"
            );
            const pending = sections.find(
              (s) => s.section === section && s.status === "pending"
            );

            return (
              <div key={section} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {sectionLabels[section]}
                  </h3>
                  {pending && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Pendiente
                    </span>
                  )}
                  {draft && !pending && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      Borrador
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {published && (
                    <div className="text-sm text-gray-600">
                      Última actualización:{" "}
                      {new Date(published.updated_at).toLocaleDateString()}
                    </div>
                  )}

                  {draft && (
                    <div className="text-sm text-yellow-600 font-medium mb-2">
                      Tienes cambios en borrador
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(section)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex-1"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    {draft && !pending && (
                      <button
                        onClick={async () => {
                          const changeNotes = prompt(
                            "Notas de cambio (opcional):"
                          );
                          if (changeNotes === null) return;

                          const { error } = await supabase
                            .from("landing_page_content")
                            .update({
                              status: "pending",
                              change_notes: changeNotes,
                              updated_at: new Date().toISOString(),
                            })
                            .eq("id", draft.id);

                          if (error) {
                            alert("Error enviando: " + error.message);
                            return;
                          }

                          alert("Enviado para aprobación");
                          fetchSections();
                          fetchPendingCount();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        title="Enviar para aprobación"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => window.open("/", "_blank")}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
