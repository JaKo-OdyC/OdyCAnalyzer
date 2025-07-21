# OdyC Multi-Agent Documentation Analyzer

## Overview

This is a full-stack web application built to analyze OdyC chat and project data using multiple AI agents. The system ingests exported chat data, processes it through specialized AI agents, and generates comprehensive documentation. It features a modern React frontend with a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and a modular multi-agent architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack monorepo architecture with clear separation between client and server code:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **File Upload**: Multer for handling multipart form data
- **Database**: PostgreSQL with Drizzle ORM (migrated from in-memory storage)
- **Schema Validation**: Zod for runtime type checking
- **Development**: tsx for TypeScript execution in development

### Multi-Agent Processing System
The core innovation is a modular agent orchestration system that processes uploaded files through specialized AI agents:

- **Structure Agent**: Analyzes document organization and suggests improvements
- **Requirements Agent**: Extracts technical requirements and specifications  
- **User Perspective Agent**: Identifies user needs and feedback patterns
- **Documentation Agent**: Finds gaps and generates comprehensive docs
- **Meta Agent**: Provides reflexive analysis and identifies improvements

## Key Components

### Data Flow Architecture
1. **Data Input**: Users can either upload files (JSON, Markdown, TXT) OR analyze ChatGPT shared conversation URLs
2. **File Processing**: Background service parses files and extracts chat messages
3. **URL Processing**: Web scraper extracts conversation data from ChatGPT share links
4. **Agent Orchestration**: Multiple specialized agents analyze the data in parallel
5. **Result Aggregation**: Agent outputs are combined and stored
6. **Documentation Generation**: Markdown reports are generated from analysis results

### Database Schema
The PostgreSQL schema supports the complete workflow:

- `uploaded_files`: Stores file metadata and content
- `chat_messages`: Parsed messages with metadata (topic, role, timestamp)
- `agents`: Configurable agent definitions with settings
- `analysis_runs`: Tracks processing status and results
- `agent_logs`: Detailed logging for debugging and monitoring
- `documentation_output`: Generated reports in multiple formats

### API Design
RESTful endpoints handle all operations:

- `POST /api/files/upload`: File upload with validation
- `POST /api/files/analyze-url`: Analyze ChatGPT share URLs and other conversation links
- `GET /api/files`: List uploaded files and URL-extracted conversations
- `POST /api/analysis/start`: Begin multi-agent analysis
- `GET /api/analysis/:id`: Check analysis progress
- `GET /api/agents`: Manage agent configuration
- `GET /api/logs`: Real-time processing logs

### Component Architecture
The frontend uses a modular component system:

- **FileUpload**: Tabbed interface supporting both drag-and-drop file upload AND ChatGPT URL analysis
- **UrlProcessor**: Backend service for scraping and extracting ChatGPT conversation data
- **AgentCard**: Individual agent configuration and status
- **AnalysisPipeline**: Orchestrates the analysis workflow
- **RealtimeLogs**: Live processing status updates
- **DocumentationPreview**: Generated report display and export

## Data Flow

1. **Upload Phase**: Files are uploaded, validated, and stored with metadata in PostgreSQL database
2. **Parsing Phase**: Background service extracts chat messages and metadata, persisted to database
3. **Analysis Phase**: Agent orchestrator runs specialized agents in parallel, with logs stored
4. **Aggregation Phase**: Results from all agents are combined and processed in database
5. **Generation Phase**: Comprehensive documentation is generated in multiple formats
6. **Export Phase**: Users can download reports as Markdown, JSON, or other formats

## Recent Changes

**January 21, 2025**: Successfully prepared project for GitHub publication with comprehensive documentation
- Created complete GitHub-ready documentation suite:
  - Professional README.md with feature highlights, installation guide, and usage instructions
  - Comprehensive CONTRIBUTING.md with development guidelines and contribution process
  - Security policy (SECURITY.md) with vulnerability reporting and best practices
  - MIT license for open source distribution
  - Complete CHANGELOG.md documenting v1.0.0 release
  - Environment configuration template (.env.example)
  - Comprehensive .gitignore with proper exclusions
- Organized docs directory with detailed guides:
  - API.md: Complete API reference with examples and SDK snippets
  - DEPLOYMENT.md: Multi-platform deployment guide (Replit, Docker, cloud providers)
  - DEVELOPMENT.md: Developer guide with architecture, testing, and debugging
- Project structure optimized for open source collaboration
- All documentation follows professional standards for GitHub projects
- Ready for public GitHub repository publication

**Earlier Today**: Successfully implemented multiple output formats support (HTML, Word, LaTeX, Wiki)
- Enhanced markdown generator with comprehensive output format support
- Added download API endpoints for all formats with proper MIME types
- Updated frontend export interface with format icons and descriptions
- All formats include AI model attribution and enhanced professional styling

**Earlier Today**: Successfully integrated real AI-powered multi-agent orchestration
- Created AI service layer with OpenAI and Anthropic API integration
- Replaced mock agents with real AI-powered analysis using GPT-4 and Claude-3.5-Sonnet
- Implemented intelligent provider fallback system for reliability
- Enhanced agent orchestrator with sophisticated AI prompts for each agent type
- All agents now generate rich, contextual insights instead of simple pattern matching

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL connection driver
- **drizzle-orm**: Type-safe ORM with excellent TypeScript integration
- **@tanstack/react-query**: Powerful data fetching and caching
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime schema validation

### Development Tools
- **tsx**: TypeScript execution for Node.js
- **vite**: Fast build tool with HMR
- **drizzle-kit**: Database migrations and introspection
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### File Processing & URL Analysis
- **multer**: Multipart form data handling
- **react-dropzone**: Drag-and-drop file uploads
- **axios**: HTTP client for fetching shared conversations
- **cheerio**: Server-side HTML parsing for conversation extraction

## Deployment Strategy

The application is designed for deployment on Replit with the following considerations:

### Build Process
- **Development**: `npm run dev` - Runs both Vite dev server and Express API
- **Production Build**: `npm run build` - Compiles both frontend and backend
- **Database**: `npm run db:push` - Applies schema changes to PostgreSQL

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment flag for production optimizations
- **PORT**: Server port (defaults handled by Replit)

### Architectural Decisions

**Database Choice**: PostgreSQL was chosen over SQLite for its robust JSON support, better concurrent access handling, and scalability for processing large chat datasets.

**ORM Selection**: Drizzle was selected over Prisma for its excellent TypeScript integration, lighter runtime footprint, and direct SQL query building capabilities.

**State Management**: TanStack Query was chosen over Redux for its specialized server state management, automatic caching, and excellent developer experience for API integration.

**UI Framework**: shadcn/ui provides the perfect balance of customization and consistency, built on accessible Radix primitives with Tailwind styling.

**File Processing**: The multi-agent architecture allows for extensible analysis pipelines, making it easy to add new analysis capabilities without changing core infrastructure.

The system prioritizes modularity, type safety, and developer experience while maintaining the flexibility to handle various chat data formats and analysis requirements.