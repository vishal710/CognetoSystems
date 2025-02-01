import { SelectContentPlan } from "@db/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsDashboardProps {
  data: SelectContentPlan[];
  type: "overview" | "themes" | "seo";
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AnalyticsDashboard({
  data,
  type,
}: AnalyticsDashboardProps) {
  const prepareData = () => {
    switch (type) {
      case "overview": {
        const monthlyData = data.reduce((acc, plan) => {
          const date = new Date(plan.targetPublishDate);
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
          
          if (!acc[monthYear]) {
            acc[monthYear] = { name: monthYear, planned: 0, published: 0 };
          }
          
          if (plan.status === "published") {
            acc[monthYear].published += 1;
          }
          acc[monthYear].planned += 1;
          
          return acc;
        }, {} as Record<string, { name: string; planned: number; published: number }>);

        return Object.values(monthlyData);
      }
      
      case "themes": {
        const themeData = data.reduce((acc, plan) => {
          if (!acc[plan.theme]) {
            acc[plan.theme] = { name: plan.theme, value: 0 };
          }
          acc[plan.theme].value += 1;
          return acc;
        }, {} as Record<string, { name: string; value: number }>);

        return Object.values(themeData);
      }
      
      case "seo": {
        return data
          .filter((plan) => plan.metadata?.seoScore)
          .map((plan) => ({
            name: plan.theme,
            score: plan.metadata?.seoScore || 0,
          }));
      }
    }
  };

  const chartData = prepareData();

  if (type === "themes") {
    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={(entry) => entry.name}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {type === "overview" ? (
            <>
              <Bar dataKey="planned" fill={COLORS[0]} name="Planned" />
              <Bar dataKey="published" fill={COLORS[1]} name="Published" />
            </>
          ) : (
            <Bar dataKey="score" fill={COLORS[0]} name="SEO Score" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
