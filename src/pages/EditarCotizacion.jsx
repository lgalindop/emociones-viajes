import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function EditarCotizacion({ cotizacion, onBack, onSuccess }) {
  const { user, profile, isAdmin } = useAuth();
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
    fecha_registro: "",
    fecha_reserva: "",
    vigente_hasta: "",
  });

  const [opciones, setOpciones] = useState([]);
  const [editingOpcionId, setEditingOpcionId] = useState(null);

  useEffect(() => {
    if (!canEditThis()) {
      alert("No tienes permisos para editar esta cotización");
      onBack();
      return;
    }

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
      fecha_registro: cotizacion.fecha_registro || "",
      fecha_reserva: cotizacion.fecha_reserva || "",
      vigente_hasta: cotizacion.vigente_hasta || "",
    });

    if (cotizacion.opciones_cotizacion)
      setOpciones(cotizacion.opciones_cotizacion);
    else fetchOpcionesLocal();
    // eslint-disable-next-line
  }, [cotizacion]);

  function canEditThis() {
    if (!cotizacion || !user || !profile) return false;
    if (isAdmin()) return true;
    if (profile.role === "agent" && cotizacion.created_by === user.id)
      return true;
    return false;
  }

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

    if (!canEditThis()) {
      alert("No tienes permisos para editar esta cotización");
      return;
    }

    try {
      const { error } = await supabase
        .from("cotizaciones")
        .update({
          ...formData,
          fecha_salida: formData.fecha_salida
            ? formData.fecha_salida + "T12:00:00"
            : null,
          fecha_regreso: formData.fecha_regreso
            ? formData.fecha_regreso + "T12:00:00"
            : null,
          fecha_registro: formData.fecha_registro
            ? formData.fecha_registro + "T12:00:00"
            : null,
          fecha_reserva: formData.fecha_reserva
            ? formData.fecha_reserva + "T12:00:00"
            : null,
        })
        .eq("id", cotizacion.id);

      if (error) {
        if (error.code === "42501" || error.message.includes("policy")) {
          alert("Error: No tienes permisos para editar esta cotización");
          onBack();
          return;
        }
        throw error;
      }

      alert("Cotización actualizada exitosamente");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error guardando cotización:", err);
      alert("Error guardando cotización: " + err.message);
    }
  }

  async function guardarOpcion(opcion) {
    if (!canEditThis()) {
      alert("No tienes permisos para editar esta cotización");
      return;
    }

    try {
      if (!opcion.id) return;

      const { error } = await supabase
        .from("opciones_cotizacion")
        .update({
          nombre_paquete: opcion.nombre_paquete,
          servicio_descripcion: opcion.servicio_descripcion,
          hotel_nombre: opcion.hotel_nombre,
          ocupacion: opcion.ocupacion,
          vuelo_ida_fecha: opcion.vuelo_ida_fecha
            ? opcion.vuelo_ida_fecha + "T12:00:00"
            : null,
          vuelo_ida_horario: opcion.vuelo_ida_horario,
          vuelo_ida_ruta: opcion.vuelo_ida_ruta,
          vuelo_regreso_fecha: opcion.vuelo_regreso_fecha
            ? opcion.vuelo_regreso_fecha + "T12:00:00"
            : null,
          vuelo_regreso_horario: opcion.vuelo_regreso_horario,
          vuelo_regreso_ruta: opcion.vuelo_regreso_ruta,
          precio_por_persona: parseFloat(opcion.precio_por_persona) || 0,
          precio_total: parseFloat(opcion.precio_total) || 0,
          disponibilidad: opcion.disponibilidad || "",
          incluye: opcion.incluye || "",
          notas: opcion.notas || "",
          link_paquete: opcion.link_paquete || "",
          tour_link: opcion.tour_link || "",
        })
        .eq("id", opcion.id);

      if (error) {
        if (error.code === "42501" || error.message.includes("policy")) {
          alert("Error: No tienes permisos para editar esta cotización");
          return;
        }
        throw error;
      }

      alert("Opción guardada exitosamente");
      setEditingOpcionId(null);
      fetchOpcionesLocal();
    } catch (err) {
      console.error("Error guardando opción:", err);
      alert("Error guardando opción: " + err.message);
    }
  }

  function updateOption(index, field, value) {
    const copy = [...opciones];
    copy[index] = { ...copy[index], [field]: value };
    setOpciones(copy);
  }

  if (!canEditThis()) {
    return null;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900"
      >
        ← Volver
      </button>
      <h1 className="text-2xl font-bold mb-4">Editar Cotización</h1>

      <form onSubmit={guardarCotizacion} className="space-y-4">
        {/* Cliente */}
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-semibold mb-3 text-lg">
            Información del Cliente
          </h2>
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            value={formData.cliente_nombre}
            onChange={(e) =>
              setFormData({ ...formData, cliente_nombre: e.target.value })
            }
            placeholder="Nombre del cliente"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded px-3 py-2"
              value={formData.cliente_telefono}
              onChange={(e) =>
                setFormData({ ...formData, cliente_telefono: e.target.value })
              }
              placeholder="Teléfono"
            />
            <input
              className="border rounded px-3 py-2"
              value={formData.cliente_email}
              onChange={(e) =>
                setFormData({ ...formData, cliente_email: e.target.value })
              }
              placeholder="Email"
            />
          </div>
        </div>

        {/* Fechas de Cotización */}
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-semibold mb-3 text-lg">Fechas de Cotización</h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Fecha Registro
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.fecha_registro}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_registro: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Fecha Reserva
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.fecha_reserva}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_reserva: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Vigente Hasta
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.vigente_hasta}
                onChange={(e) =>
                  setFormData({ ...formData, vigente_hasta: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Viaje */}
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-semibold mb-3 text-lg">Detalles del Viaje</h2>
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            value={formData.destino}
            onChange={(e) =>
              setFormData({ ...formData, destino: e.target.value })
            }
            placeholder="Destino"
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Fecha Salida
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.fecha_salida}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_salida: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Fecha Regreso
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.fecha_regreso}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_regreso: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Adultos
              </label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={formData.num_adultos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    num_adultos: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Niños</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={formData.num_ninos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    num_ninos: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Presupuesto Aprox.
              </label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={formData.presupuesto_aprox}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    presupuesto_aprox: e.target.value,
                  })
                }
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Divisa</label>
              <select
                className="w-full border rounded px-3 py-2"
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
        </div>

        {/* Estatus */}
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-semibold mb-3 text-lg">Estatus</h2>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.estatus}
            onChange={(e) =>
              setFormData({ ...formData, estatus: e.target.value })
            }
          >
            <option value="nueva">Nueva</option>
            <option value="enviada">Enviada</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="cerrada">Cerrada</option>
            <option value="perdida">Perdida</option>
          </select>
        </div>

        {/* Opciones de Paquetes */}
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-semibold mb-3 text-lg">Opciones de Paquetes</h2>
          {opciones.length === 0 && (
            <p className="text-sm text-gray-500">No hay opciones</p>
          )}
          {opciones.map((op, i) => (
            <div
              key={op.id || op.temp_id}
              className="border rounded p-4 mb-4 bg-gray-50"
            >
              {editingOpcionId === op.id ? (
                // EDIT MODE
                <div className="space-y-3">
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={op.nombre_paquete || ""}
                    onChange={(e) =>
                      updateOption(i, "nombre_paquete", e.target.value)
                    }
                    placeholder="Nombre del paquete"
                  />

                  <textarea
                    className="w-full border rounded px-3 py-2"
                    value={op.servicio_descripcion || ""}
                    onChange={(e) =>
                      updateOption(i, "servicio_descripcion", e.target.value)
                    }
                    placeholder="Descripción del servicio"
                    rows="2"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="border rounded px-3 py-2"
                      value={op.hotel_nombre || ""}
                      onChange={(e) =>
                        updateOption(i, "hotel_nombre", e.target.value)
                      }
                      placeholder="Hotel"
                    />
                    <input
                      className="border rounded px-3 py-2"
                      value={op.ocupacion || ""}
                      onChange={(e) =>
                        updateOption(i, "ocupacion", e.target.value)
                      }
                      placeholder="Ocupación"
                    />
                  </div>

                  <div className="bg-white p-3 rounded">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Vuelo de Ida
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="date"
                        className="border rounded px-3 py-2"
                        value={op.vuelo_ida_fecha || ""}
                        onChange={(e) =>
                          updateOption(i, "vuelo_ida_fecha", e.target.value)
                        }
                      />
                      <input
                        className="border rounded px-3 py-2"
                        value={op.vuelo_ida_horario || ""}
                        onChange={(e) =>
                          updateOption(i, "vuelo_ida_horario", e.target.value)
                        }
                        placeholder="Horario"
                      />
                      <input
                        className="border rounded px-3 py-2"
                        value={op.vuelo_ida_ruta || ""}
                        onChange={(e) =>
                          updateOption(i, "vuelo_ida_ruta", e.target.value)
                        }
                        placeholder="Ruta"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Vuelo de Regreso
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="date"
                        className="border rounded px-3 py-2"
                        value={op.vuelo_regreso_fecha || ""}
                        onChange={(e) =>
                          updateOption(i, "vuelo_regreso_fecha", e.target.value)
                        }
                      />
                      <input
                        className="border rounded px-3 py-2"
                        value={op.vuelo_regreso_horario || ""}
                        onChange={(e) =>
                          updateOption(
                            i,
                            "vuelo_regreso_horario",
                            e.target.value
                          )
                        }
                        placeholder="Horario"
                      />
                      <input
                        className="border rounded px-3 py-2"
                        value={op.vuelo_regreso_ruta || ""}
                        onChange={(e) =>
                          updateOption(i, "vuelo_regreso_ruta", e.target.value)
                        }
                        placeholder="Ruta"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">
                        Precio Total
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded px-3 py-2"
                        value={op.precio_total || ""}
                        onChange={(e) =>
                          updateOption(i, "precio_total", e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">
                        Por Persona
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded px-3 py-2"
                        value={op.precio_por_persona || ""}
                        onChange={(e) =>
                          updateOption(i, "precio_por_persona", e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <textarea
                    className="w-full border rounded px-3 py-2"
                    value={op.incluye || ""}
                    onChange={(e) => updateOption(i, "incluye", e.target.value)}
                    placeholder="Incluye"
                    rows="2"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="url"
                      className="border rounded px-3 py-2"
                      value={op.link_paquete || ""}
                      onChange={(e) =>
                        updateOption(i, "link_paquete", e.target.value)
                      }
                      placeholder="Link del paquete"
                    />
                    <input
                      type="url"
                      className="border rounded px-3 py-2"
                      value={op.tour_link || ""}
                      onChange={(e) =>
                        updateOption(i, "tour_link", e.target.value)
                      }
                      placeholder="Link de tours"
                    />
                  </div>

                  <input
                    className="w-full border rounded px-3 py-2"
                    value={op.disponibilidad || ""}
                    onChange={(e) =>
                      updateOption(i, "disponibilidad", e.target.value)
                    }
                    placeholder="Disponibilidad"
                  />

                  <textarea
                    className="w-full border rounded px-3 py-2"
                    value={op.notas || ""}
                    onChange={(e) => updateOption(i, "notas", e.target.value)}
                    placeholder="Notas"
                    rows="2"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => guardarOpcion(op)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingOpcionId(null)}
                      className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // VIEW MODE
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-lg">
                      {op.nombre_paquete}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingOpcionId(op.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                  </div>
                  {op.hotel_nombre && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Hotel:</span>{" "}
                      {op.hotel_nombre} {op.ocupacion && `(${op.ocupacion})`}
                    </div>
                  )}
                  {op.vuelo_ida_fecha && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Vuelo Ida:</span>{" "}
                      {op.vuelo_ida_fecha} {op.vuelo_ida_horario}{" "}
                      {op.vuelo_ida_ruta}
                    </div>
                  )}
                  {op.vuelo_regreso_fecha && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Vuelo Regreso:</span>{" "}
                      {op.vuelo_regreso_fecha} {op.vuelo_regreso_horario}{" "}
                      {op.vuelo_regreso_ruta}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Precio Total:</span> $
                    {parseFloat(op.precio_total || 0).toLocaleString("es-MX")}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Notas Generales */}
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-semibold mb-3 text-lg">Notas Generales</h2>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={formData.notas}
            onChange={(e) =>
              setFormData({ ...formData, notas: e.target.value })
            }
            placeholder="Notas adicionales sobre la cotización..."
          ></textarea>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Guardar Cotización
          </button>
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
