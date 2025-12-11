import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  es: {
    translation: {
      // Navigation
      "nav.home": "Inicio",
      "nav.quotations": "Cotizaciones",
      "nav.operators": "Operadores",

      // Common
      "common.loading": "Cargando...",
      "common.save": "Guardar",
      "common.cancel": "Cancelar",
      "common.edit": "Editar",
      "common.delete": "Eliminar",
      "common.back": "Regresar",
      "common.next": "Siguiente",
      "common.previous": "Anterior",
      "common.add": "Agregar",
      "common.search": "Buscar",
      "common.filter": "Filtrar",

      // Home
      "home.title": "Sistema de Cotizaciones",
      "home.welcome":
        "Bienvenido al sistema de gestión de cotizaciones para Emociones Viajes.",
      "home.newQuotation": "Nueva Cotización",
      "home.newQuotationDesc": "Crear una cotización para un cliente",
      "home.viewQuotations": "Ver Cotizaciones",
      "home.viewQuotationsDesc": "Ver historial de cotizaciones",
      "home.operators": "Operadores",
      "home.operatorsDesc": "Gestionar operadores turísticos",

      // Quotations
      "quotations.title": "Cotizaciones",
      "quotations.new": "Nueva Cotización",
      "quotations.empty": "No hay cotizaciones registradas",
      "quotations.createFirst": "Crea la primera cotización",
      "quotations.folio": "Folio",
      "quotations.client": "Cliente",
      "quotations.destination": "Destino",
      "quotations.dates": "Fechas",
      "quotations.travelers": "Viajeros",
      "quotations.budget": "Presupuesto",
      "quotations.status": "Estatus",
      "quotations.viewDetails": "Ver detalles",

      // New Quotation
      "newQuotation.title": "Nueva Cotización",
      "newQuotation.step": "Paso {{current}} de {{total}}",
      "newQuotation.clientInfo": "Información del Cliente y Viaje",
      "newQuotation.packageOptions": "Agregar Opciones de Paquetes",
      "newQuotation.review": "Revisar y Guardar",

      // Client form
      "client.name": "Nombre completo",
      "client.phone": "Teléfono",
      "client.email": "Email",
      "client.contactMethod": "¿Cómo nos contactó?",
      "client.destination": "Destino",
      "client.departureDate": "Fecha de salida",
      "client.returnDate": "Fecha de regreso",
      "client.adults": "Adultos",
      "client.children": "Niños",
      "client.budget": "Presupuesto aproximado",
      "client.requirements": "Requerimientos",
      "client.notes": "Notas internas",

      // Package options
      "package.operator": "Operador",
      "package.name": "Nombre del paquete",
      "package.pricePerPerson": "Precio por persona",
      "package.totalPrice": "Precio total",
      "package.includes": "Incluye",
      "package.notIncludes": "No incluye",
      "package.availability": "Disponibilidad",
      "package.link": "Link del paquete",
      "package.addOption": "Agregar Opción",
      "package.optionsAdded": "Opciones agregadas",

      // Export
      "export.whatsapp": "WhatsApp",
      "export.pdf": "PDF",
      "export.generating": "Generando...",

      // Operators
      "operators.title": "Operadores",
      "operators.new": "Nuevo Operador",
      "operators.name": "Nombre",
      "operators.contact": "Contacto",
      "operators.website": "Sitio Web",
      "operators.commission": "Comisión",
      "operators.notes": "Notas",
      "operators.empty": "No hay operadores registrados. Agrega el primero.",

      // Messages
      "msg.deleteConfirm": "¿Seguro que quieres eliminar?",
      "msg.saved": "Guardado exitosamente",
      "msg.deleted": "Eliminado exitosamente",
      "msg.error": "Error",
      "msg.requiredFields": "Completa los campos obligatorios",
    },
  },
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.quotations": "Quotations",
      "nav.operators": "Operators",

      // Common
      "common.loading": "Loading...",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.edit": "Edit",
      "common.delete": "Delete",
      "common.back": "Back",
      "common.next": "Next",
      "common.previous": "Previous",
      "common.add": "Add",
      "common.search": "Search",
      "common.filter": "Filter",

      // Home
      "home.title": "Quotation System",
      "home.welcome":
        "Welcome to the quotation management system for Emociones Viajes.",
      "home.newQuotation": "New Quotation",
      "home.newQuotationDesc": "Create a quotation for a client",
      "home.viewQuotations": "View Quotations",
      "home.viewQuotationsDesc": "View quotation history",
      "home.operators": "Operators",
      "home.operatorsDesc": "Manage tour operators",

      // Quotations
      "quotations.title": "Quotations",
      "quotations.new": "New Quotation",
      "quotations.empty": "No quotations registered",
      "quotations.createFirst": "Create the first quotation",
      "quotations.folio": "Folio",
      "quotations.client": "Client",
      "quotations.destination": "Destination",
      "quotations.dates": "Dates",
      "quotations.travelers": "Travelers",
      "quotations.budget": "Budget",
      "quotations.status": "Status",
      "quotations.viewDetails": "View details",

      // New Quotation
      "newQuotation.title": "New Quotation",
      "newQuotation.step": "Step {{current}} of {{total}}",
      "newQuotation.clientInfo": "Client and Travel Information",
      "newQuotation.packageOptions": "Add Package Options",
      "newQuotation.review": "Review and Save",

      // Client form
      "client.name": "Full name",
      "client.phone": "Phone",
      "client.email": "Email",
      "client.contactMethod": "How did they contact us?",
      "client.destination": "Destination",
      "client.departureDate": "Departure date",
      "client.returnDate": "Return date",
      "client.adults": "Adults",
      "client.children": "Children",
      "client.budget": "Approximate budget",
      "client.requirements": "Requirements",
      "client.notes": "Internal notes",

      // Package options
      "package.operator": "Operator",
      "package.name": "Package name",
      "package.pricePerPerson": "Price per person",
      "package.totalPrice": "Total price",
      "package.includes": "Includes",
      "package.notIncludes": "Not included",
      "package.availability": "Availability",
      "package.link": "Package link",
      "package.addOption": "Add Option",
      "package.optionsAdded": "Options added",

      // Export
      "export.whatsapp": "WhatsApp",
      "export.pdf": "PDF",
      "export.generating": "Generating...",

      // Operators
      "operators.title": "Operators",
      "operators.new": "New Operator",
      "operators.name": "Name",
      "operators.contact": "Contact",
      "operators.website": "Website",
      "operators.commission": "Commission",
      "operators.notes": "Notes",
      "operators.empty": "No operators registered. Add the first one.",

      // Messages
      "msg.deleteConfirm": "Are you sure you want to delete?",
      "msg.saved": "Saved successfully",
      "msg.deleted": "Deleted successfully",
      "msg.error": "Error",
      "msg.requiredFields": "Complete required fields",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
