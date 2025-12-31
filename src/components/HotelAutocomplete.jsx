import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Plus, X } from "lucide-react";

export default function HotelAutocomplete({ value, onChange }) {
  const [hoteles, setHoteles] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newHotelName, setNewHotelName] = useState("");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter hotels based on input value
  const filteredHoteles = value
    ? hoteles.filter((h) =>
        h.nombre.toLowerCase().includes(value.toLowerCase())
      )
    : hoteles;

  useEffect(() => {
    async function loadHoteles() {
      const { data, error } = await supabase
        .from("hoteles")
        .select("*")
        .order("nombre");

      if (!error && data) {
        setHoteles(data);
      }
    }

    loadHoteles();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleAddNewHotel() {
    if (!newHotelName.trim()) return;

    const { data, error } = await supabase
      .from("hoteles")
      .insert({ nombre: newHotelName.trim() })
      .select()
      .single();

    if (error) {
      alert("Error al agregar hotel: " + error.message);
      return;
    }

    // Update local list (sorting will happen automatically in the computed filteredHoteles)
    const updatedHoteles = [...hoteles, data].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
    setHoteles(updatedHoteles);

    // Select the new hotel
    onChange(data.nombre, data.id);

    // Reset
    setNewHotelName("");
    setShowAddNew(false);
    setShowDropdown(false);
  }

  function handleSelectHotel(hotel) {
    onChange(hotel.nombre, hotel.id);
    setShowDropdown(false);
  }

  function handleInputChange(e) {
    const newValue = e.target.value;
    onChange(newValue, null); // Clear hotel_id when typing manually
    setShowDropdown(true);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={value || ""}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
        placeholder="Nombre del hotel"
      />

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {/* Existing hotels */}
          {filteredHoteles.length > 0 ? (
            filteredHoteles.map((hotel) => (
              <div
                key={hotel.id}
                onClick={() => handleSelectHotel(hotel)}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
              >
                {hotel.nombre}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No se encontraron hoteles
            </div>
          )}

          {/* Add new hotel button */}
          {!showAddNew ? (
            <div
              onClick={() => setShowAddNew(true)}
              className="px-4 py-2 bg-green-50 hover:bg-green-100 cursor-pointer flex items-center gap-2 text-green-700 font-semibold sticky bottom-0 border-t-2 border-green-200"
            >
              <Plus size={16} />
              Agregar nuevo hotel
            </div>
          ) : (
            <div className="px-4 py-3 bg-green-50 border-t-2 border-green-200 sticky bottom-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddNewHotel();
                  }}
                  className="flex-1 border-2 border-green-300 rounded-lg px-3 py-2"
                  placeholder="Nombre del nuevo hotel"
                  autoFocus
                />
                <button
                  onClick={handleAddNewHotel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => {
                    setShowAddNew(false);
                    setNewHotelName("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
