import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TrendingUp, DollarSign, Users, Target, Calendar } from "lucide-react";

export default function SalesDashboard() {
  const [metrics, setMetrics] = useState({
    totalQuotes: 0,
    totalSales: 0,
    totalRevenue: 0,
    conversionRate: 0,
    avgDealSize: 0,
    pendingPayments: 0,
  });
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch quotes count
      const { count: quotesCount } = await supabase
        .from("cotizaciones")
        .select("*", { count: "exact", head: true });

      // Fetch sales data
      const { data: ventas } = await supabase
        .from("ventas")
        .select("*")
        .eq("estado_venta", "confirmada");

      const totalRevenue =
        ventas?.reduce((sum, v) => sum + parseFloat(v.precio_total || 0), 0) ||
        0;
      const avgDealSize = ventas?.length ? totalRevenue / ventas.length : 0;
      const pendingPayments =
        ventas?.reduce(
          (sum, v) => sum + parseFloat(v.monto_pendiente || 0),
          0
        ) || 0;

      // Fetch pipeline summary
      const { data: pipeline } = await supabase
        .from("cotizaciones")
        .select("pipeline_stage, presupuesto_aprox")
        .not("pipeline_stage", "in", '("lost","cancelled","delivered")');

      const pipelineSummary = {};
      pipeline?.forEach((p) => {
        if (!pipelineSummary[p.pipeline_stage]) {
          pipelineSummary[p.pipeline_stage] = { count: 0, value: 0 };
        }
        pipelineSummary[p.pipeline_stage].count++;
        pipelineSummary[p.pipeline_stage].value += parseFloat(
          p.presupuesto_aprox || 0
        );
      });

      const stages = [
        { key: "lead", label: "Lead", color: "bg-gray-500" },
        { key: "qualification", label: "Calificación", color: "bg-blue-500" },
        { key: "quote_sent", label: "Enviada", color: "bg-purple-500" },
        { key: "negotiation", label: "Negociación", color: "bg-yellow-500" },
        {
          key: "booking_confirmed",
          label: "Confirmada",
          color: "bg-green-500",
        },
      ];

      const pipelineWithData = stages.map((stage) => ({
        ...stage,
        ...(pipelineSummary[stage.key] || { count: 0, value: 0 }),
      }));

      setMetrics({
        totalQuotes: quotesCount || 0,
        totalSales: ventas?.length || 0,
        totalRevenue,
        conversionRate: quotesCount
          ? ((ventas?.length || 0) / quotesCount) * 100
          : 0,
        avgDealSize,
        pendingPayments,
      });

      setPipelineData(pipelineWithData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Dashboard de Ventas
        </h1>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="text-blue-600" size={24} />
              </div>
              <span className="text-sm text-gray-500">Este mes</span>
            </div>
            <p className="text-sm text-gray-600">Total Cotizaciones</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.totalQuotes}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <span className="text-sm font-medium text-green-600">
                +{metrics.conversionRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600">Ventas Confirmadas</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.totalSales}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600">Revenue Total</p>
            <p className="text-3xl font-bold text-gray-900">
              $
              {metrics.totalRevenue.toLocaleString("es-MX", {
                minimumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="text-yellow-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600">Ticket Promedio</p>
            <p className="text-3xl font-bold text-gray-900">
              $
              {metrics.avgDealSize.toLocaleString("es-MX", {
                minimumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Calendar className="text-red-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600">Pagos Pendientes</p>
            <p className="text-3xl font-bold text-gray-900">
              $
              {metrics.pendingPayments.toLocaleString("es-MX", {
                minimumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <TrendingUp className="text-teal-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600">Tasa de Conversión</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.conversionRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Pipeline Actual</h2>

          <div className="space-y-4">
            {pipelineData.map((stage, idx) => {
              const maxValue = Math.max(...pipelineData.map((s) => s.value));
              const widthPercent =
                maxValue > 0 ? (stage.value / maxValue) * 100 : 0;

              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-sm text-gray-500">
                        ({stage.count})
                      </span>
                    </div>
                    <span className="font-semibold">
                      $
                      {stage.value.toLocaleString("es-MX", {
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`${stage.color} h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4`}
                      style={{
                        width: `${widthPercent}%`,
                        minWidth: stage.count > 0 ? "50px" : "0",
                      }}
                    >
                      <span className="text-white text-sm font-medium">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
