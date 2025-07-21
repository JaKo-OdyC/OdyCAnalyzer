# API Documentation

Complete API reference for the OdyC Multi-Agent Documentation Analyzer.

## Base URL

```
http://localhost:5000/api  # Development
https://your-domain.com/api  # Production
```

## Authentication

Currently, the API does not require authentication. In production, consider implementing:
- API key authentication
- JWT token-based authentication
- OAuth 2.0 for third-party integrations

## Content Types

All API endpoints expect and return JSON data unless otherwise specified.

```http
Content-Type: application/json
Accept: application/json
```

## Error Responses

Standard error response format:

```json
{
  "message": "Error description",
  "error": "Detailed error information",
  "statusCode": 400
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## File Operations

### Upload File

Upload a conversation file for analysis.

```http
POST /api/files/upload
Content-Type: multipart/form-data
```

**Parameters:**
- `file` (file, required) - The file to upload (JSON, TXT, or Markdown)

**Response:**
```json
{
  "id": 1,
  "filename": "1643723400000-conversation.json",
  "originalName": "conversation.json",
  "size": 15420,
  "contentType": "application/json",
  "uploadedAt": "2025-07-21T19:30:00.000Z",
  "processed": false,
  "content": "...",
  "sourceUrl": null,
  "sourceType": "file"
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/files/upload" \
  -F "file=@conversation.json"
```

### Analyze URL

Extract and analyze a conversation from a shared URL.

```http
POST /api/files/analyze-url
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://chatgpt.com/share/12345678-1234-1234-1234-123456789abc"
}
```

**Response:**
```json
{
  "id": 2,
  "filename": "1643723400000-chatgpt-share.json",
  "originalName": "ChatGPT Conversation",
  "size": 8540,
  "contentType": "application/json",
  "uploadedAt": "2025-07-21T19:35:00.000Z",
  "processed": true,
  "content": "...",
  "sourceUrl": "https://chatgpt.com/share/12345678-1234-1234-1234-123456789abc",
  "sourceType": "chatgpt_share"
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/files/analyze-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://chatgpt.com/share/12345678-1234-1234-1234-123456789abc"}'
```

### List Files

Get all uploaded files and analyzed URLs.

```http
GET /api/files
```

**Response:**
```json
[
  {
    "id": 1,
    "filename": "1643723400000-conversation.json",
    "originalName": "conversation.json",
    "size": 15420,
    "contentType": "application/json",
    "uploadedAt": "2025-07-21T19:30:00.000Z",
    "processed": true,
    "sourceType": "file"
  },
  {
    "id": 2,
    "filename": "1643723400000-chatgpt-share.json",
    "originalName": "ChatGPT Conversation",
    "size": 8540,
    "contentType": "application/json",
    "uploadedAt": "2025-07-21T19:35:00.000Z",
    "processed": true,
    "sourceType": "chatgpt_share"
  }
]
```

**Example:**
```bash
curl "http://localhost:5000/api/files"
```

### Get File Details

Get detailed information about a specific file.

```http
GET /api/files/{fileId}
```

**Response:**
```json
{
  "id": 1,
  "filename": "1643723400000-conversation.json",
  "originalName": "conversation.json",
  "size": 15420,
  "contentType": "application/json",
  "uploadedAt": "2025-07-21T19:30:00.000Z",
  "processed": true,
  "content": "...",
  "sourceUrl": null,
  "sourceType": "file"
}
```

**Example:**
```bash
curl "http://localhost:5000/api/files/1"
```

### Get File Messages

Get parsed chat messages from a file.

```http
GET /api/files/{fileId}/messages
```

**Response:**
```json
[
  {
    "id": 1,
    "fileId": 1,
    "timestamp": "2025-07-21T12:00:00.000Z",
    "role": "user",
    "content": "I need help with documentation analysis.",
    "topic": "project requirements",
    "containerType": null,
    "developmentStage": null
  },
  {
    "id": 2,
    "fileId": 1,
    "timestamp": "2025-07-21T12:01:00.000Z",
    "role": "assistant",
    "content": "I can help you analyze your documentation...",
    "topic": "project requirements",
    "containerType": null,
    "developmentStage": null
  }
]
```

**Example:**
```bash
curl "http://localhost:5000/api/files/1/messages"
```

## Analysis Operations

### Start Analysis

Begin multi-agent analysis on a file.

```http
POST /api/analysis/start
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileId": 1
}
```

**Response:**
```json
{
  "id": 1,
  "fileId": 1,
  "status": "pending",
  "startedAt": "2025-07-21T19:40:00.000Z",
  "completedAt": null,
  "results": null
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/analysis/start" \
  -H "Content-Type: application/json" \
  -d '{"fileId": 1}'
```

### Get Analysis Status

Check the status of an analysis run.

```http
GET /api/analysis/{analysisId}
```

**Response:**
```json
{
  "id": 1,
  "fileId": 1,
  "status": "completed",
  "startedAt": "2025-07-21T19:40:00.000Z",
  "completedAt": "2025-07-21T19:42:30.000Z",
  "results": {
    "structure": { /* Structure agent results */ },
    "requirements": { /* Requirements agent results */ },
    "user_perspective": { /* User perspective agent results */ },
    "documentation": { /* Documentation agent results */ },
    "meta": { /* Meta agent results */ }
  }
}
```

**Status Values:**
- `pending` - Analysis queued but not started
- `running` - Analysis in progress
- `completed` - Analysis finished successfully
- `failed` - Analysis failed with errors

**Example:**
```bash
curl "http://localhost:5000/api/analysis/1"
```

### Get Analysis for File

Get all analysis runs for a specific file.

```http
GET /api/files/{fileId}/analysis
```

**Response:**
```json
[
  {
    "id": 1,
    "fileId": 1,
    "status": "completed",
    "startedAt": "2025-07-21T19:40:00.000Z",
    "completedAt": "2025-07-21T19:42:30.000Z",
    "results": { /* Analysis results */ }
  }
]
```

**Example:**
```bash
curl "http://localhost:5000/api/files/1/analysis"
```

## Logging and Monitoring

### Get Recent Logs

Get recent system logs.

```http
GET /api/logs?limit=50
```

**Query Parameters:**
- `limit` (integer, optional) - Number of logs to return (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "analysisRunId": 1,
    "agentId": 3,
    "level": "info",
    "message": "Started User Perspective Agent",
    "timestamp": "2025-07-21T19:40:15.000Z",
    "data": null
  },
  {
    "id": 2,
    "analysisRunId": 1,
    "agentId": 3,
    "level": "info",
    "message": "AI identified 4 personas using claude-3-5-sonnet",
    "timestamp": "2025-07-21T19:40:25.000Z",
    "data": { "personas": 4, "model": "claude-3-5-sonnet" }
  }
]
```

**Log Levels:**
- `info` - General information
- `warn` - Warning messages
- `error` - Error messages
- `debug` - Debug information

**Example:**
```bash
curl "http://localhost:5000/api/logs?limit=100"
```

### Get Analysis Logs

Get logs for a specific analysis run.

```http
GET /api/analysis/{analysisId}/logs
```

**Response:**
```json
[
  {
    "id": 10,
    "analysisRunId": 1,
    "agentId": null,
    "level": "info",
    "message": "Starting AI-powered analysis pipeline",
    "timestamp": "2025-07-21T19:40:00.000Z",
    "data": null
  },
  {
    "id": 11,
    "analysisRunId": 1,
    "agentId": 1,
    "level": "info",
    "message": "Starting Structure Agent",
    "timestamp": "2025-07-21T19:40:05.000Z",
    "data": null
  }
]
```

**Example:**
```bash
curl "http://localhost:5000/api/analysis/1/logs"
```

## Output and Export

### Get Analysis Output

Get formatted output for an analysis.

```http
GET /api/analysis/{analysisId}/output
```

**Response:**
```json
[
  {
    "id": 1,
    "analysisRunId": 1,
    "format": "markdown",
    "content": "# Multi-Agent Documentation Analysis Report\n\n..."
  },
  {
    "id": 2,
    "analysisRunId": 1,
    "format": "html",
    "content": "<!DOCTYPE html><html>..."
  },
  {
    "id": 3,
    "analysisRunId": 1,
    "format": "json",
    "content": "{\"structure\": {...}, \"requirements\": {...}}"
  }
]
```

**Available Formats:**
- `markdown` - Enhanced Markdown with AI attribution
- `html` - Professional styled HTML report
- `docx` - Microsoft Word document (base64 encoded)
- `latex` - LaTeX document for academic publishing
- `wiki` - MediaWiki-compatible markup
- `json` - Raw structured data

**Example:**
```bash
curl "http://localhost:5000/api/analysis/1/output"
```

### Download Specific Format

Download analysis results in a specific format.

```http
GET /api/analysis/{analysisId}/download/{format}
```

**Parameters:**
- `format` - One of: `markdown`, `html`, `docx`, `latex`, `wiki`, `json`

**Response:**
Raw file content with appropriate headers for download.

**Example:**
```bash
# Download HTML report
curl "http://localhost:5000/api/analysis/1/download/html" \
  -o analysis-report.html

# Download Word document
curl "http://localhost:5000/api/analysis/1/download/docx" \
  -o analysis-report.docx

# Download LaTeX document
curl "http://localhost:5000/api/analysis/1/download/latex" \
  -o analysis-report.tex
```

### Export for Browser Viewing

Export analysis results for browser viewing (without download headers).

```http
GET /api/analysis/{analysisId}/export/{format}
```

**Parameters:**
- `format` - One of: `markdown`, `html`, `json`

**Response:**
Raw content with appropriate MIME type.

**Example:**
```bash
# View HTML in browser
curl "http://localhost:5000/api/analysis/1/export/html"

# Get JSON data
curl "http://localhost:5000/api/analysis/1/export/json"
```

## Agent Management

### Get Agents

Get all available analysis agents.

```http
GET /api/agents
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Structure Agent",
    "type": "structure",
    "description": "Analyzes document structure and organization",
    "settings": {
      "maxSections": 10,
      "includeTopics": true
    }
  },
  {
    "id": 2,
    "name": "Requirements Agent",
    "type": "requirements",
    "description": "Extracts functional and technical requirements",
    "settings": {
      "categories": ["functional", "non-functional", "technical"]
    }
  }
]
```

**Agent Types:**
- `structure` - Document structure analysis
- `requirements` - Requirements extraction
- `user_perspective` - User perspective analysis
- `documentation` - Documentation gap analysis
- `meta` - Meta-analysis and quality assessment

**Example:**
```bash
curl "http://localhost:5000/api/agents"
```

## Rate Limiting

Current implementation does not include rate limiting. For production use, consider implementing:

- Per-IP rate limiting (e.g., 100 requests per minute)
- Per-user rate limiting for authenticated endpoints
- Analysis job throttling to prevent AI API abuse

## WebSocket Support

Real-time updates are not currently implemented via WebSocket, but could be added for:

- Live analysis progress updates
- Real-time log streaming
- Status notifications

## Data Models

### File Model
```typescript
interface File {
  id: number;
  filename: string;
  originalName: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  processed: boolean;
  content: string;
  sourceUrl: string | null;
  sourceType: 'file' | 'chatgpt_share' | 'url';
}
```

### Analysis Run Model
```typescript
interface AnalysisRun {
  id: number;
  fileId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  results: AnalysisResults | null;
}
```

### Analysis Results Model
```typescript
interface AnalysisResults {
  structure: {
    sections: string[];
    topicGroups: string[];
    insights: string[];
    messageCount: number;
    topicCount: number;
    aiModel: string;
    aiProvider: string;
  };
  requirements: {
    functional: string[];
    nonFunctional: string[];
    technical: string[];
    summary: string;
    totalMessages: number;
    requirementDensity: number;
    aiModel: string;
    aiProvider: string;
  };
  user_perspective: {
    personas: string[];
    userNeeds: string[];
    feedback: string[];
    insights: string[];
    totalMessages: number;
    aiModel: string;
    aiProvider: string;
  };
  documentation: {
    gaps: string[];
    suggestions: string[];
    priorities: string[];
    topics: string[];
    totalMessages: number;
    gapDensity: number;
    aiModel: string;
    aiProvider: string;
  };
  meta: {
    insights: string[];
    patterns: string[];
    themes: string[];
    qualityAssessment: string;
    messageStats: object;
    aiModel: string;
    aiProvider: string;
  };
}
```

### Chat Message Model
```typescript
interface ChatMessage {
  id: number;
  fileId: number;
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
  topic: string;
  containerType: string | null;
  developmentStage: string | null;
}
```

### Agent Log Model
```typescript
interface AgentLog {
  id: number;
  analysisRunId: number;
  agentId: number | null;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  data: object | null;
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
class OdyCAnalyzer {
  constructor(baseUrl = 'http://localhost:5000/api') {
    this.baseUrl = baseUrl;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }

  async startAnalysis(fileId) {
    const response = await fetch(`${this.baseUrl}/analysis/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId })
    });
    
    return response.json();
  }

  async getAnalysisStatus(analysisId) {
    const response = await fetch(`${this.baseUrl}/analysis/${analysisId}`);
    return response.json();
  }

  async downloadReport(analysisId, format = 'html') {
    const response = await fetch(`${this.baseUrl}/analysis/${analysisId}/download/${format}`);
    return response.blob();
  }
}

