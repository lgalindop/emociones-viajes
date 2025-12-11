import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(undefined);

const languages = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
];

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferred-language");
    if (
      savedLanguage &&
      ["es", "en", "fr", "de", "it", "pt"].includes(savedLanguage)
    ) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      if (["es", "en", "fr", "de", "it", "pt"].includes(browserLang)) {
        setCurrentLanguage(browserLang);
      }
    }
    setIsInitialized(true);
  }, []);

  const setLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem("preferred-language", lang);
    document.documentElement.lang = lang;
  };

  // Translation function
  const t = (key) => {
    return (
      translations[currentLanguage]?.[key] || translations["es"][key] || key
    );
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, setLanguage, t, languages }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Translation dictionary
const translations = {
  es: {
    // Navigation
    "nav.home": "Inicio",
    "nav.cotizaciones": "Cotizaciones",
    "nav.operators": "Operadores",
    "nav.signin": "Iniciar Sesión",
    "nav.logout": "Cerrar Sesión",

    // Common
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.search": "Buscar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",

    // Cotizaciones
    "cotizaciones.title": "Cotizaciones",
    "cotizaciones.new": "Nueva Cotización",
    "cotizaciones.client": "Cliente",
    "cotizaciones.destination": "Destino",
    "cotizaciones.dates": "Fechas",
    "cotizaciones.status": "Estado",
    "cotizaciones.total": "Total",

    // Auth
    "auth.email": "Correo Electrónico",
    "auth.password": "Contraseña",
    "auth.signin": "Iniciar Sesión",
    "auth.signout": "Cerrar Sesión",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.cotizaciones": "Quotes",
    "nav.operators": "Operators",
    "nav.signin": "Sign In",
    "nav.logout": "Logout",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.search": "Search",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",

    // Cotizaciones
    "cotizaciones.title": "Quotes",
    "cotizaciones.new": "New Quote",
    "cotizaciones.client": "Client",
    "cotizaciones.destination": "Destination",
    "cotizaciones.dates": "Dates",
    "cotizaciones.status": "Status",
    "cotizaciones.total": "Total",

    // Auth
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signin": "Sign In",
    "auth.signout": "Sign Out",
  },
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.cotizaciones": "Devis",
    "nav.operators": "Opérateurs",
    "nav.signin": "Se Connecter",
    "nav.logout": "Déconnexion",

    // Common
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.edit": "Modifier",
    "common.delete": "Supprimer",
    "common.search": "Rechercher",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",

    // Cotizaciones
    "cotizaciones.title": "Devis",
    "cotizaciones.new": "Nouveau Devis",
    "cotizaciones.client": "Client",
    "cotizaciones.destination": "Destination",
    "cotizaciones.dates": "Dates",
    "cotizaciones.status": "Statut",
    "cotizaciones.total": "Total",

    // Auth
    "auth.email": "Email",
    "auth.password": "Mot de Passe",
    "auth.signin": "Se Connecter",
    "auth.signout": "Se Déconnecter",
  },
  de: {
    // Navigation
    "nav.home": "Startseite",
    "nav.cotizaciones": "Angebote",
    "nav.operators": "Betreiber",
    "nav.signin": "Anmelden",
    "nav.logout": "Abmelden",

    // Common
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.edit": "Bearbeiten",
    "common.delete": "Löschen",
    "common.search": "Suchen",
    "common.loading": "Wird geladen...",
    "common.error": "Fehler",
    "common.success": "Erfolg",

    // Cotizaciones
    "cotizaciones.title": "Angebote",
    "cotizaciones.new": "Neues Angebot",
    "cotizaciones.client": "Kunde",
    "cotizaciones.destination": "Ziel",
    "cotizaciones.dates": "Daten",
    "cotizaciones.status": "Status",
    "cotizaciones.total": "Gesamt",

    // Auth
    "auth.email": "E-Mail",
    "auth.password": "Passwort",
    "auth.signin": "Anmelden",
    "auth.signout": "Abmelden",
  },
  it: {
    // Navigation
    "nav.home": "Home",
    "nav.cotizaciones": "Preventivi",
    "nav.operators": "Operatori",
    "nav.signin": "Accedi",
    "nav.logout": "Esci",

    // Common
    "common.save": "Salva",
    "common.cancel": "Annulla",
    "common.edit": "Modifica",
    "common.delete": "Elimina",
    "common.search": "Cerca",
    "common.loading": "Caricamento...",
    "common.error": "Errore",
    "common.success": "Successo",

    // Cotizaciones
    "cotizaciones.title": "Preventivi",
    "cotizaciones.new": "Nuovo Preventivo",
    "cotizaciones.client": "Cliente",
    "cotizaciones.destination": "Destinazione",
    "cotizaciones.dates": "Date",
    "cotizaciones.status": "Stato",
    "cotizaciones.total": "Totale",

    // Auth
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signin": "Accedi",
    "auth.signout": "Esci",
  },
  pt: {
    // Navigation
    "nav.home": "Início",
    "nav.cotizaciones": "Cotações",
    "nav.operators": "Operadores",
    "nav.signin": "Entrar",
    "nav.logout": "Sair",

    // Common
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.edit": "Editar",
    "common.delete": "Excluir",
    "common.search": "Pesquisar",
    "common.loading": "Carregando...",
    "common.error": "Erro",
    "common.success": "Sucesso",

    // Cotizaciones
    "cotizaciones.title": "Cotações",
    "cotizaciones.new": "Nova Cotação",
    "cotizaciones.client": "Cliente",
    "cotizaciones.destination": "Destino",
    "cotizaciones.dates": "Datas",
    "cotizaciones.status": "Status",
    "cotizaciones.total": "Total",

    // Auth
    "auth.email": "Email",
    "auth.password": "Senha",
    "auth.signin": "Entrar",
    "auth.signout": "Sair",
  },
};
