import PropTypes from "prop-types";
import {
  FileText,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Receipt,
  Layout,
  Shield,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

// Card configuration with translation keys
const dashboardCardsConfig = [
  {
    id: "cotizaciones",
    path: "/app/cotizaciones",
    icon: FileText,
    titleKey: "dashboard.cotizaciones.title",
    descKey: "dashboard.cotizaciones.desc",
    borderColor: "border-primary",
    hoverBg: "hover:bg-primary/5",
    iconColor: "text-primary",
  },
  {
    id: "operadores",
    path: "/app/operadores",
    icon: Building2,
    titleKey: "dashboard.operadores.title",
    descKey: "dashboard.operadores.desc",
    borderColor: "border-primary",
    hoverBg: "hover:bg-primary/5",
    iconColor: "text-primary",
  },
  {
    id: "pipeline",
    path: "/app/pipeline",
    icon: TrendingUp,
    titleKey: "dashboard.pipeline.title",
    descKey: "dashboard.pipeline.desc",
    borderColor: "border-teal-600",
    hoverBg: "hover:bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "sales",
    path: "/app/sales",
    icon: DollarSign,
    titleKey: "dashboard.sales.title",
    descKey: "dashboard.sales.desc",
    borderColor: "border-green-600",
    hoverBg: "hover:bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: "grupos",
    path: "/app/grupos",
    icon: Users,
    titleKey: "dashboard.groups.title",
    descKey: "dashboard.groups.desc",
    borderColor: "border-purple-600",
    hoverBg: "hover:bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: "dashboard",
    path: "/app/dashboard",
    icon: BarChart3,
    titleKey: "dashboard.analytics.title",
    descKey: "dashboard.analytics.desc",
    borderColor: "border-blue-600",
    hoverBg: "hover:bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "receipts",
    path: "/app/receipts",
    icon: Receipt,
    titleKey: "dashboard.receipts.title",
    descKey: "dashboard.receipts.desc",
    borderColor: "border-orange-600",
    hoverBg: "hover:bg-orange-50",
    iconColor: "text-orange-600",
  },
];

const cmsCardConfig = {
  id: "cms",
  path: "/app/cms",
  icon: Layout,
  titleKey: "dashboard.cms.title",
  descKey: "dashboard.cms.desc",
  borderColor: "border-indigo-600",
  hoverBg: "hover:bg-indigo-50",
  iconColor: "text-indigo-600",
};

const usersCardConfig = {
  id: "users",
  path: "/app/users",
  icon: Shield,
  titleKey: "dashboard.users.title",
  descKey: "dashboard.users.desc",
  borderColor: "border-red-600",
  hoverBg: "hover:bg-red-50",
  iconColor: "text-red-600",
};

function DashboardCard({ card, onNavigate, t }) {
  const Icon = card.icon;
  return (
    <button
      onClick={() => onNavigate(card.path)}
      className={`p-6 border-2 ${card.borderColor} rounded-lg ${card.hoverBg} text-left transition-colors`}
    >
      <Icon size={32} className={`${card.iconColor} mb-2`} aria-hidden="true" />
      <h3 className="font-semibold text-lg">{t(card.titleKey)}</h3>
      <p className="text-sm text-gray-600">{t(card.descKey)}</p>
    </button>
  );
}

DashboardCard.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    titleKey: PropTypes.string.isRequired,
    descKey: PropTypes.string.isRequired,
    borderColor: PropTypes.string.isRequired,
    hoverBg: PropTypes.string.isRequired,
    iconColor: PropTypes.string.isRequired,
  }).isRequired,
  onNavigate: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default function HomeDashboard({
  userName,
  onNavigate,
  showCMS,
  canManageUsers,
}) {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">
        {t("dashboard.welcome")}, {userName}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardCardsConfig.map((card) => (
          <DashboardCard key={card.id} card={card} onNavigate={onNavigate} t={t} />
        ))}
        {showCMS && (
          <DashboardCard card={cmsCardConfig} onNavigate={onNavigate} t={t} />
        )}
        {canManageUsers && (
          <DashboardCard card={usersCardConfig} onNavigate={onNavigate} t={t} />
        )}
      </div>
    </div>
  );
}

HomeDashboard.propTypes = {
  userName: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  showCMS: PropTypes.bool,
  canManageUsers: PropTypes.bool,
};

HomeDashboard.defaultProps = {
  showCMS: false,
  canManageUsers: false,
};