// Usage
const analyzer = new OdyCAnalyzer();
const file = await analyzer.uploadFile(fileInput.files[0]);
const analysis = await analyzer.startAnalysis(file.id);
const report = await analyzer.downloadReport(analysis.id, 'html');
```

### Python
```python
import requests
import json

class OdyCAnalyzer:
    def __init__(self, base_url='http://localhost:5000/api'):
        self.base_url = base_url

    def upload_file(self, file_path):
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f'{self.base_url}/files/upload', files=files)
            return response.json()

    def start_analysis(self, file_id):
        data = {'fileId': file_id}
        response = requests.post(
            f'{self.base_url}/analysis/start',
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        return response.json()

    def get_analysis_status(self, analysis_id):
        response = requests.get(f'{self.base_url}/analysis/{analysis_id}')
        return response.json()

    def download_report(self, analysis_id, format='html'):
        response = requests.get(f'{self.base_url}/analysis/{analysis_id}/download/{format}')
        return response.content

# Usage
analyzer = OdyCAnalyzer()
file_result = analyzer.upload_file('conversation.json')
analysis = analyzer.start_analysis(file_result['id'])
report = analyzer.download_report(analysis['id'], 'html')
```

For more examples and detailed integration guides, see the [GitHub repository](https://github.com/yourusername/odyc-multi-agent-analyzer).