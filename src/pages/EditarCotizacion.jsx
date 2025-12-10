// pages/EditarCotizacion.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function EditarCotizacion({ cotizacion, onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_email: "",
    destino: "",
    fecha_salida: "",
    fecha_regreso: "",
    num_adultos: 1,
    num_ninos: 0,
    presupuesto_aprox: "",
    requerimientos: "",
    notas: "",
    divisa: "MXN",
    estatus: "nueva",
  });

  const [opciones, setOpciones] = useState([]);

  useEffect(() => {
    if (!cotizacion) return;
    setFormData({
      cliente_nombre: cotizacion.cliente_nombre || "",
      cliente_telefono: cotizacion.cliente_telefono || "",
      cliente_email: cotizacion.cliente_email || "",
      destino: cotizacion.destino || "",
      fecha_salida: cotizacion.fecha_salida || "",
      fecha_regreso: cotizacion.fecha_regreso || "",
      num_adultos: cotizacion.num_adultos || 1,
      num_ninos: cotizacion.num_ninos || 0,
      presupuesto_aprox: cotizacion.presupuesto_aprox || "",
      requerimientos: cotizacion.requerimientos || "",
      notas: cotizacion.notas || "",
      divisa: cotizacion.divisa || "MXN",
      estatus: cotizacion.estatus || "nueva",
    });

    if (cotizacion.opciones_cotizacion)
      setOpciones(cotizacion.opciones_cotizacion);
    else fetchOpcionesLocal();
    // eslint-disable-next-line
  }, [cotizacion]);

  async function fetchOpcionesLocal() {
    if (!cotizacion?.id) return;
    const { data } = await supabase
      .from("opciones_cotizacion")
      .select("*")
      .eq("cotizacion_id", cotizacion.id);
    setOpciones(data || []);
  }

  async function guardarCotizacion(e) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("cotizaciones")
        .update(formData)
        .eq("id", cotizacion.id);
      if (error) throw error;
      alert("Cotización actualizada");
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      alert("Error guardando cotización");
    }
  }

  async function guardarOpciones() {
    try {
      // actualizar cada opcion por id
      for (const op of opciones) {
        if (!op.id) continue;
        const { error } = await supabase
          .from("opciones_cotizacion")
          .update({
            nombre_paquete: op.nombre_paquete,
            precio_por_persona: parseFloat(op.precio_por_persona) || 0,
            precio_total: parseFloat(op.precio_total) || 0,
            disponibilidad: op.disponibilidad || "",
            notas: op.notas || "",
            link_paquete: op.link_paquete || "",
          })
          .eq("id", op.id);
        if (error) throw error;
      }
      alert("Opciones guardadas");
    } catch (err) {
      console.error(err);
      alert("Error guardando opciones");
    }
  }

  function updateOption(index, field, value) {
    const copy = [...opciones];
    copy[index] = { ...copy[index], [field]: value };
    setOpciones(copy);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900"
      >
        ← Volver
      </button>
      <h1 className="text-2xl font-bold mb-4">Editar Cotización</h1>

      <form onSubmit={guardarCotizacion} className="space-y-4">
        <div className="bg-white rounded p-4">
          <h2 className="font-semibold mb-2">Cliente</h2>
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            value={formData.cliente_nombre}
            onChange={(e) =>
              setFormData({ ...formData, cliente_nombre: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded px-3 py-2"
              value={formData.cliente_telefono}
              onChange={(e) =>
                setFormData({ ...formData, cliente_telefono: e.target.value })
              }
            />
            <input
              className="border rounded px-3 py-2"
              value={formData.cliente_email}
              onChange={(e) =>
                setFormData({ ...formData, cliente_email: e.target.value })
              }
            />
          </div>
        </div>

        <div className="bg-white rounded p-4">
          <h2 className="font-semibold mb-2">Viaje</h2>
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            value={formData.destino}
            onChange={(e) =>
              setFormData({ ...formData, destino: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={formData.fecha_salida}
              onChange={(e) =>
                setFormData({ ...formData, fecha_salida: e.target.value })
              }
            />
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={formData.fecha_regreso}
              onChange={(e) =>
                setFormData({ ...formData, fecha_regreso: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              className="border rounded px-3 py-2"
              value={formData.num_adultos}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  num_adultos: parseInt(e.target.value),
                })
              }
            />
            <input
              type="number"
              className="border rounded px-3 py-2"
              value={formData.num_ninos}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  num_ninos: parseInt(e.target.value),
                })
              }
            />
            <select
              className="border rounded px-3 py-2"
              value={formData.divisa}
              onChange={(e) =>
                setFormData({ ...formData, divisa: e.target.value })
              }
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded p-4">
          <h2 className="font-semibold mb-2">Opciones</h2>
          {opciones.length === 0 && (
            <p className="text-sm text-gray-500">No hay opciones</p>
          )}
          {opciones.map((op, i) => (
            <div key={op.id || op.temp_id} className="border rounded p-3 mb-3">
              <input
                className="w-full border rounded px-3 py-2 mb-2"
                value={op.nombre_paquete || ""}
                onChange={(e) =>
                  updateOption(i, "nombre_paquete", e.target.value)
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="border rounded px-3 py-2"
                  value={op.precio_total || ""}
                  onChange={(e) =>
                    updateOption(i, "precio_total", e.target.value)
                  }
                />
                <input
                  className="border rounded px-3 py-2"
                  value={op.precio_por_persona || ""}
                  onChange={(e) =>
                    updateOption(i, "precio_por_persona", e.target.value)
                  }
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardarOpciones}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              Guardar Opciones
            </button>
          </div>
        </div>

        <div className="bg-white rounded p-4">
          <h2 className="font-semibold mb-2">Notas</h2>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={formData.notas}
            onChange={(e) =>
              setFormData({ ...formData, notas: e.target.value })
            }
          ></textarea>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Guardar Cotización
          </button>
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
