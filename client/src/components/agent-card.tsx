import { useState } from "react";
import { Brain, ListChecks, User, Book, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Agent } from "@shared/schema";

interface AgentCardProps {
  agent: Agent;
}

const agentIcons = {
  structure: Brain,
  requirements: ListChecks,
  user_perspective: User,
  documentation: Book,
  meta: Eye,
};

const agentColors = {
  structure: 'bg-primary-100 text-primary-600',
  requirements: 'bg-warning text-white',
  user_perspective: 'bg-success text-white',
  documentation: 'bg-purple-500 text-white',
  meta: 'bg-gray-500 text-white',
};

export default function AgentCard({ agent }: AgentCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(agent.enabled);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Agent>) => {
      const response = await apiRequest('PATCH', `/api/agents/${agent.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent updated",
        description: `${agent.name} has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    },
    onError: (error) => {
      setEnabled(!enabled); // Revert the switch
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    updateMutation.mutate({ enabled: newEnabled });
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minutes ago`;
    }
    if (hours < 24) {
      return `${hours} hours ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const Icon = agentIcons[agent.type as keyof typeof agentIcons] || Brain;
  const colorClass = agentColors[agent.type as keyof typeof agentColors] || 'bg-gray-500 text-white';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${colorClass}`}>
              <Icon size={16} />
            </div>
            <h3 className="text-sm font-medium text-gray-900">{agent.name}</h3>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={updateMutation.isPending}
          />
        </div>
        
        <p className="text-xs text-gray-600 mb-3">{agent.description}</p>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Last run: {formatTimeAgo(agent.lastRunAt)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-600 hover:text-primary-700 font-medium h-auto p-0"
          >
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
