# Development Guide

Guide for developers working on the OdyC Multi-Agent Documentation Analyzer.

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)
- API keys for OpenAI (required) and Anthropic (optional)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/odyc-multi-agent-analyzer.git
cd odyc-multi-agent-analyzer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## 🏗️ Project Architecture

### Directory Structure
```
├── client/src/                 # React frontend
│   ├── components/            # UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── file-upload.tsx   # File upload interface
│   │   ├── analysis-*.tsx    # Analysis components
│   │   └── ...
│   ├── pages/                # Page components
│   │   ├── dashboard.tsx     # Main dashboard
│   │   └── not-found.tsx     # 404 page
│   ├── lib/                  # Utilities
│   │   ├── utils.ts          # General utilities
│   │   ├── queryClient.ts    # TanStack Query setup
│   │   └── agents.ts         # Agent definitions
│   ├── hooks/                # Custom React hooks
│   └── App.tsx               # Main app component
├── server/                    # Node.js backend
│   ├── services/             # Business logic
│   │   ├── agent-orchestrator.ts    # Multi-agent coordination
│   │   ├── ai-service.ts             # AI provider integration
│   │   ├── file-processor.ts        # File parsing
│   │   ├── url-processor.ts         # URL analysis
│   │   └── markdown-generator-new.ts # Output generation
│   ├── routes.ts             # API endpoints
│   ├── storage.ts            # Database interface
│   ├── db.ts                 # Database connection
│   └── index.ts              # Server entry point
├── shared/                    # Shared types and schemas
│   └── schema.ts             # Database schema with Drizzle
└── docs/                      # Documentation
    ├── API.md                # API documentation
    ├── DEPLOYMENT.md         # Deployment guide
    └── DEVELOPMENT.md        # This file
```

### Technology Stack

#### Frontend Stack
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool with hot module replacement
- **TanStack Query**: Powerful data fetching and caching
- **shadcn/ui**: High-quality React components built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight client-side routing

#### Backend Stack
- **Node.js**: JavaScript runtime with TypeScript
- **Express.js**: Web framework for REST API
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Relational database with JSON support
- **Zod**: Runtime schema validation
- **Multer**: File upload handling

#### AI Integration
- **OpenAI API**: GPT-4 for structured analysis
- **Anthropic API**: Claude-3.5-Sonnet for nuanced insights
- **Provider Fallback**: Intelligent switching between AI services

## 🎨 Code Style Guidelines

### TypeScript Guidelines
```typescript
// Use explicit types for function parameters and returns
async function processFile(fileId: number): Promise<ProcessResult> {
  // Implementation
}

// Use interfaces for object shapes
interface AnalysisResult {
  readonly id: number;
  status: AnalysisStatus;
  results?: AnalysisData;
}

// Use const assertions for literal types
const ANALYSIS_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;
type AnalysisStatus = typeof ANALYSIS_STATUSES[number];
```

### React Guidelines
```tsx
// Use functional components with proper typing
interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
}

export function FileUpload({ onUpload, accept = '.json,.txt,.md' }: FileUploadProps) {
  // Component implementation
}

// Use custom hooks for shared logic
function useAnalysisPolling(analysisId: number) {
  return useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => fetchAnalysis(analysisId),
    refetchInterval: 2000,
    enabled: !!analysisId
  });
}
```

### Backend Guidelines
```typescript
// Use async/await consistently
app.post('/api/analysis/start', async (req, res) => {
  try {
    const { fileId } = insertAnalysisRunSchema.parse(req.body);
    const result = await orchestrator.startAnalysis(fileId);
    res.json(result);
  } catch (error) {
    console.error('Analysis start error:', error);
    res.status(500).json({ message: 'Failed to start analysis' });
  }
});

// Use proper error handling
class AgentOrchestrator {
  async runAnalysis(analysisId: number): Promise<void> {
    try {
      // Analysis logic
    } catch (error) {
      await this.logError(analysisId, error);
      throw error;
    }
  }
}
```

## 🗄️ Database Development

### Schema Management
```bash
# Generate migrations
npm run db:generate

# Push schema changes (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### Schema Patterns
```typescript
// Use consistent naming
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  fileId: integer('file_id').references(() => uploadedFiles.id),
  timestamp: timestamp('timestamp').notNull(),
  role: text('role').$type<'user' | 'assistant'>().notNull(),
  content: text('content').notNull(),
});

