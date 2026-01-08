import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Search,
  Plus,
  Building,
  Star,
  Phone,
  Mail,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  X,
  MapPin,
  Globe,
} from "lucide-react";
import HotelQuickCreate from "../components/hotels/HotelQuickCreate";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Toast from "../components/ui/Toast";

const HOTEL_TIPOS = {
  hotel: { label: "Hotel", color: "text-gray-600" },
  resort: { label: "Resort", color: "text-blue-600" },
  boutique: { label: "Boutique", color: "text-purple-600" },
  all_inclusive: { label: "All Inclusive", color: "text-green-600" },
  hostal: { label: "Hostal", color: "text-orange-600" },
  villa: { label: "Villa", color: "text-pink-600" },
};

export default function Hotels({ onViewDetails }) {
  const { canEdit, canDelete } = useAuth();
  const [hoteles, setHoteles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterDestino, setFilterDestino] = useState("");
  const [filterEstrellas, setFilterEstrellas] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, hotel: null });
  const [allDestinos, setAllDestinos] = useState([]);
  const [toast, setToast] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    byTipo: {},
  });

  useEffect(() => {
    fetchHoteles();
  }, [searchQuery, filterTipo, filterDestino, filterEstrellas, sortBy, sortOrder]);

  async function fetchHoteles() {
    setLoading(true);
    try {
      let query = supabase
        .from("hoteles")
        .select("*")
        .eq("is_active", true);

      // Search
      if (searchQuery) {
        query = query.or(
          `nombre.ilike.%${searchQuery}%,destino.ilike.%${searchQuery}%,ciudad.ilike.%${searchQuery}%`
        );
      }

      // Filter by tipo
      if (filterTipo !== "all") {
        query = query.eq("tipo", filterTipo);
      }

      // Filter by destino
      if (filterDestino) {
        query = query.eq("destino", filterDestino);
      }

      // Filter by estrellas
      if (filterEstrellas) {
        query = query.eq("estrellas", parseInt(filterEstrellas));
      }

      // Sort
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setHoteles(data || []);

      // Calculate stats
      const allData = data || [];
      const byTipo = {};
      allData.forEach(h => {
        byTipo[h.tipo || 'hotel'] = (byTipo[h.tipo || 'hotel'] || 0) + 1;
      });
      setStats({
        total: allData.length,
        byTipo,
      });

      // Collect all unique destinos
      const destinos = new Set();
      allData.forEach(h => h.destino && destinos.add(h.destino));
      setAllDestinos([...destinos].sort());
    } catch (error) {
      console.error("Error fetching hoteles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(hotel) {
    try {
      // Soft delete - just set is_active to false
      const { error } = await supabase
        .from("hoteles")
        .update({ is_active: false })
        .eq("id", hotel.id);

      if (error) throw error;

      setToast({ message: "Hotel eliminado correctamente", type: "success" });
      fetchHoteles();
      setDeleteConfirm({ open: false, hotel: null });
    } catch (error) {
      console.error("Error deleting hotel:", error);
      setToast({ message: "Error al eliminar hotel: " + error.message, type: "error" });
    }
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  function renderStars(count) {
    if (!count) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(count)].map((_, i) => (
          <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hoteles</h1>
          <p className="text-gray-600 mt-1">
            Gestión de hoteles y proveedores de hospedaje
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Hoteles</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          {Object.entries(HOTEL_TIPOS).slice(0, 3).map(([tipo, config]) => (
            <div key={tipo} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Building size={16} className={config.color} />
                <p className="text-sm text-gray-500">{config.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.byTipo[tipo] || 0}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, destino o ciudad..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || filterTipo !== "all" || filterDestino || filterEstrellas
                  ? "border-primary text-primary bg-primary/5"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={18} />
              Filtros
              {(filterTipo !== "all" || filterDestino || filterEstrellas) && (
                <span className="w-2 h-2 bg-primary rounded-full" />
              )}
            </button>

            {/* Add Button */}
            {canEdit() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={18} />
                <span className="hidden md:inline">Nuevo Hotel</span>
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
              {/* Tipo Filter */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todos</option>
                  {Object.entries(HOTEL_TIPOS).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Destino Filter */}
              {allDestinos.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Destino</label>
                  <select
                    value={filterDestino}
                    onChange={(e) => setFilterDestino(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Todos</option>
                    {allDestinos.map(destino => (
                      <option key={destino} value={destino}>{destino}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Estrellas Filter */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estrellas</label>
                <select
                  value={filterEstrellas}
                  onChange={(e) => setFilterEstrellas(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Todas</option>
                  <option value="5">5 estrellas</option>
                  <option value="4">4 estrellas</option>
                  <option value="3">3 estrellas</option>
                  <option value="2">2 estrellas</option>
                  <option value="1">1 estrella</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(filterTipo !== "all" || filterDestino || filterEstrellas) && (
                <button
                  onClick={() => {
                    setFilterTipo("all");
                    setFilterDestino("");
                    setFilterEstrellas("");
                  }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 self-end mb-1"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-2 text-gray-500">Cargando hoteles...</p>
            </div>
          ) : hoteles.length === 0 ? (
            <div className="p-8 text-center">
              <Building size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No se encontraron hoteles</p>
              {canEdit() && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-primary hover:text-primary/80 font-medium"
                >
                  + Crear primer hotel
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3">
                      <button
                        onClick={() => handleSort("nombre")}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Hotel
                        <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => handleSort("destino")}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Ubicación
                        <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </span>
                    </th>
                    <th className="text-center px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => handleSort("total_reservaciones")}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                      >
                        Reservas
                        <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hoteles.map((hotel) => (
                    <tr
                      key={hotel.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onViewDetails?.(hotel.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Building size={20} className={HOTEL_TIPOS[hotel.tipo || 'hotel']?.color || 'text-gray-500'} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {hotel.nombre}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {renderStars(hotel.estrellas)}
                              {hotel.tipo && (
                                <span className={`text-xs ${HOTEL_TIPOS[hotel.tipo]?.color || 'text-gray-500'}`}>
                                  {HOTEL_TIPOS[hotel.tipo]?.label || hotel.tipo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-1">
                          {hotel.destino && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin size={14} />
                              {hotel.destino}
                            </div>
                          )}
                          {hotel.ciudad && (
                            <p className="text-xs text-gray-500 ml-5">
                              {hotel.ciudad}{hotel.pais && hotel.pais !== 'México' ? `, ${hotel.pais}` : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="space-y-1">
                          {hotel.telefono_principal && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              {hotel.telefono_principal}
                            </div>
                          )}
                          {hotel.email_reservaciones && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail size={14} />
                              <span className="truncate max-w-[200px]">
                                {hotel.email_reservaciones}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-sm font-medium ${
                          hotel.total_reservaciones > 0
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {hotel.total_reservaciones || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === hotel.id ? null : hotel.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} className="text-gray-500" />
                          </button>

                          {activeMenu === hotel.id && (
                            <div
                              className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  onViewDetails?.(hotel.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye size={16} />
                                Ver detalles
                              </button>
                              {canEdit() && (
                                <button
                                  onClick={() => {
                                    onViewDetails?.(hotel.id, { edit: true });
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit size={16} />
                                  Editar
                                </button>
                              )}
                              {hotel.website && (
                                <a
                                  href={hotel.website.startsWith('http') ? hotel.website : `https://${hotel.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Globe size={16} />
                                  Sitio web
                                </a>
                              )}
                              {canDelete() && (
                                <>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button
                                    onClick={() => {
                                      setDeleteConfirm({ open: true, hotel });
                                      setActiveMenu(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={16} />
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Click outside to close menu */}
        {activeMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setActiveMenu(null)}
          />
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <HotelQuickCreate
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newHotel) => {
            fetchHoteles();
            onViewDetails?.(newHotel.id);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, hotel: null })}
        onConfirm={() => handleDelete(deleteConfirm.hotel)}
        title="Eliminar Hotel"
        message={`¿Estás seguro de eliminar "${deleteConfirm.hotel?.nombre}"? Esta acción se puede revertir.`}
        confirmText="Eliminar"
        variant="danger"
      />

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
