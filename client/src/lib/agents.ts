export interface AgentType {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  lastRun?: Date;
  configuration?: Record<string, any>;
}

export const defaultAgents: AgentType[] = [
  {
    id: 'structure',
    name: 'Structure Agent',
    type: 'structure',
    description: 'Analyzes document structure and suggests organization patterns',
    icon: 'brain',
    color: 'primary',
    enabled: true,
    configuration: {
      maxSections: 20,
      minMessagesPerSection: 3
    }
  },
  {
    id: 'requirements',
    name: 'Requirements Agent',
    type: 'requirements',
    description: 'Extracts and categorizes technical requirements and specifications',
    icon: 'list-checks',
    color: 'warning',
    enabled: true,
    configuration: {
      requirementTypes: ['functional', 'non-functional', 'technical']
    }
  },
  {
    id: 'user_perspective',
    name: 'User Perspective Agent',
    type: 'user_perspective',
    description: 'Identifies user needs, feedback, and experience requirements',
    icon: 'user',
    color: 'success',
    enabled: true,
    configuration: {
      personaTypes: ['developer', 'researcher', 'project_manager']
    }
  },
  {
    id: 'documentation',
    name: 'Documentation Agent',
    type: 'documentation',
    description: 'Tracks documentation gaps and generates content outlines',
    icon: 'book',
    color: 'purple',
    enabled: false,
    configuration: {
      gapTypes: ['missing_context', 'incomplete_specs', 'outdated_info']
    }
  },
  {
    id: 'meta',
    name: 'Meta Agent',
    type: 'meta',
    description: 'Reviews and optimizes overall analysis quality and coherence',
    icon: 'eye',
    color: 'gray',
    enabled: true,
    configuration: {
      analysisDepth: 'comprehensive'
    }
  }
];

export const getAgentIcon = (type: string) => {
  const agent = defaultAgents.find(a => a.type === type);
  return agent?.icon || 'brain';
};

export const getAgentColor = (type: string) => {
  const agent = defaultAgents.find(a => a.type === type);
  return agent?.color || 'gray';
};
