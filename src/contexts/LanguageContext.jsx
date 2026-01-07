import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(undefined);

const languages = [
  { code: "es", name: "Español", flag: "🇲🇽" },
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
    "nav.pipeline": "Pipeline",
    "nav.sales": "Ventas",
    "nav.groups": "Grupos",
    "nav.dashboard": "Dashboard",
    "nav.receipts": "Recibos",
    "nav.cms": "CMS",
    "nav.users": "Usuarios",
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
    "common.confirm": "Confirmar",
    "common.close": "Cerrar",
    "common.add": "Agregar",
    "common.update": "Actualizar",
    "common.send": "Enviar",
    "common.back": "Volver",

    // Dashboard
    "dashboard.welcome": "Bienvenido",
    "dashboard.cotizaciones.title": "Cotizaciones",
    "dashboard.cotizaciones.desc": "Ver y gestionar cotizaciones",
    "dashboard.operadores.title": "Operadores",
    "dashboard.operadores.desc": "Gestionar operadores turísticos",
    "dashboard.pipeline.title": "Pipeline",
    "dashboard.pipeline.desc": "Visualizar pipeline de ventas",
    "dashboard.sales.title": "Ventas",
    "dashboard.sales.desc": "Gestionar ventas y pagos",
    "dashboard.groups.title": "Grupos",
    "dashboard.groups.desc": "Gestionar grupos de viajeros",
    "dashboard.analytics.title": "Dashboard",
    "dashboard.analytics.desc": "Reportes y métricas",
    "dashboard.receipts.title": "Recibos",
    "dashboard.receipts.desc": "Generar y gestionar recibos",
    "dashboard.cms.title": "CMS",
    "dashboard.cms.desc": "Gestionar página pública",
    "dashboard.users.title": "Usuarios",
    "dashboard.users.desc": "Gestionar usuarios del sistema",

    // Cotizaciones
    "cotizaciones.title": "Cotizaciones",
    "cotizaciones.new": "Nueva Cotización",
    "cotizaciones.client": "Cliente",
    "cotizaciones.destination": "Destino",
    "cotizaciones.dates": "Fechas",
    "cotizaciones.status": "Estado",
    "cotizaciones.total": "Total",

    // Operadores
    "operadores.title": "Operadores",
    "operadores.new": "Nuevo Operador",
    "operadores.name": "Nombre",
    "operadores.contact": "Contacto",
    "operadores.website": "Sitio Web",
    "operadores.commission": "Comisión",
    "operadores.notes": "Notas",
    "operadores.updated": "Operador actualizado",
    "operadores.added": "Operador agregado",
    "operadores.deleted": "Operador eliminado",
    "operadores.delete.confirm": "¿Seguro que quieres eliminar este operador?",

    // Auth
    "auth.email": "Correo Electrónico",
    "auth.password": "Contraseña",
    "auth.signin": "Iniciar Sesión",
    "auth.signout": "Cerrar Sesión",
    "auth.forgot": "¿Olvidaste tu contraseña?",
    "auth.reset.title": "Recuperar Contraseña",
    "auth.reset.message": "Ingresa tu email para recibir un enlace de recuperación:",
    "auth.reset.sent": "Email de recuperación enviado. Revisa tu bandeja de entrada.",
    "auth.account.deactivated": "Cuenta Desactivada",
    "auth.account.deactivated.message": "Tu cuenta ha sido desactivada. Por favor contacta al administrador.",

    // Users
    "users.title": "Gestión de Usuarios",
    "users.new": "Nuevo Usuario",
    "users.role": "Rol",
    "users.status": "Estado",
    "users.active": "Activo",
    "users.inactive": "Inactivo",
    "users.reset.password": "Resetear Contraseña",

    // Toasts/Messages
    "toast.error.loading": "Error al cargar datos",
    "toast.error.saving": "Error al guardar",
    "toast.success.saved": "Guardado exitosamente",
    "toast.success.deleted": "Eliminado exitosamente",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.cotizaciones": "Quotes",
    "nav.operators": "Operators",
    "nav.pipeline": "Pipeline",
    "nav.sales": "Sales",
    "nav.groups": "Groups",
    "nav.dashboard": "Dashboard",
    "nav.receipts": "Receipts",
    "nav.cms": "CMS",
    "nav.users": "Users",
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
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.add": "Add",
    "common.update": "Update",
    "common.send": "Send",
    "common.back": "Back",

    // Dashboard
    "dashboard.welcome": "Welcome",
    "dashboard.cotizaciones.title": "Quotes",
    "dashboard.cotizaciones.desc": "View and manage quotes",
    "dashboard.operadores.title": "Operators",
    "dashboard.operadores.desc": "Manage tour operators",
    "dashboard.pipeline.title": "Pipeline",
    "dashboard.pipeline.desc": "View sales pipeline",
    "dashboard.sales.title": "Sales",
    "dashboard.sales.desc": "Manage sales and payments",
    "dashboard.groups.title": "Groups",
    "dashboard.groups.desc": "Manage traveler groups",
    "dashboard.analytics.title": "Dashboard",
    "dashboard.analytics.desc": "Reports and metrics",
    "dashboard.receipts.title": "Receipts",
    "dashboard.receipts.desc": "Generate and manage receipts",
    "dashboard.cms.title": "CMS",
    "dashboard.cms.desc": "Manage public website",
    "dashboard.users.title": "Users",
    "dashboard.users.desc": "Manage system users",

    // Cotizaciones
    "cotizaciones.title": "Quotes",
    "cotizaciones.new": "New Quote",
    "cotizaciones.client": "Client",
    "cotizaciones.destination": "Destination",
    "cotizaciones.dates": "Dates",
    "cotizaciones.status": "Status",
    "cotizaciones.total": "Total",

    // Operadores
    "operadores.title": "Operators",
    "operadores.new": "New Operator",
    "operadores.name": "Name",
    "operadores.contact": "Contact",
    "operadores.website": "Website",
    "operadores.commission": "Commission",
    "operadores.notes": "Notes",
    "operadores.updated": "Operator updated",
    "operadores.added": "Operator added",
    "operadores.deleted": "Operator deleted",
    "operadores.delete.confirm": "Are you sure you want to delete this operator?",

    // Auth
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signin": "Sign In",
    "auth.signout": "Sign Out",
    "auth.forgot": "Forgot your password?",
    "auth.reset.title": "Reset Password",
    "auth.reset.message": "Enter your email to receive a recovery link:",
    "auth.reset.sent": "Recovery email sent. Check your inbox.",
    "auth.account.deactivated": "Account Deactivated",
    "auth.account.deactivated.message": "Your account has been deactivated. Please contact the administrator.",

    // Users
    "users.title": "User Management",
    "users.new": "New User",
    "users.role": "Role",
    "users.status": "Status",
    "users.active": "Active",
    "users.inactive": "Inactive",
    "users.reset.password": "Reset Password",

    // Toasts/Messages
    "toast.error.loading": "Error loading data",
    "toast.error.saving": "Error saving",
    "toast.success.saved": "Saved successfully",
    "toast.success.deleted": "Deleted successfully",
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
