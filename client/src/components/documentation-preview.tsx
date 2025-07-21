import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DocumentationOutput } from "@shared/schema";

export default function DocumentationPreview() {
  const { toast } = useToast();
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("markdown");

  // Get all analysis runs to find the latest one
  const { data: allAnalysisRuns = [] } = useQuery({
    queryKey: ['/api/analysis'],
    queryFn: async () => {
      const response = await fetch('/api/logs');
      const logs = await response.json();
      // Extract unique analysis run IDs from logs
      const analysisIds = [...new Set(logs.map((log: any) => log.analysisRunId))].filter(Boolean);
      return analysisIds.sort((a: number, b: number) => b - a); // Latest first
    },
  });

  // Auto-select the latest analysis if none selected
  const latestAnalysisId = allAnalysisRuns[0]?.toString() || "";
  const currentAnalysisId = selectedAnalysisId || latestAnalysisId;

  const { data: outputs = [] } = useQuery<DocumentationOutput[]>({
    queryKey: ['/api/analysis', currentAnalysisId, 'output'],
    enabled: !!currentAnalysisId,
  });

  const selectedOutput = outputs.find(output => output.format === selectedFormat);

  const handleExport = async () => {
    if (!currentAnalysisId || !selectedFormat) {
      toast({
        title: "Export failed",
        description: "Please select an analysis and format to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/analysis/${currentAnalysisId}/export/${selectedFormat}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${currentAnalysisId}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Your documentation has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export the documentation.",
        variant: "destructive",
      });
    }
  };

  const formatContent = (content: string, format: string) => {
    if (format === 'json') {
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return content;
      }
    }
    return content;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="text-primary-500 mr-2" size={20} />
            Generated Documentation Preview
            {allAnalysisRuns.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                (Analysis #{currentAnalysisId})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={!selectedOutput}
              className="bg-primary-500 text-white hover:bg-primary-600"
              size="sm"
            >
              <Download className="mr-1" size={16} />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!currentAnalysisId ? (
          <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-primary-500">
            <div className="text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Selected</h3>
              <p className="text-gray-600">
                Start an analysis to generate documentation that will be previewed here.
              </p>
            </div>
          </div>
        ) : !selectedOutput ? (
          <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-yellow-500">
            <div className="text-center">
              <p className="text-gray-600">
                No {selectedFormat} output available for this analysis.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-primary-500">
              <div className={selectedFormat === 'html' ? '' : 'prose prose-sm max-w-none'}>
                {selectedFormat === 'html' ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: selectedOutput.content 
                    }} 
                  />
                ) : (
                  <pre className={`whitespace-pre-wrap ${
                    selectedFormat === 'json' 
                      ? 'font-mono text-sm bg-gray-100 p-4 rounded overflow-x-auto' 
                      : 'font-sans'
                  }`}>
                    {formatContent(selectedOutput.content, selectedFormat)}
                  </pre>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Generated: {new Date(selectedOutput.generatedAt).toLocaleDateString()} at{' '}
                {new Date(selectedOutput.generatedAt).toLocaleTimeString()}
              </span>
              <span>Format: {selectedFormat.toUpperCase()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