// Define relations
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  file: one(uploadedFiles, {
    fields: [chatMessages.fileId],
    references: [uploadedFiles.id],
  }),
}));

// Generate Zod schemas
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
```

## 🤖 AI Agent Development

### Adding New Agents

1. **Define Agent Interface**
```typescript
interface NewAgent {
  analyze(messages: ChatMessage[]): Promise<NewAgentResult>;
}

interface NewAgentResult {
  insights: string[];
  data: Record<string, any>;
  confidence: number;
  aiModel: string;
  aiProvider: string;
}
```

2. **Implement Agent Service**
```typescript
export class NewAgentService implements NewAgent {
  constructor(private aiService: AIService) {}

  async analyze(messages: ChatMessage[]): Promise<NewAgentResult> {
    const prompt = this.buildPrompt(messages);
    const response = await this.aiService.generateResponse(prompt);
    return this.parseResponse(response);
  }

  private buildPrompt(messages: ChatMessage[]): string {
    // Construct agent-specific prompt
  }

  private parseResponse(response: string): NewAgentResult {
    // Parse AI response into structured result
  }
}
```

3. **Register with Orchestrator**
```typescript
// In agent-orchestrator.ts
class AgentOrchestrator {
  private agents = {
    structure: new StructureAgentService(this.aiService),
    requirements: new RequirementsAgentService(this.aiService),
    newAgent: new NewAgentService(this.aiService), // Add here
  };
}
```

4. **Update Database Schema**
```typescript
// Add to shared/schema.ts
export const newAgentResults = pgTable('new_agent_results', {
  id: serial('id').primaryKey(),
  analysisRunId: integer('analysis_run_id').references(() => analysisRuns.id),
  insights: json('insights').$type<string[]>(),
  data: json('data'),
  confidence: real('confidence'),
  aiModel: text('ai_model'),
  aiProvider: text('ai_provider'),
});
```

### AI Service Integration
```typescript
// AI service supports multiple providers
class AIService {
  async generateResponse(prompt: string, options?: AIOptions): Promise<string> {
    try {
      // Try primary provider (OpenAI)
      return await this.openai.generateResponse(prompt, options);
    } catch (error) {
      // Fallback to secondary provider (Anthropic)
      return await this.anthropic.generateResponse(prompt, options);
    }
  }
}
```

## 🎨 Frontend Development

### Component Development
```tsx
// Use shadcn/ui components as base
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Follow established patterns
export function AnalysisCard({ analysis }: { analysis: AnalysisRun }) {
  const { data: output, isLoading } = useQuery({
    queryKey: ['analysis', analysis.id, 'output'],
    queryFn: () => fetchAnalysisOutput(analysis.id),
    enabled: analysis.status === 'completed'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton /> : <OutputDisplay output={output} />}
      </CardContent>
    </Card>
  );
}
```

### State Management
```tsx
// Use TanStack Query for server state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      }
    }
  }
});

// Use React state for local UI state
function FileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    }
  });
}
```

## 🧪 Testing

### Unit Testing
```typescript
// Test utilities and pure functions
describe('parseConversationFile', () => {
  it('should parse valid JSON conversation', () => {
    const input = JSON.stringify({
      messages: [
        { role: 'user', content: 'Hello', timestamp: '2025-01-01T00:00:00Z' }
      ]
    });
    
    const result = parseConversationFile(input, 'conversation.json');
    
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('user');
  });
});
```

### Integration Testing
```typescript
// Test API endpoints
describe('POST /api/analysis/start', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('should start analysis for valid file', async () => {
    const file = await createTestFile();
    
    const response = await request(app)
      .post('/api/analysis/start')
      .send({ fileId: file.id })
      .expect(200);
      
    expect(response.body.status).toBe('pending');
  });
});
```

### End-to-End Testing
```typescript
// Test complete workflows
test('complete analysis workflow', async ({ page }) => {
  await page.goto('/');
  
  // Upload file
  await page.setInputFiles('[data-testid=file-input]', 'test-conversation.json');
  await page.click('[data-testid=upload-button]');
  
  // Start analysis
  await page.click('[data-testid=start-analysis]');
  
  // Wait for completion
  await page.waitForSelector('[data-testid=analysis-complete]');
  
  // Download results
  await page.click('[data-testid=download-html]');
});
```

## 🔍 Debugging

### Backend Debugging
```typescript
// Add comprehensive logging
import debug from 'debug';
const log = debug('odyc:orchestrator');

