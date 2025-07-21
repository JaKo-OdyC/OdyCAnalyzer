import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { AgentLog } from "@shared/schema";

export default function RealtimeLogs() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: logs = [] } = useQuery<AgentLog[]>({
    queryKey: ['/api/logs'],
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getAgentName = (agentId: number | null) => {
    if (!agentId) return 'System';
    
    const agentNames = {
      1: 'Structure Agent',
      2: 'Requirements Agent',
      3: 'User Perspective Agent',
      4: 'Documentation Agent',
      5: 'Meta Agent',
    };
    
    return agentNames[agentId as keyof typeof agentNames] || `Agent ${agentId}`;
  };

  const getLogColor = (agentId: number | null, level: string) => {
    if (level === 'error') return 'text-red-400';
    if (level === 'warning') return 'text-yellow-400';
    
    if (!agentId) return 'text-blue-400'; // System messages
    
    const colors = {
      1: 'text-blue-400',    // Structure
      2: 'text-purple-400',  // Requirements
      3: 'text-green-400',   // User Perspective
      4: 'text-yellow-400',  // Documentation
      5: 'text-gray-400',    // Meta
    };
    
    return colors[agentId as keyof typeof colors] || 'text-gray-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Terminal className="text-primary-500 mr-2" size={20} />
          Real-time Analysis Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={scrollRef}
          className="terminal rounded-lg p-4 h-64 overflow-y-auto text-sm font-mono"
        >
          {logs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No logs available. Start an analysis to see real-time updates.
            </div>
          ) : (
            logs.slice(-20).map((log, index) => (
              <div key={log.id || index} className="text-gray-300 mb-1">
                <span className="text-green-400">[{formatTime(log.timestamp)}]</span>{' '}
                <span className={getLogColor(log.agentId, log.level)}>
                  [{getAgentName(log.agentId)}]
                </span>{' '}
                <span>{log.message}</span>
              </div>
            ))
          )}
          
          {logs.length > 0 && (
            <div className="text-yellow-400 animate-pulse">
              <span className="text-green-400">[{formatTime(new Date())}]</span>{' '}
              <span className="text-blue-400">[System]</span>{' '}
              <span>Monitoring for updates...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
