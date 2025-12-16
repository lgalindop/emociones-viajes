import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Phone,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  X,
} from "lucide-react";

export default function LandingPage() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublishedContent();
  }, []);

  async function fetchPublishedContent() {
    const { data } = await supabase
      .from("landing_page_content")
      .select("*")
      .eq("status", "published");

    const contentMap = {};
    data?.forEach((item) => {
      contentMap[item.section] = item.content;
    });

    setContent(contentMap);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  const config = content.config || {};
  const hero = content.hero || {};
  const deals = content.deals?.deals || [];
  const destinations = content.destinations?.destinations || [];
  const flyers = content.gallery?.flyers || [];

  return (
    <div className="min-h-screen">
      {/* Deal Modal */}
      {selectedDeal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDeal(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedDeal.image_url && (
              <div className="relative bg-black">
                <img
                  src={selectedDeal.image_url}
                  alt={selectedDeal.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>
            )}
            {!selectedDeal.image_url && (
              <div className="relative p-6">
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            )}
            <div className="p-6">
              {selectedDeal.discount_percent && (
                <span className="inline-block px-4 py-2 bg-red-500 text-white rounded-full text-lg font-bold mb-4">
                  {selectedDeal.discount_percent}% OFF
                </span>
              )}
              <h2 className="text-3xl font-bold mb-4">{selectedDeal.title}</h2>
              <p className="text-gray-700 text-lg mb-6 whitespace-pre-wrap">
                {selectedDeal.description}
              </p>
              {selectedDeal.valid_until && (
                <p className="text-gray-600 mb-6">
                  Válido hasta:{" "}
                  {new Date(selectedDeal.valid_until).toLocaleDateString(
                    "es-MX",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                {config.whatsapp && (
                  <a
                    href={`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola, me interesa la oferta: ${selectedDeal.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle size={20} />
                    Contactar por WhatsApp
                  </a>
                )}
                {config.phone && (
                  <a
                    href={`tel:${config.phone}`}
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    <Phone size={20} />
                    Llamar Ahora
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-primary">
              {config.company_name || "Emociones Viajes"}
            </span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        className="h-screen bg-cover bg-center flex items-center justify-center text-white relative"
        style={{
          backgroundImage: hero.image_url
            ? `url(${hero.image_url})`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center max-w-4xl px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            {hero.headline || "Descubre el Mundo"}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-8">
            {hero.subheadline || "Paquetes personalizados para toda la familia"}
          </p>
          <a
            href={hero.cta_link || "#destinations"}
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-primary/90 transform hover:scale-105 transition-all"
          >
            {hero.cta_text || "Ver Destinos"}
          </a>
        </div>
      </section>

      {/* Deals Section */}
      {deals.length > 0 && (
        <section id="deals" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Ofertas Especiales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedDeal(deal)}
                >
                  {deal.image_url && (
                    <img
                      src={deal.image_url}
                      alt={deal.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    {deal.discount_percent && (
                      <span className="inline-block px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold mb-2">
                        {deal.discount_percent}% OFF
                      </span>
                    )}
                    <h3 className="text-xl font-bold mb-2">{deal.title}</h3>
                    <p className="text-gray-600 mb-4">{deal.description}</p>
                    {deal.valid_until && (
                      <p className="text-sm text-gray-500 mb-4">
                        Válido hasta:{" "}
                        {new Date(deal.valid_until).toLocaleDateString()}
                      </p>
                    )}
                    <button className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                      Más Información
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Destinations Section */}
      {destinations.length > 0 && (
        <section id="destinations" className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Destinos Populares
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {destinations.map((dest) => (
                <div
                  key={dest.id}
                  className="group relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <img
                    src={dest.image_url}
                    alt={dest.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-white">
                    <h3 className="text-xl font-bold">{dest.name}</h3>
                    <p className="text-sm">{dest.description}</p>
                    {dest.starting_price && (
                      <p className="text-sm font-semibold mt-2">
                        Desde ${dest.starting_price.toLocaleString()} MXN
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {flyers.length > 0 && (
        <section id="gallery" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Promociones
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {flyers.map((flyer) => (
                <img
                  key={flyer.id}
                  src={flyer.image_url}
                  alt={flyer.title}
                  className="rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer w-full h-auto"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Contáctanos</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {config.phone && (
              <a
                href={`tel:${config.phone}`}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                <Phone size={20} />
                {config.phone}
              </a>
            )}
            {config.whatsapp && (
              <a
                href={`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>
            )}
            {config.email && (
              <a
                href={`mailto:${config.email}`}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                <Mail size={20} />
                Email
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4 text-lg">
                {config.company_name || "Emociones Viajes"}
              </h3>
              <p className="text-gray-400">Tu agencia de viajes de confianza</p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Contáctanos</h3>
              {config.phone && <p className="text-gray-400">{config.phone}</p>}
              {config.email && <p className="text-gray-400">{config.email}</p>}
            </div>
            <div>
              <h3 className="font-bold mb-4 text-lg">Síguenos</h3>
              <div className="flex gap-4">
                {config.social?.facebook && (
                  <a
                    href={config.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Facebook size={24} />
                  </a>
                )}
                {config.social?.instagram && (
                  <a
                    href={config.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Instagram size={24} />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()}{" "}
            {config.company_name || "Emociones Viajes"}. Todos los derechos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
