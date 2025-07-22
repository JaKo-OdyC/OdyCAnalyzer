<<<<<<< HEAD
# OdyC Multi-Agent Documentation Analyzer

A sophisticated AI-powered documentation analysis system that processes chat conversations and project data through specialized intelligent agents. The system generates comprehensive, structured documentation using multiple AI providers and offers flexible output formats.

## ✨ Features

### 🤖 Multi-Agent AI Architecture
- **Structure Agent**: Organizes conversations into logical document sections
- **Requirements Agent**: Extracts functional, non-functional, and technical requirements
- **User Perspective Agent**: Identifies user personas, needs, and feedback patterns
- **Documentation Agent**: Finds gaps and suggests missing documentation
- **Meta Agent**: Provides high-level insights and quality assessment

### 📊 Multiple Output Formats
- **HTML**: Professional styled reports with modern CSS design
- **Word (DOCX)**: Native Microsoft Word documents with proper formatting
- **LaTeX**: Academic-quality documents ready for publication
- **Wiki**: MediaWiki-compatible markup for documentation platforms
- **Enhanced Markdown**: Improved structure with AI attribution
- **JSON**: Raw structured data for programmatic access

### 📁 Flexible Data Input
- **File Upload**: Drag-and-drop support for JSON, Markdown, and TXT files
- **URL Analysis**: Direct analysis of ChatGPT shared conversation URLs
- **Multiple Formats**: Automatic parsing of various chat export formats

### 🎯 Real-time Processing
- Live analysis progress tracking
- Detailed logging and monitoring
- Background processing with status updates
- Error handling and recovery

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Anthropic API key (optional, for enhanced analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/odyc-multi-agent-analyzer.git
   cd odyc-multi-agent-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/odyc_analyzer
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 📖 Usage

### Uploading Files
1. Click the "Upload Files" tab
2. Drag and drop your conversation files (JSON, Markdown, or TXT)
3. Click "Upload Files" to process

### Analyzing URLs
1. Click the "Analyze URL" tab
2. Paste a ChatGPT shared conversation URL
3. Click "Analyze URL" to extract and process

### Running Analysis
1. Select your uploaded file or URL-extracted conversation
2. Click "Start Analysis" 
3. Monitor real-time progress in the logs
4. Download results in your preferred format

### Output Formats
Once analysis completes, you can export in multiple formats:
- **HTML**: Click "View HTML" for browser display
- **Word**: Download `.docx` file for Microsoft Word
- **LaTeX**: Download `.tex` file for academic publishing
- **Wiki**: Download wiki markup for documentation platforms
- **Markdown**: Download enhanced markdown with AI insights
- **JSON**: Download raw structured data

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite for fast development
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend (Node.js + Express)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **File Processing**: Multer for multipart uploads
- **AI Integration**: OpenAI and Anthropic APIs with intelligent fallback

### Database Schema
- `uploaded_files`: File metadata and content storage
- `chat_messages`: Parsed conversation data with topics and roles
- `agents`: Configurable agent definitions and settings
- `analysis_runs`: Processing status and results tracking
- `agent_logs`: Detailed logging for debugging and monitoring
- `documentation_output`: Generated reports in multiple formats

## 🔧 Configuration

### Agent Configuration
Agents can be customized through the database or admin interface:

```sql
-- Example: Customize Requirements Agent
UPDATE agents SET 
  settings = '{"focus": "technical", "depth": "detailed"}'
WHERE type = 'requirements';
```

### AI Provider Settings
The system supports multiple AI providers with automatic failover:

- **Primary**: OpenAI GPT-4 for structured analysis
- **Secondary**: Anthropic Claude-3.5-Sonnet for nuanced insights
- **Fallback**: Configurable provider hierarchy

## 📊 API Reference

### File Operations
```bash
POST /api/files/upload          # Upload files
POST /api/files/analyze-url     # Analyze ChatGPT URLs
GET  /api/files                 # List all files
GET  /api/files/:id/messages    # Get parsed messages
```

### Analysis Operations
```bash
POST /api/analysis/start        # Start multi-agent analysis
GET  /api/analysis/:id          # Get analysis status
GET  /api/analysis/:id/logs     # Get analysis logs
GET  /api/analysis/:id/output   # Get analysis results
```

### Export Operations
```bash
GET /api/analysis/:id/download/:format  # Download specific format
GET /api/analysis/:id/export/:format    # Export with headers
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Running Tests
```bash
npm test                 # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e        # Run end-to-end tests
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API access
- Anthropic for Claude API access
- The open-source community for excellent tools and libraries

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/odyc-multi-agent-analyzer/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/odyc-multi-agent-analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/odyc-multi-agent-analyzer/discussions)

## 🗺️ Roadmap

- [ ] Support for additional AI providers (Gemini, local models)
- [ ] Advanced conversation threading and context analysis
- [ ] Custom agent plugin system
- [ ] Batch processing for multiple files
- [ ] Advanced export customization options
- [ ] Integration with popular documentation platforms

---

**Built with ❤️ for the documentation community**
=======
# OdyCAnalyzer
>>>>>>> ff3c5eedba04e8b09bfac19057dd823595d5cd59
