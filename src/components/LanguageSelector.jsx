import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 transition-colors">
        <Globe size={18} />
        <span className="text-sm uppercase">{i18n.language}</span>
      </button>

      <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
        <button
          onClick={() => changeLanguage("es")}
          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${i18n.language === "es" ? "bg-gray-50 font-semibold" : ""}`}
        >
          🇲🇽 Español
        </button>
        <button
          onClick={() => changeLanguage("en")}
          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${i18n.language === "en" ? "bg-gray-50 font-semibold" : ""}`}
        >
          🇺🇸 English
        </button>
      </div>
    </div>
  );
}
