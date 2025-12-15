import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  const config = content.config || {};
  const hero = content.hero || {};
  const deals = content.deals?.deals || [];
  const destinations = content.destinations?.destinations || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Login */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✈️</div>
            <span className="font-bold text-xl text-primary">
              {config.company_name || "Emociones Viajes"}
            </span>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Iniciar Sesión
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        className="h-screen bg-cover bg-center flex items-center justify-center text-white relative pt-16"
        style={{
          backgroundImage: hero.image_url
            ? `url(${hero.image_url})`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center max-w-4xl px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            {hero.headline || "Descubre el Mundo con Nosotros"}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-8">
            {hero.subheadline || "Paquetes personalizados para toda la familia"}
          </p>
          <a
            href={hero.cta_link || "#destinations"}
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-primary/90 transform hover:scale-105 transition-all shadow-xl"
          >
            {hero.cta_text || "Ver Destinos"}
          </a>
        </div>
      </section>

      {/* Deals Section */}
      {deals.length > 0 && (
        <section id="deals" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
              Ofertas Especiales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="relative h-48">
                    <img
                      src={deal.image_url}
                      alt={deal.title}
                      className="w-full h-full object-cover"
                    />
                    {deal.discount_percent && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                        -{deal.discount_percent}%
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{deal.title}</h3>
                    <p className="text-gray-600 mb-4">{deal.description}</p>
                    {deal.valid_until && (
                      <p className="text-sm text-gray-500">
                        Válido hasta:{" "}
                        {new Date(deal.valid_until).toLocaleDateString("es-MX")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Destinations Section */}
      {destinations.length > 0 && (
        <section id="destinations" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
              Destinos Populares
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {destinations.map((dest) => (
                <div key={dest.id} className="group cursor-pointer">
                  <div className="relative h-48 rounded-lg overflow-hidden mb-3">
                    <img
                      src={dest.image_url}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-bold text-lg">{dest.name}</h3>
                      <p className="text-sm">{dest.description}</p>
                    </div>
                  </div>
                  {dest.starting_price && (
                    <p className="text-center text-sm text-gray-600">
                      Desde ${dest.starting_price.toLocaleString()} MXN
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-gradient-to-br from-primary to-secondary text-white"
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Contáctanos y diseñaremos el viaje perfecto para ti
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {config.phone && (
              <a
                href={`tel:${config.phone}`}
                className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                📞 {config.phone}
              </a>
            )}
            {config.whatsapp && (
              <a
                href={`https://wa.me/${config.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                💬 WhatsApp
              </a>
            )}
            {config.email && (
              <a
                href={`mailto:${config.email}`}
                className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                ✉️ Email
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">
                {config.company_name || "Emociones Viajes"}
              </h3>
              <p className="text-gray-400">Tu agencia de viajes de confianza</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contáctanos</h3>
              {config.phone && (
                <p className="text-gray-400 mb-1">📞 {config.phone}</p>
              )}
              {config.email && (
                <p className="text-gray-400">✉️ {config.email}</p>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Síguenos</h3>
              <div className="flex gap-4">
                {config.social?.facebook && (
                  <a
                    href={config.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Facebook
                  </a>
                )}
                {config.social?.instagram && (
                  <a
                    href={config.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()}{" "}
              {config.company_name || "Emociones Viajes"}. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
