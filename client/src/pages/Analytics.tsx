import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { useQuery } from "@tanstack/react-query";
import { SelectContentPlan } from "@db/schema";

export default function Analytics() {
  const { data: contentPlans = [] } = useQuery<SelectContentPlan[]>({
    queryKey: ["/api/content-plans"],
  });

  const calculateMetrics = () => {
    const totalContent = contentPlans.length;
    const publishedContent = contentPlans.filter(
      (plan) => plan.status === "published"
    ).length;
    const pendingContent = totalContent - publishedContent;

    const themeBreakdown = contentPlans.reduce((acc, plan) => {
      acc[plan.theme] = (acc[plan.theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageSEOScore =
      contentPlans.reduce((sum, plan) => sum + (plan.metadata?.seoScore || 0), 0) /
      totalContent || 0;

    return {
      totalContent,
      publishedContent,
      pendingContent,
      themeBreakdown,
      averageSEOScore,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalContent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.publishedContent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average SEO Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageSEOScore.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="themes">Themes</TabsTrigger>
                <TabsTrigger value="seo">SEO Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <AnalyticsDashboard
                  data={contentPlans}
                  type="overview"
                />
              </TabsContent>

              <TabsContent value="themes">
                <AnalyticsDashboard
                  data={contentPlans}
                  type="themes"
                />
              </TabsContent>

              <TabsContent value="seo">
                <AnalyticsDashboard
                  data={contentPlans}
                  type="seo"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