class AgentOrchestrator {
  async runAnalysis(analysisId: number) {
    log('Starting analysis %d', analysisId);
    
    try {
      const result = await this.processAnalysis(analysisId);
      log('Analysis %d completed successfully', analysisId);
      return result;
    } catch (error) {
      log('Analysis %d failed: %o', analysisId, error);
      throw error;
    }
  }
}

// Use environment variable for debug output
// DEBUG=odyc:* npm run dev
```

### Frontend Debugging
```tsx
// Use React DevTools and TanStack Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes />
      </Router>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### Database Debugging
```bash
# Use Drizzle Studio for visual debugging
npm run db:studio

# Enable query logging
DEBUG=drizzle:* npm run dev

# Monitor database performance
EXPLAIN ANALYZE SELECT * FROM analysis_runs WHERE status = 'running';
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_analysis_runs_status ON analysis_runs(status);
CREATE INDEX idx_chat_messages_file_role ON chat_messages(file_id, role);
CREATE INDEX idx_agent_logs_analysis_timestamp ON agent_logs(analysis_run_id, timestamp);

-- Optimize large file queries
CREATE INDEX idx_uploaded_files_size ON uploaded_files(size) WHERE size > 1048576;
```

### Backend Optimization
```typescript
// Use connection pooling
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Implement request caching
app.use('/api/files', cacheMiddleware(60000)); // 1 minute cache

// Use streaming for large responses
app.get('/api/analysis/:id/download/json', (req, res) => {
  const stream = createReadableStream(data);
  stream.pipe(res);
});
```

### Frontend Optimization
```tsx
// Use React.memo for expensive components
const AnalysisResults = React.memo(({ results }: { results: AnalysisData }) => {
  return <ComplexVisualization data={results} />;
});

// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <List
      height={600}
      itemCount={messages.length}
      itemSize={120}
      itemData={messages}
    >
      {MessageItem}
    </List>
  );
}
```

## 🔒 Security Considerations

### Input Validation
```typescript
// Validate all inputs with Zod
const uploadFileSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size < 50 * 1024 * 1024, 'File too large')
    .refine(file => ['application/json', 'text/plain'].includes(file.type), 'Invalid file type')
});

// Sanitize user content
function sanitizeContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []
  });
}
```

### API Security
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Input size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

## 🚀 Build and Deployment

### Development Build
```bash
# Type checking
npm run type-check

# Build frontend
vite build

# Build backend
esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist
```

### Environment Configuration
```typescript
// Use proper environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure based on environment
const corsOptions = {
  origin: isProduction 
    ? process.env.FRONTEND_URL 
    : true,
  credentials: true
};
```

## 📋 Common Tasks

### Adding a New API Endpoint
1. Define route in `server/routes.ts`
2. Add validation schema using Zod
3. Implement business logic in appropriate service
4. Add error handling and logging
5. Update API documentation
6. Add tests

### Adding a New UI Component
1. Create component in `client/src/components/`
2. Use TypeScript for props interface
3. Follow shadcn/ui patterns
4. Add to Storybook (if using)
5. Write tests
6. Update component documentation

### Database Schema Changes
1. Modify schema in `shared/schema.ts`
2. Generate migration: `npm run db:generate`
3. Test migration locally
4. Update related types and interfaces
5. Update API endpoints if needed
6. Deploy to staging for testing

### Performance Investigation
1. Enable query logging: `DEBUG=drizzle:* npm run dev`
2. Use React DevTools Profiler
3. Monitor bundle size with `npm run build`
4. Check database query performance with `EXPLAIN ANALYZE`
5. Use lighthouse for frontend performance audit

## 📚 Additional Resources

### Documentation
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) - Database GUI
- [React DevTools](https://react.dev/learn/react-developer-tools) - React debugging
- [TanStack Query DevTools](https://tanstack.com/query/latest/docs/react/devtools) - Query debugging
- [PostgreSQL pgAdmin](https://www.pgadmin.org/) - Database administration

### Best Practices
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Use [Semantic Versioning](https://semver.org/) for releases
- Follow [OWASP Security Guidelines](https://owasp.org/) for web security
- Use [TypeScript Handbook](https://www.typescriptlang.org/docs/) for advanced typing

Happy coding! 🚀