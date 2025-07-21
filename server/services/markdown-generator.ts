import { ChatMessage } from "@shared/schema";

export class MarkdownGenerator {
  generateMarkdown(agentResults: Record<string, any>, messages: ChatMessage[]): string {
    const sections: string[] = [];

    // Header
    sections.push('# Multi-Agent Documentation Analysis Report');
    sections.push('');
    sections.push(`Generated on: ${new Date().toISOString()}`);
    sections.push(`Total messages analyzed: ${messages.length}`);
    sections.push('');

    // Executive Summary
    sections.push('## Executive Summary');
    sections.push('');
    sections.push('This report presents a comprehensive analysis of the provided conversation data through specialized AI agents.');
    sections.push('Each agent provides unique insights into different aspects of the discussion.');
    sections.push('');

    // Structure Analysis
    if (agentResults.structure) {
      sections.push('## Document Structure Analysis');
      sections.push('');
      const structure = agentResults.structure;
      
      sections.push('### Suggested Document Outline:');
      structure.sections?.forEach((section: string, index: number) => {
        sections.push(`${index + 1}. ${section}`);
      });
      sections.push('');
      
      sections.push('### Content Statistics:');
      sections.push(`- **Messages processed**: ${structure.messageCount || 0}`);
      sections.push(`- **Topics identified**: ${structure.topicCount || 0}`);
      sections.push(`- **Suggested sections**: ${structure.sections?.length || 0}`);
      sections.push('');

      if (structure.topicGroups?.length > 0) {
        sections.push('### Main Discussion Topics:');
        structure.topicGroups.forEach((topic: string) => {
          sections.push(`- ${topic.charAt(0).toUpperCase() + topic.slice(1)}`);
        });
        sections.push('');
      }
    }

    // Requirements Analysis
    if (agentResults.requirements) {
      sections.push('## Requirements Analysis');
      sections.push('');
      const requirements = agentResults.requirements;
      
      sections.push(`**Requirement density**: ${(requirements.requirementDensity * 100).toFixed(1)}% of messages contain requirement indicators`);
      sections.push('');
      
      if (requirements.requirements?.length > 0) {
        sections.push('### Identified Requirements:');
        requirements.requirements.forEach((req: string, index: number) => {
          sections.push(`${index + 1}. ${req}`);
        });
        sections.push('');
      }

      if (requirements.requirementTypes?.length > 0) {
        sections.push('### Requirement Categories:');
        requirements.requirementTypes.forEach((type: string) => {
          sections.push(`- **${type.charAt(0).toUpperCase() + type.slice(1)}**`);
        });
        sections.push('');
      }
    }

    // User Perspective Analysis
    if (agentResults.user_perspective) {
      sections.push('## User Perspective Analysis');
      sections.push('');
      const userPerspective = agentResults.user_perspective;
      
      sections.push(`**Total user references**: ${userPerspective.totalUserReferences || 0}`);
      sections.push('');

      if (userPerspective.personas?.length > 0) {
        sections.push('### Identified User Personas:');
        userPerspective.personas.forEach((persona: any) => {
          sections.push(`#### ${persona.persona.charAt(0).toUpperCase() + persona.persona.slice(1)}`);
          sections.push(`- **Message count**: ${persona.messageCount}`);
          if (persona.examples?.length > 0) {
            sections.push('- **Example contexts**:');
            persona.examples.forEach((example: string) => {
              sections.push(`  - ${example}`);
            });
          }
          sections.push('');
        });
      }

      if (userPerspective.userPerspectives?.length > 0) {
        sections.push('### Key User Needs:');
        userPerspective.userPerspectives.slice(0, 10).forEach((need: string, index: number) => {
          sections.push(`${index + 1}. ${need.substring(0, 150)}${need.length > 150 ? '...' : ''}`);
        });
        sections.push('');
      }
    }

    // Documentation Analysis
    if (agentResults.documentation) {
      sections.push('## Documentation Gap Analysis');
      sections.push('');
      const documentation = agentResults.documentation;
      
      sections.push(`**Gap density**: ${(documentation.gapDensity * 100).toFixed(1)}% of messages indicate potential documentation gaps`);
      sections.push('');

      if (documentation.documentationGaps?.length > 0) {
        sections.push('### Identified Documentation Gaps:');
        documentation.documentationGaps.slice(0, 10).forEach((gap: string, index: number) => {
          sections.push(`${index + 1}. ${gap.substring(0, 200)}${gap.length > 200 ? '...' : ''}`);
        });
        sections.push('');
      }

      if (documentation.gapTypes?.length > 0) {
        sections.push('### Gap Categories:');
        documentation.gapTypes.forEach((type: string) => {
          sections.push(`- **${type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}**`);
        });
        sections.push('');
      }
    }

    // Meta Analysis
    if (agentResults.meta) {
      sections.push('## Meta Analysis & Quality Assessment');
      sections.push('');
      const meta = agentResults.meta;
      
      if (meta.messageStats) {
        sections.push('### Conversation Statistics:');
        sections.push(`- **Total messages**: ${meta.messageStats.total}`);
        sections.push(`- **Topic diversity**: ${meta.messageStats.topicCount} unique topics`);
        sections.push(`- **Message ratio**: ${meta.messageStats.messageRatio} (user:assistant)`);
        sections.push('');

        if (meta.messageStats.byRole) {
          sections.push('### Message Distribution by Role:');
          Object.entries(meta.messageStats.byRole).forEach(([role, msgs]: [string, any]) => {
            sections.push(`- **${role}**: ${msgs.length} messages`);
          });
          sections.push('');
        }
      }

      if (meta.topWords?.length > 0) {
        sections.push('### Most Frequent Terms:');
        sections.push(`${meta.topWords.join(', ')}`);
        sections.push('');
      }

      if (meta.metaInsights?.length > 0) {
        sections.push('### Key Insights:');
        meta.metaInsights.forEach((insight: string, index: number) => {
          sections.push(`${index + 1}. ${insight}`);
        });
        sections.push('');
      }

      sections.push(`**Analysis Quality**: ${meta.analysisQuality || 'standard'}`);
      sections.push('');
    }

    // Recommendations
    sections.push('## Recommendations');
    sections.push('');
    sections.push('Based on the multi-agent analysis, we recommend:');
    sections.push('');
    
    if (agentResults.structure?.sections?.length > 0) {
      sections.push('1. **Structure**: Follow the suggested document outline to organize content effectively');
    }
    
    if (agentResults.requirements?.requirements?.length > 0) {
      sections.push('2. **Requirements**: Review and formalize the identified requirements');
    }
    
    if (agentResults.user_perspective?.personas?.length > 0) {
      sections.push('3. **User Focus**: Consider the identified user personas in future development');
    }
    
    if (agentResults.documentation?.documentationGaps?.length > 0) {
      sections.push('4. **Documentation**: Address the identified gaps to improve clarity');
    }
    
    sections.push('5. **Quality**: Continue structured analysis for comprehensive understanding');
    sections.push('');

    // Footer
    sections.push('---');
    sections.push('');
    sections.push('*This report was generated by the Multi-Agent Documentation Analyzer*');

    return sections.join('\n');
  }

  generateHTML(markdownContent: string): string {
    // Simple Markdown to HTML conversion
    let html = markdownContent;

    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Lists
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraphs
    html = '<p>' + html + '</p>';

    // Fix list wrapping
    html = html.replace(/<p>(<li>.*?<\/li>)<\/p>/g, '<ul>$1</ul>');
    html = html.replace(/<\/li><br><li>/g, '</li><li>');

    // Basic HTML structure
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Multi-Agent Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3, h4 { color: #333; }
        h1 { border-bottom: 2px solid #333; }
        h2 { border-bottom: 1px solid #666; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        ul, ol { margin-left: 20px; }
        hr { margin: 20px 0; }
        .meta { color: #666; font-style: italic; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
  }
}