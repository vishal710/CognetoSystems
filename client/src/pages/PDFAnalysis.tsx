import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload } from "lucide-react";
import RiskRating from "@/components/RiskRating";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  summary: string;
  riskRating: number;
  additionalInfo?: string[];
}

export default function PDFAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      console.log("[DEBUG] Sending PDF analysis request for:", file.name);
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();
      console.log("[DEBUG] Raw API response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to analyze PDF");
      }

      if (!responseData.summary || typeof responseData.riskRating !== 'number') {
        console.error("[ERROR] Invalid response format:", responseData);
        throw new Error("Invalid response format from server");
      }

      console.log("[DEBUG] Setting analysis result:", responseData);
      setResult(responseData);
      toast({
        title: "Analysis Complete",
        description: "PDF has been successfully analyzed",
      });
    } catch (error: any) {
      console.error("[ERROR] PDF analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the PDF. Please try again.",
        variant: "destructive",
      });
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">PDF Analysis</h1>

      <div className="grid gap-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Upload Document</h2>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF document for AI-powered analysis
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  "Analyzing..."
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <RiskRating rating={result.riskRating} />

              <div>
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {result.summary}
                </p>
              </div>

              {result.additionalInfo && result.additionalInfo.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {result.additionalInfo.map((info, index) => (
                      <li key={index}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}