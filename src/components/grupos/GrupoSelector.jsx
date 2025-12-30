import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Plus } from "lucide-react";
import GrupoModal from "./GrupoModal";

export default function GrupoSelector({ value, onChange, inline = false }) {
  const [grupos, setGrupos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrupos();
  }, []);

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase
        .from("grupos")
        .select("id, nombre, tipo")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const tipoLabels = {
    boda: "Boda",
    torneo: "Torneo",
    corporativo: "Corporativo",
    otro: "Otro",
  };

  if (inline) {
    return (
      <div className="flex gap-2">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={loading}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
        >
          <option value="">Sin grupo</option>
          {grupos.map((grupo) => (
            <option key={grupo.id} value={grupo.id}>
              {grupo.nombre} ({tipoLabels[grupo.tipo]})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10"
          title="Crear nuevo grupo"
        >
          <Plus size={20} />
        </button>

        {showModal && (
          <GrupoModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              fetchGrupos();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Asignar a Grupo (opcional)
        </label>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Plus size={14} />
          Crear grupo
        </button>
      </div>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={loading}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
      >
        <option value="">Sin grupo</option>
        {grupos.map((grupo) => (
          <option key={grupo.id} value={grupo.id}>
            {grupo.nombre} ({tipoLabels[grupo.tipo]})
          </option>
        ))}
      </select>

      <p className="text-xs text-gray-500 mt-1">
        Agrupa cotizaciones/ventas relacionadas (bodas, torneos, corporativos)
      </p>

      {showModal && (
        <GrupoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchGrupos();
          }}
        />
      )}
    </div>
  );
}
