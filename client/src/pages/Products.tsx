import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, FileText } from "lucide-react";

export default function Products() {
  return (
    <main role="main" className="container mx-auto px-4 py-16">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4">
        Skip to main content
      </a>

      <h1 className="text-4xl font-bold mb-8" tabIndex={0}>Our Products</h1>

      <div id="main-content" className="grid gap-8 md:grid-cols-2">
        <Card className="relative" tabIndex={0} aria-labelledby="content-management-title">
          <CardContent className="p-6">
            <div className="mb-4">
              <Brain className="w-10 h-10 text-primary" aria-hidden="true" />
            </div>
            <h2 id="content-management-title" className="text-2xl font-semibold mb-4">Content Management</h2>
            <p className="text-muted-foreground mb-8">
              AI-powered content creation and management platform. Schedule, generate, and publish content across multiple platforms with ease.
            </p>
            <Link href="/content-manager">
              <Button className="w-full gap-2" aria-label="Get started with Content Management">
                Get Started <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative" tabIndex={0} aria-labelledby="pdf-analysis-title">
          <CardContent className="p-6">
            <div className="mb-4">
              <FileText className="w-10 h-10 text-primary" aria-hidden="true" />
            </div>
            <h2 id="pdf-analysis-title" className="text-2xl font-semibold mb-4">PDF Analysis</h2>
            <p className="text-muted-foreground mb-4">
              Advanced document analysis powered by AI. Upload financial PDFs for instant insights, risk assessment, and comprehensive summaries.
            </p>
            <div className="mb-8">
              <h3 className="text-sm font-medium mb-2">Key Features:</h3>
              <ul className="text-sm text-muted-foreground space-y-1" role="list">
                <li>• Intelligent document summarization</li>
                <li>• Financial risk assessment (1-5 scale)</li>
                <li>• Expert-configured analysis prompts</li>
                <li>• Visual risk indicators</li>
              </ul>
            </div>
            <Link href="/pdf-analysis">
              <Button className="w-full gap-2" aria-label="Try PDF Analysis now">
                Try Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}