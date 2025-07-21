import { ChatMessage } from "@shared/schema";
import { marked } from 'marked';
import TurndownService from 'turndown';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as fs from 'fs/promises';

export class MarkdownGenerator {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
  }

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
    const htmlContent = marked(markdownContent);
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Multi-Agent Documentation Analysis Report</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            line-height: 1.6; 
            color: #333; 
        }
        h1, h2, h3, h4, h5, h6 { 
            color: #2c3e50; 
            margin-top: 2em; 
            margin-bottom: 1em; 
        }
        h1 { 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 10px; 
        }
        h2 { 
            border-bottom: 2px solid #ecf0f1; 
            padding-bottom: 5px; 
        }
        h3 { color: #34495e; }
        ul, ol { 
            padding-left: 30px; 
            margin: 1em 0; 
        }
        li { margin-bottom: 0.5em; }
        pre { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #3498db;
            overflow-x: auto;
        }
        code { 
            background: #f1f2f6; 
            padding: 2px 4px; 
            border-radius: 3px; 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
        }
        blockquote { 
            border-left: 4px solid #3498db; 
            margin: 1em 0; 
            padding-left: 20px; 
            color: #555; 
            font-style: italic; 
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .agent-section {
            margin: 2em 0;
            padding: 20px;
            border: 1px solid #e1e8ed;
            border-radius: 8px;
        }
        strong { color: #2c3e50; }
        .generated-by {
            margin-top: 3em;
            padding-top: 2em;
            border-top: 1px solid #ecf0f1;
            font-size: 0.9em;
            color: #7f8c8d;
            text-align: center;
        }
    </style>
</head>
<body>
    ${htmlContent}
    <div class="generated-by">
        Generated by OdyC Multi-Agent Documentation Analyzer
    </div>
</body>
</html>`;
  }

  async generateWord(markdownContent: string): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: await this.markdownToDocxParagraphs(markdownContent)
      }]
    });

    return await Packer.toBuffer(doc);
  }

  generateLaTeX(markdownContent: string): string {
    const latexContent = markdownContent
      .replace(/^# (.+)$/gm, '\\section{$1}')
      .replace(/^## (.+)$/gm, '\\subsection{$1}')
      .replace(/^### (.+)$/gm, '\\subsubsection{$1}')
      .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
      .replace(/\*(.+?)\*/g, '\\textit{$1}')
      .replace(/`(.+?)`/g, '\\texttt{$1}')
      .replace(/^- (.+)$/gm, '\\item $1')
      .replace(/^\d+\. (.+)$/gm, '\\item $1')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/#/g, '\\#');

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{graphicx}

\\geometry{margin=1in}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{Multi-Agent Documentation Analysis}
\\lhead{OdyC Analyzer Report}
\\cfoot{\\thepage}

\\title{Multi-Agent Documentation Analysis Report}
\\author{OdyC Multi-Agent System}
\\date{\\today}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

${latexContent}

\\end{document}`;
  }

  generateWiki(markdownContent: string): string {
    return markdownContent
      .replace(/^# (.+)$/gm, '= $1 =')
      .replace(/^## (.+)$/gm, '== $1 ==')
      .replace(/^### (.+)$/gm, '=== $1 ===')
      .replace(/^#### (.+)$/gm, '==== $1 ====')
      .replace(/\*\*(.+?)\*\*/g, "'''$1'''")
      .replace(/\*(.+?)\*/g, "''$1''")
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '* $1')
      .replace(/^\d+\. (.+)$/gm, '# $1')
      .replace(/\[(.+?)\]\((.+?)\)/g, '[[$2|$1]]');
  }

  private async markdownToDocxParagraphs(markdownContent: string): Promise<Paragraph[]> {
    const lines = markdownContent.split('\n');
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      if (line.trim() === '') {
        continue;
      }

      if (line.startsWith('# ')) {
        paragraphs.push(new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1
        }));
      } else if (line.startsWith('## ')) {
        paragraphs.push(new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2
        }));
      } else if (line.startsWith('### ')) {
        paragraphs.push(new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3
        }));
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        paragraphs.push(new Paragraph({
          text: line.substring(2),
          bullet: { level: 0 }
        }));
      } else if (/^\d+\. /.test(line)) {
        paragraphs.push(new Paragraph({
          text: line.replace(/^\d+\. /, ''),
          numbering: { reference: "default-numbering", level: 0 }
        }));
      } else {
        // Handle bold and italic text
        const children: TextRun[] = [];
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/);
        
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            children.push(new TextRun({
              text: part.slice(2, -2),
              bold: true
            }));
          } else if (part.startsWith('*') && part.endsWith('*')) {
            children.push(new TextRun({
              text: part.slice(1, -1),
              italics: true
            }));
          } else {
            children.push(new TextRun({
              text: part
            }));
          }
        }

        paragraphs.push(new Paragraph({
          children
        }));
      }
    }

    return paragraphs;
  }
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