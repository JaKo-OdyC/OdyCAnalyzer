# Contributing to OdyC Multi-Agent Documentation Analyzer

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

### 🐛 Reporting Issues
- Use GitHub Issues to report bugs
- Include reproduction steps, expected behavior, and actual behavior
- Provide relevant logs and screenshots
- Check existing issues before creating new ones

### 💡 Suggesting Features
- Open a GitHub Discussion for feature requests
- Explain the use case and potential impact
- Consider implementation complexity and maintenance burden

### 🔧 Code Contributions
- Fix bugs and implement features
- Improve documentation and examples
- Add tests and improve test coverage
- Optimize performance and user experience

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)

### Local Development
1. **Fork and clone the repository**
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
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
├── client/src/                 # React frontend
│   ├── components/            # Reusable UI components
│   ├── pages/                # Page components
│   ├── lib/                  # Utilities and configurations
│   └── hooks/                # Custom React hooks
├── server/                    # Node.js backend
│   ├── services/             # Business logic services
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database interface
│   └── index.ts              # Server entry point
├── shared/                    # Shared types and schemas
│   └── schema.ts             # Database schema and types
└── docs/                      # Additional documentation
```

## 🎨 Code Style

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer interfaces over type aliases for object shapes
- Use proper return types for functions
- Avoid `any` type - use proper typing

### React Guidelines
- Use functional components with hooks
- Prefer composition over inheritance
- Use proper prop typing with TypeScript
- Follow React hooks rules

### Backend Guidelines
- Use async/await for asynchronous operations
- Implement proper error handling
- Use Zod for runtime validation
- Follow REST API conventions

### Database Guidelines
- Use Drizzle ORM for database operations
- Write type-safe database queries
- Use transactions for multi-table operations
- Follow database naming conventions

## 🧪 Testing

### Running Tests
```bash
npm test                 # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests
npm run test:coverage   # Test coverage report
```

### Writing Tests
- Write unit tests for utility functions
- Add integration tests for API endpoints
- Include end-to-end tests for critical workflows
- Aim for good test coverage (>80%)

### Test Structure
```typescript
describe('AgentOrchestrator', () => {
  beforeEach(() => {
    // Setup test environment
  });

  it('should process analysis correctly', async () => {
    // Test implementation
  });

  afterEach(() => {
    // Cleanup
  });
});
```

## 📦 Pull Request Process

### Before Submitting
1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

### Commit Message Format
Use conventional commits format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Maintenance tasks

### Pull Request Guidelines
1. **Create descriptive title and description**
   - Explain what changes were made and why
   - Reference related issues with `Fixes #123`
   - Include screenshots for UI changes

2. **Ensure CI passes**
   - All tests must pass
   - Code must pass linting
   - No TypeScript errors

3. **Request review**
   - Tag relevant maintainers
   - Be responsive to feedback
   - Make requested changes promptly

## 🔍 Code Review Guidelines

### For Reviewers
- Check code quality and adherence to guidelines
- Verify tests are adequate and pass
- Ensure documentation is updated
- Test functionality locally when needed
- Provide constructive feedback

### For Contributors
- Respond to feedback promptly
- Ask questions if feedback is unclear
- Make requested changes or explain why not
- Be patient during the review process

## 🚀 Release Process

### Versioning
We follow Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Steps
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag
4. Publish to npm (if applicable)
5. Deploy to production

## 🎯 Architecture Guidelines

### Adding New Agents
1. **Define agent interface**
   ```typescript
   interface NewAgent {
     analyze(messages: ChatMessage[]): Promise<NewAgentResult>;
   }
   ```

2. **Implement agent service**
   ```typescript
   export class NewAgentService implements NewAgent {
     async analyze(messages: ChatMessage[]): Promise<NewAgentResult> {
       // Implementation
     }
   }
   ```

3. **Register with orchestrator**
   ```typescript
   // Add to agent-orchestrator.ts
   const newAgent = new NewAgentService();
   ```

4. **Add database schema**
   ```typescript
   // Update shared/schema.ts
   export const newAgentResults = pgTable('new_agent_results', {
     // Schema definition
   });
   ```

### Adding Output Formats
1. **Extend markdown generator**
   ```typescript
   async generateNewFormat(results: AnalysisResults): Promise<string> {
     // Format implementation
   }
   ```

2. **Add route handler**
   ```typescript
   app.get('/api/analysis/:id/output/newformat', async (req, res) => {
     // Route implementation
   });
   ```

3. **Update frontend export options**
   ```typescript
   const exportFormats = [
     // Add new format
     { format: 'newformat', label: 'New Format', icon: NewIcon }
   ];
   ```

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and support (if available)

### Documentation
- **README.md**: Project overview and quick start
- **Wiki**: Detailed documentation and guides
- **API Docs**: Generated API documentation
- **Code Comments**: Inline documentation

### Maintainers
- @maintainer1 - Project lead
- @maintainer2 - Backend specialist
- @maintainer3 - Frontend specialist

## 📜 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or inflammatory comments
- Publishing private information
- Other unprofessional conduct

### Reporting
Report issues to maintainers via:
- Email: conduct@project.com
- Direct message to maintainers
- GitHub Issues (for public matters)

## 🎉 Recognition

### Contributors
We recognize all contributors in:
- README.md contributors section
- Release notes and changelogs
- Annual contributor highlights

### Types of Contributions
- Code contributions
- Documentation improvements
- Bug reports and testing
- Community support and mentoring
- Design and UX feedback

Thank you for contributing to OdyC Multi-Agent Documentation Analyzer! 🚀