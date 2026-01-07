import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Toast from "../components/ui/Toast";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function Operators() {
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    sitio_web: "",
    comision: "",
    notas: "",
  });
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    fetchOperators();
  }, []);

  async function fetchOperators() {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      setOperadores(data || []);
    } catch (error) {
      console.error("Error fetching operadores:", error);
      showToast("Error al cargar operadores", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (editingId) {
        // Actualizar
        const { error } = await supabase
          .from("operadores")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        showToast("Operador actualizado");
      } else {
        // Crear nuevo
        const { error } = await supabase.from("operadores").insert([formData]);

        if (error) throw error;
        showToast("Operador agregado");
      }

      // Reset form
      setFormData({
        nombre: "",
        contacto: "",
        sitio_web: "",
        comision: "",
        notas: "",
      });
      setShowForm(false);
      setEditingId(null);
      fetchOperators();
    } catch (error) {
      console.error("Error saving operador:", error);
      showToast("Error al guardar operador", "error");
    }
  }

  async function handleDelete(id) {
    setDeleteConfirm(id);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;

    try {
      // Soft delete (marcamos como inactivo)
      const { error } = await supabase
        .from("operadores")
        .update({ activo: false })
        .eq("id", deleteConfirm);

      if (error) throw error;
      showToast("Operador eliminado");
      fetchOperators();
    } catch (error) {
      console.error("Error deleting operador:", error);
      showToast("Error al eliminar operador", "error");
    } finally {
      setDeleteConfirm(null);
    }
  }

  function handleEdit(operador) {
    setFormData({
      nombre: operador.nombre,
      contacto: operador.contacto || "",
      sitio_web: operador.sitio_web || "",
      comision: operador.comision || "",
      notas: operador.notas || "",
    });
    setEditingId(operador.id);
    setShowForm(true);
  }

  function handleCancel() {
    setFormData({
      nombre: "",
      contacto: "",
      sitio_web: "",
      comision: "",
      notas: "",
    });
    setShowForm(false);
    setEditingId(null);
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Operadores</h1>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              <Plus size={20} />
              Nuevo Operador
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Editar Operador" : "Nuevo Operador"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: Ruta Maya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contacto
                </label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Teléfono o email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Sitio Web
                </label>
                <input
                  type="url"
                  value={formData.sitio_web}
                  onChange={(e) =>
                    setFormData({ ...formData, sitio_web: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Comisión (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.comision}
                  onChange={(e) =>
                    setFormData({ ...formData, comision: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="10.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
                >
                  {editingId ? "Actualizar" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de operadores */}
        <div className="bg-white rounded-lg shadow">
          {operadores.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay operadores registrados. Agrega el primero.
            </div>
          ) : (
            <div className="divide-y">
              {operadores.map((op) => (
                <div key={op.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{op.nombre}</h3>
                      {op.contacto && (
                        <p className="text-sm text-gray-600">
                          📞 {op.contacto}
                        </p>
                      )}
                      {op.sitio_web && (
                        <a
                          href={op.sitio_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-light hover:underline"
                        >
                          🌐 {op.sitio_web}
                        </a>
                      )}
                      {op.comision && (
                        <p className="text-sm text-gray-600">
                          💰 Comisión: {op.comision}%
                        </p>
                      )}
                      {op.notas && (
                        <p className="text-sm text-gray-500 mt-1">{op.notas}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(op)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(op.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Eliminar Operador"
          message="¿Seguro que quieres eliminar este operador? Esta acción no se puede deshacer."
          variant="danger"
          confirmText="Eliminar"
        />
      </div>
    </div>
  );
}
