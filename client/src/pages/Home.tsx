import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-6">
            AI-Powered Business Solutions
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline your workflow with our suite of AI tools. From automated
            content creation to intelligent document analysis, we're
            transforming how businesses operate.
          </p>
          <Link href="/products">
            <Button size="lg" className="gap-2">
              Explore Products <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Content Management</h3>
              <p className="text-muted-foreground">
                Create and publish engaging content across multiple platforms
                with our AI-powered automation tools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">PDF Analysis</h3>
              <p className="text-muted-foreground">
                Extract insights from financial documents with our intelligent
                analysis system (Coming Soon).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Analytics & Insights
              </h3>
              <p className="text-muted-foreground">
                Track performance metrics and optimize your strategy with
                data-driven insights.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
