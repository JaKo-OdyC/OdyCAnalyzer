import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import FileUpload from "@/components/file-upload";
import AgentCard from "@/components/agent-card";
import AnalysisPipeline from "@/components/analysis-pipeline";
import RealtimeLogs from "@/components/real-time-logs";
import DocumentationPreview from "@/components/documentation-preview";
import { useQuery } from "@tanstack/react-query";
import { Agent, UploadedFile } from "@shared/schema";

export default function Dashboard() {
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const { data: files = [] } = useQuery<UploadedFile[]>({
    queryKey: ['/api/files'],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Data Import & Analysis</h1>
            <p className="text-gray-600">Upload OdyC chat data and configure your multi-agent analysis pipeline</p>
          </div>

          {/* Data Upload Section */}
          <FileUpload files={files} />

          {/* Agent Configuration Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <i className="fas fa-users text-primary-500 mr-2"></i>
                Agent Configuration
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Pipeline Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <AnalysisPipeline files={files} />
            <RealtimeLogs />
          </div>

          {/* Documentation Preview Section */}
          <DocumentationPreview />
        </main>
      </div>
    </div>
  );
}
