import { useState } from "react";
import { Play, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UploadedFile, AnalysisRun } from "@shared/schema";

interface AnalysisPipelineProps {
  files: UploadedFile[];
}

export default function AnalysisPipeline({ files }: AnalysisPipelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);

  const processedFiles = files.filter(file => file.processed);

  const { data: currentAnalysis } = useQuery<AnalysisRun>({
    queryKey: ['/api/analysis', currentAnalysisId],
    enabled: !!currentAnalysisId,
    refetchInterval: (data) => {
      // Stop polling if analysis is complete or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  const startAnalysisMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest('POST', '/api/analysis/start', { fileId });
      return response.json();
    },
    onSuccess: (analysisRun: AnalysisRun) => {
      setCurrentAnalysisId(analysisRun.id);
      queryClient.invalidateQueries({ queryKey: ['/api/analysis'] });
      toast({
        title: "Analysis started",
        description: "Your multi-agent analysis pipeline has begun processing the data.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start analysis",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartAnalysis = () => {
    if (!selectedFileId) {
      toast({
        title: "No file selected",
        description: "Please select a file to analyze.",
        variant: "destructive",
      });
      return;
    }

    const fileId = parseInt(selectedFileId);
    startAnalysisMutation.mutate(fileId);
  };

  const getStepStatus = (step: string) => {
    if (!currentAnalysis) return 'pending';
    
    switch (step) {
      case 'preprocessing':
        return 'complete';
      case 'analysis':
        if (currentAnalysis.status === 'running') return 'running';
        if (currentAnalysis.status === 'completed') return 'complete';
        if (currentAnalysis.status === 'failed') return 'failed';
        return 'pending';
      case 'output':
        if (currentAnalysis.status === 'completed') return 'complete';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const getStepContent = (step: string, status: string) => {
    const configs = {
      preprocessing: {
        title: 'Data Preprocessing',
        description: 'Parsing and segmentation',
      },
      analysis: {
        title: 'Agent Analysis',
        description: currentAnalysis?.status === 'running' 
          ? 'Running multi-agent analysis...' 
          : 'Multi-agent processing',
      },
      output: {
        title: 'Output Generation',
        description: 'Markdown compilation',
      },
    };

    return configs[step as keyof typeof configs] || { title: step, description: '' };
  };

  const renderStepStatus = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success text-white">
            <Check size={12} className="mr-1" />
            Complete
          </span>
        );
      case 'running':
        return (
          <div className="flex items-center">
            <Loader2 size={16} className="animate-spin text-primary-600 mr-2" />
            <span className="text-xs text-primary-700 font-medium">In Progress</span>
          </div>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error text-white">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-300 text-gray-700">
            Pending
          </span>
        );
    }
  };

  const steps = ['preprocessing', 'analysis', 'output'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Play className="text-primary-500 mr-2" size={20} />
          Analysis Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step) => {
            const status = getStepStatus(step);
            const { title, description } = getStepContent(step, status);
            
            return (
              <div
                key={step}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  status === 'running'
                    ? 'bg-primary-50 border-primary-200'
                    : status === 'complete'
                    ? 'bg-gray-50'
                    : status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 opacity-50'
                }`}
              >
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{title}</h3>
                  <p className="text-xs text-gray-600">{description}</p>
                </div>
                <div className="flex items-center">
                  {renderStepStatus(status)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          {!currentAnalysis || currentAnalysis.status === 'completed' || currentAnalysis.status === 'failed' ? (
            <div className="space-y-4">
              <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a file to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {processedFiles.map((file) => (
                    <SelectItem key={file.id} value={file.id.toString()}>
                      {file.originalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleStartAnalysis}
                disabled={!selectedFileId || startAnalysisMutation.isPending || processedFiles.length === 0}
                className="w-full bg-primary-500 text-white hover:bg-primary-600"
              >
                <Play className="mr-2" size={16} />
                {startAnalysisMutation.isPending ? 'Starting...' : 'Start New Analysis'}
              </Button>
              
              {processedFiles.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  No processed files available. Please upload and wait for processing to complete.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Analysis in progress...</p>
              <p className="text-xs text-gray-500">
                Status: {currentAnalysis.status}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
