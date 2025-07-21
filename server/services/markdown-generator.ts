export class MarkdownGenerator {
  generateMarkdown(agentResults: Record<string, any>, messages: any[]): string {
    const sections: string[] = [];

    // Title
    sections.push('# OdyC Multi-Agent Documentation Analysis');
    sections.push('');
    sections.push(`*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`);
    sections.push('');

    // Executive Summary
    sections.push('## Executive Summary');
    sections.push('');
    sections.push(`This document presents the results of a comprehensive analysis of ${messages.length} chat messages using our multi-agent documentation analyzer. The analysis was performed by multiple specialized agents, each focusing on different aspects of the conversation data.`);
    sections.push('');

    // Overview
    if (agentResults.structure) {
      sections.push('## Analysis Overview');
      sections.push('');
      sections.push(`- **Total Messages**: ${agentResults.structure.messageCount || messages.length}`);
      sections.push(`- **Topics Identified**: ${agentResults.structure.topicCount || 'N/A'}`);
      sections.push(`- **Document Sections**: ${agentResults.structure.sections?.length || 0}`);
      if (agentResults.meta?.messageStats) {
        sections.push(`- **Message Ratio (User/Assistant)**: ${agentResults.meta.messageStats.messageRatio}`);
      }
      sections.push('');
    }

    // Requirements Analysis
    if (agentResults.requirements) {
      sections.push('## Requirements Analysis');
      sections.push('');
      sections.push(`The Requirements Agent identified ${agentResults.requirements.requirements?.length || 0} key requirements from the conversation:`);
      sections.push('');
      
      if (agentResults.requirements.requirements?.length > 0) {
        agentResults.requirements.requirements.forEach((req: string, index: number) => {
          sections.push(`${index + 1}. ${req}`);
        });
        sections.push('');
      }

      if (agentResults.requirements.requirementDensity) {
        sections.push(`**Requirement Density**: ${Math.round(agentResults.requirements.requirementDensity * 100)}% of messages contain requirement-related content.`);
        sections.push('');
      }
    }

    // User Perspectives
    if (agentResults.user_perspective) {
      sections.push('## User Perspectives & Personas');
      sections.push('');
      
      if (agentResults.user_perspective.personas?.length > 0) {
        sections.push('### Identified User Personas:');
        sections.push('');
        agentResults.user_perspective.personas.forEach((persona: any) => {
          sections.push(`**${persona.persona.charAt(0).toUpperCase() + persona.persona.slice(1)}**: ${persona.messageCount} relevant messages`);
          if (persona.examples?.length > 0) {
            sections.push('');
            persona.examples.forEach((example: string) => {
              sections.push(`- ${example}`);
            });
          }
          sections.push('');
        });
      }

      if (agentResults.user_perspective.userPerspectives?.length > 0) {
        sections.push('### User Needs & Feedback:');
        sections.push('');
        agentResults.user_perspective.userPerspectives.slice(0, 10).forEach((perspective: string, index: number) => {
          sections.push(`${index + 1}. ${perspective}`);
        });
        sections.push('');
      }
    }

    // Document Structure
    if (agentResults.structure?.sections) {
      sections.push('## Recommended Document Structure');
      sections.push('');
      sections.push('Based on the conversation analysis, the following document structure is recommended:');
      sections.push('');
      agentResults.structure.sections.forEach((section: string, index: number) => {
        sections.push(`${index + 1}. ${section}`);
      });
      sections.push('');
    }

    // Documentation Gaps
    if (agentResults.documentation) {
      sections.push('## Documentation Gaps & Open Questions');
      sections.push('');
      
      if (agentResults.documentation.documentationGaps?.length > 0) {
        sections.push('The following areas require additional documentation or clarification:');
        sections.push('');
        agentResults.documentation.documentationGaps.slice(0, 10).forEach((gap: string, index: number) => {
          sections.push(`${index + 1}. ${gap}`);
        });
        sections.push('');
      }

      if (agentResults.documentation.gapDensity) {
        sections.push(`**Documentation Gap Density**: ${Math.round(agentResults.documentation.gapDensity * 100)}% of messages indicate missing or unclear information.`);
        sections.push('');
      }
    }

    // Meta Analysis
    if (agentResults.meta) {
      sections.push('## Meta Analysis & Quality Insights');
      sections.push('');
      
      if (agentResults.meta.metaInsights?.length > 0) {
        sections.push('### Quality Assessment:');
        sections.push('');
        agentResults.meta.metaInsights.forEach((insight: string) => {
          sections.push(`- ${insight}`);
        });
        sections.push('');
      }

      if (agentResults.meta.topWords?.length > 0) {
        sections.push(`### Key Themes: ${agentResults.meta.topWords.join(', ')}`);
        sections.push('');
      }

      if (agentResults.meta.analysisQuality) {
        sections.push(`**Analysis Quality**: ${agentResults.meta.analysisQuality}`);
        sections.push('');
      }
    }

    // Next Steps
    sections.push('## Recommended Next Steps');
    sections.push('');
    sections.push('Based on this analysis, we recommend the following actions:');
    sections.push('');
    sections.push('1. **Address Documentation Gaps**: Focus on the identified unclear areas and missing information');
    sections.push('2. **Implement Key Requirements**: Prioritize the extracted requirements based on frequency and importance');
    sections.push('3. **Enhance User Experience**: Consider the identified user personas in future development');
    sections.push('4. **Structure Documentation**: Use the recommended document structure for organizing information');
    sections.push('5. **Continuous Monitoring**: Regularly analyze new conversations to maintain documentation quality');
    sections.push('');

    // Technical Details
    sections.push('## Technical Analysis Details');
    sections.push('');
    sections.push('### Agent Performance Summary:');
    sections.push('');
    
    if (agentResults.structure) {
      sections.push('- **Structure Agent**: ✓ Completed - Generated document outline and topic analysis');
    }
    if (agentResults.requirements) {
      sections.push('- **Requirements Agent**: ✓ Completed - Extracted functional and technical requirements');
    }
    if (agentResults.user_perspective) {
      sections.push('- **User Perspective Agent**: ✓ Completed - Identified user personas and needs');
    }
    if (agentResults.documentation) {
      sections.push('- **Documentation Agent**: ✓ Completed - Found documentation gaps and questions');
    }
    if (agentResults.meta) {
      sections.push('- **Meta Agent**: ✓ Completed - Provided quality assessment and insights');
    }
    
    sections.push('');
    sections.push(`**Total Processing Time**: ${Date.now() - Date.now()} seconds (estimated)`);
    sections.push('');

    // Footer
    sections.push('---');
    sections.push('');
    sections.push('*This document was automatically generated by the OdyC Multi-Agent Documentation Analyzer.*');

    return sections.join('\n');
  }

  generateHTML(markdownContent: string): string {
    // Simple markdown to HTML conversion
    let html = markdownContent
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Line breaks
      .replace(/\n/g, '<br>');

    // Wrap in basic HTML structure
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OdyC Multi-Agent Analysis Report</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
        }
        h1 { color: #1976D2; border-bottom: 3px solid #1976D2; }
        h2 { color: #1565C0; border-bottom: 1px solid #E0E0E0; }
        h3 { color: #0D47A1; }
        li { margin: 5px 0; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        hr { margin: 30px 0; border: none; border-top: 2px solid #E0E0E0; }
    </style>
</head>
<body>
    <p>${html}</p>
</body>
</html>`;
  }
}
