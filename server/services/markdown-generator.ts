import { ChatMessage } from "@shared/schema";
import { marked } from 'marked';
import TurndownService from 'turndown';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

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
    sections.push('This report presents a comprehensive AI-powered analysis of the provided conversation data through specialized agents.');
    sections.push('Each agent provides unique insights into different aspects of the discussion using advanced language models.');
    sections.push('');

    // Structure Analysis
    if (agentResults.structure) {
      sections.push('## Document Structure Analysis');
      sections.push('');
      const structure = agentResults.structure;
      
      if (structure.aiModel) {
        sections.push(`*Analyzed using ${structure.aiModel} (${structure.aiProvider})*`);
        sections.push('');
      }
      
      if (structure.sections?.length > 0) {
        sections.push('### Suggested Document Outline:');
        structure.sections.forEach((section: string, index: number) => {
          sections.push(`${index + 1}. ${section}`);
        });
        sections.push('');
      }
      
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

      if (structure.insights?.length > 0) {
        sections.push('### AI Insights:');
        structure.insights.forEach((insight: string, index: number) => {
          sections.push(`${index + 1}. ${insight}`);
        });
        sections.push('');
      }
    }

    // Requirements Analysis
    if (agentResults.requirements) {
      sections.push('## Requirements Analysis');
      sections.push('');
      const requirements = agentResults.requirements;
      
      if (requirements.aiModel) {
        sections.push(`*Analyzed using ${requirements.aiModel} (${requirements.aiProvider})*`);
        sections.push('');
      }
      
      sections.push(`**Requirement density**: ${(requirements.requirementDensity * 100).toFixed(1)}% of messages contain requirement indicators`);
      sections.push('');
      
      if (requirements.functional?.length > 0) {
        sections.push('### Functional Requirements:');
        requirements.functional.forEach((req: string, index: number) => {
          sections.push(`${index + 1}. ${req}`);
        });
        sections.push('');
      }

      if (requirements.nonFunctional?.length > 0) {
        sections.push('### Non-Functional Requirements:');
        requirements.nonFunctional.forEach((req: string, index: number) => {
          sections.push(`${index + 1}. ${req}`);
        });
        sections.push('');
      }

      if (requirements.technical?.length > 0) {
        sections.push('### Technical Requirements:');
        requirements.technical.forEach((req: string, index: number) => {
          sections.push(`${index + 1}. ${req}`);
        });
        sections.push('');
      }

      if (requirements.summary) {
        sections.push('### Analysis Summary:');
        sections.push(requirements.summary);
        sections.push('');
      }
    }

    // User Perspective Analysis
    if (agentResults.user_perspective) {
      sections.push('## User Perspective Analysis');
      sections.push('');
      const userPerspective = agentResults.user_perspective;
      
      if (userPerspective.aiModel) {
        sections.push(`*Analyzed using ${userPerspective.aiModel} (${userPerspective.aiProvider})*`);
        sections.push('');
      }

      if (userPerspective.personas?.length > 0) {
        sections.push('### Identified User Personas:');
        userPerspective.personas.forEach((persona: string, index: number) => {
          sections.push(`${index + 1}. ${persona}`);
        });
        sections.push('');
      }

      if (userPerspective.userNeeds?.length > 0) {
        sections.push('### User Needs and Pain Points:');
        userPerspective.userNeeds.forEach((need: string, index: number) => {
          sections.push(`${index + 1}. ${need}`);
        });
        sections.push('');
      }

      if (userPerspective.feedback?.length > 0) {
        sections.push('### User Feedback:');
        userPerspective.feedback.forEach((feedback: string, index: number) => {
          sections.push(`${index + 1}. ${feedback}`);
        });
        sections.push('');
      }

      if (userPerspective.insights?.length > 0) {
        sections.push('### UX Insights:');
        userPerspective.insights.forEach((insight: string, index: number) => {
          sections.push(`${index + 1}. ${insight}`);
        });
        sections.push('');
      }
    }

    // Documentation Analysis
    if (agentResults.documentation) {
      sections.push('## Documentation Gap Analysis');
      sections.push('');
      const documentation = agentResults.documentation;
      
      if (documentation.aiModel) {
        sections.push(`*Analyzed using ${documentation.aiModel} (${documentation.aiProvider})*`);
        sections.push('');
      }
      
      sections.push(`**Gap density**: ${(documentation.gapDensity * 100).toFixed(1)}% of messages indicate potential documentation gaps`);
      sections.push('');

      if (documentation.gaps?.length > 0) {
        sections.push('### Identified Documentation Gaps:');
        documentation.gaps.forEach((gap: string, index: number) => {
          sections.push(`${index + 1}. ${gap}`);
        });
        sections.push('');
      }

      if (documentation.suggestions?.length > 0) {
        sections.push('### Documentation Suggestions:');
        documentation.suggestions.forEach((suggestion: string, index: number) => {
          sections.push(`${index + 1}. ${suggestion}`);
        });
        sections.push('');
      }

      if (documentation.priorities?.length > 0) {
        sections.push('### Priority Areas:');
        documentation.priorities.forEach((priority: string) => {
          sections.push(`- **${priority.charAt(0).toUpperCase() + priority.slice(1)}**`);
        });
        sections.push('');
      }
    }

    // Meta Analysis
    if (agentResults.meta) {
      sections.push('## Meta Analysis & Quality Assessment');
      sections.push('');
      const meta = agentResults.meta;
      
      if (meta.aiModel) {
        sections.push(`*Analyzed using ${meta.aiModel} (${meta.aiProvider})*`);
        sections.push('');
      }
      
      if (meta.qualityAssessment) {
        sections.push('### Overall Quality Assessment:');
        sections.push(meta.qualityAssessment);
        sections.push('');
      }

      if (meta.messageStats) {
        sections.push('### Conversation Statistics:');
        sections.push(`- **Total messages**: ${meta.messageStats.total}`);
        
        if (meta.messageStats.byRole) {
          sections.push('- **Message Distribution by Role**:');
          Object.entries(meta.messageStats.byRole).forEach(([role, msgs]: [string, any]) => {
            sections.push(`  - ${role}: ${msgs.length} messages`);
          });
        }
        sections.push('');
      }

      if (meta.patterns?.length > 0) {
        sections.push('### Communication Patterns:');
        meta.patterns.forEach((pattern: string, index: number) => {
          sections.push(`${index + 1}. ${pattern}`);
        });
        sections.push('');
      }

      if (meta.themes?.length > 0) {
        sections.push('### Recurring Themes:');
        meta.themes.forEach((theme: string, index: number) => {
          sections.push(`${index + 1}. ${theme}`);
        });
        sections.push('');
      }

      if (meta.insights?.length > 0) {
        sections.push('### Meta Insights:');
        meta.insights.forEach((insight: string, index: number) => {
          sections.push(`${index + 1}. ${insight}`);
        });
        sections.push('');
      }
    }

    // Recommendations
    sections.push('## AI-Generated Recommendations');
    sections.push('');
    sections.push('Based on the comprehensive multi-agent analysis, the AI system recommends:');
    sections.push('');
    
    if (agentResults.structure?.sections?.length > 0) {
      sections.push('1. **Structure**: Follow the AI-suggested document outline to organize content effectively');
    }
    
    if (agentResults.requirements?.functional?.length > 0 || agentResults.requirements?.technical?.length > 0) {
      sections.push('2. **Requirements**: Review and formalize the AI-identified requirements');
    }
    
    if (agentResults.user_perspective?.personas?.length > 0) {
      sections.push('3. **User Focus**: Consider the AI-identified user personas in future development');
    }
    
    if (agentResults.documentation?.gaps?.length > 0) {
      sections.push('4. **Documentation**: Address the AI-identified gaps to improve clarity');
    }
    
    sections.push('5. **Quality**: Continue leveraging AI-powered analysis for comprehensive understanding');
    sections.push('');

    // Footer
    sections.push('---');
    sections.push('');
    sections.push('*This report was generated by the OdyC Multi-Agent AI Documentation Analyzer*');
    sections.push(`*Analysis powered by OpenAI GPT-4 and Anthropic Claude-3.5-Sonnet*`);

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
        .ai-attribution {
            background: #e8f4fd;
            padding: 10px;
            border-radius: 5px;
            font-style: italic;
            color: #2980b9;
            margin: 1em 0;
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
        .ai-powered {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 2em 0;
        }
    </style>
</head>
<body>
    ${htmlContent}
    <div class="ai-powered">
        <strong>AI-Powered Analysis</strong><br>
        Generated by OdyC Multi-Agent Documentation Analyzer<br>
        Using OpenAI GPT-4 and Anthropic Claude-3.5-Sonnet
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
\\usepackage{xcolor}

\\geometry{margin=1in}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{Multi-Agent AI Documentation Analysis}
\\lhead{OdyC Analyzer Report}
\\cfoot{\\thepage}

\\title{Multi-Agent Documentation Analysis Report\\\\
{\\large AI-Powered Analysis using GPT-4 and Claude-3.5-Sonnet}}
\\author{OdyC Multi-Agent System}
\\date{\\today}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

${latexContent}

\\vfill
\\begin{center}
\\textcolor{blue}{\\textbf{AI-Powered Analysis}}\\\\
Generated by OdyC Multi-Agent Documentation Analyzer\\\\
Using OpenAI GPT-4 and Anthropic Claude-3.5-Sonnet
\\end{center}

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
      .replace(/\[(.+?)\]\((.+?)\)/g, '[[$2|$1]]')
      + `\n\n{{AI-Powered}}\nGenerated by OdyC Multi-Agent Documentation Analyzer using OpenAI GPT-4 and Anthropic Claude-3.5-Sonnet\n{{/AI-Powered}}`;
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
}