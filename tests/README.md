# API Integration Testing Framework

This directory contains comprehensive API integration tests for the OdyCAnalyzer application. The testing framework verifies all external and internal API connections, monitors health, and provides detailed reporting.

## Overview

The API Integration Testing Framework includes:

- **External API Testing**: Tests connectivity to OpenAI, Anthropic, and URL processing capabilities
- **Internal API Testing**: Tests all REST endpoints for proper functionality
- **Health Monitoring**: Continuous monitoring of all API services with detailed health reports
- **Error Handling Validation**: Tests proper error responses and edge cases
- **Performance Testing**: Validates response times and system performance
- **Comprehensive Reporting**: Detailed test results with recommendations

## Files

### Test Scripts

- `api-integration.test.js` - Basic API integration tests
- `comprehensive-api-test.js` - Full comprehensive test suite with detailed reporting
- `api-test-results.json` - Generated test results (created after running tests)

### Server Components

- `../server/services/api-monitor.ts` - API monitoring service for continuous health checks
- Enhanced health endpoints in `../server/routes.ts`

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm run test:install  # Installs form-data for file upload tests
```

2. Optional - Configure environment variables for full testing:
```bash
export OPENAI_API_KEY=your_openai_api_key_here
export ANTHROPIC_API_KEY=your_anthropic_api_key_here  
export DATABASE_URL=your_database_url_here
```

### Basic API Integration Tests

Run basic API integration tests (works with or without server):

```bash
npm run test:api
```

This will:
- Test external API connectivity (OpenAI/Anthropic/URL processing)
- Test internal API endpoints (if server is running)
- Provide basic health assessment

### Comprehensive Test Suite

Run the full comprehensive test suite:

```bash
npm run test:comprehensive
```

This includes:
- All basic tests plus
- Detailed health monitoring tests
- Error handling validation  
- Performance testing
- Comprehensive reporting with recommendations

### Health Monitoring

Check API health in real-time:

```bash
# Basic health check
npm run health

# Detailed health check with all service status
npm run health:detailed

# Text-based health report
npm run health:report
```

## Health Endpoints

The application provides several health monitoring endpoints:

### GET `/api/health`
Basic health status
```json
{
  "status": "healthy",
  "timestamp": "2025-07-22T14:40:21.430Z",
  "services": 4
}
```

### GET `/api/health?detailed=true`
Detailed health status with all services
```json
{
  "overall": "healthy",
  "services": [
    {
      "service": "database",
      "status": "healthy",
      "lastChecked": "2025-07-22T14:40:21.430Z",
      "responseTime": 45
    }
  ],
  "lastUpdate": "2025-07-22T14:40:21.430Z"
}
```

### GET `/api/health/report`
Human-readable text report of all service health

### POST `/api/health/test`
Test specific service connectivity
```json
{
  "service": "openai"
}
```

### GET `/api/info`
API information and endpoint listing

## Test Categories

### 1. Connectivity Tests
- Server availability
- API endpoint accessibility
- Network connectivity

### 2. External API Tests  
- OpenAI API connectivity and authentication
- Anthropic API connectivity and authentication
- URL processing capabilities
- Database connectivity

### 3. Internal API Tests
- File management endpoints
- Analysis endpoints
- Agent management endpoints
- Logging endpoints
- Health monitoring endpoints

### 4. Error Handling Tests
- Invalid requests
- Missing parameters
- Authentication failures
- Proper error status codes

### 5. Performance Tests
- Response time validation
- Service availability
- Resource usage

## Interpreting Results

### Test Status Indicators

- ✅ **PASS**: Test completed successfully
- ❌ **FAIL**: Test failed and needs attention
- ⚠️ **WARNING**: Test completed with warnings or limitations
- ⏭️ **SKIP**: Test was skipped (usually due to missing dependencies)

### Health Status

- **healthy**: Service is fully operational
- **degraded**: Service is operational but with limitations
- **unhealthy**: Service is not functioning properly
- **not_configured**: Service is not configured (API keys missing)

### Issue Severity

- 🔴 **High**: Critical issues that affect core functionality
- 🟡 **Medium**: Important issues that may impact user experience
- 🟢 **Low**: Minor issues or optimization opportunities

## Recommendations

The test framework provides automatic recommendations:

### Configuration Recommendations
- Set up missing API keys
- Configure database connection
- Environment-specific settings

### Performance Recommendations  
- Optimize slow endpoints
- Consider caching strategies
- Resource optimization

### Security Recommendations
- API key management
- Error message sanitization
- Rate limiting

## Continuous Monitoring

The API Monitor service (`api-monitor.ts`) provides continuous health monitoring:

- Runs health checks every 5 minutes by default
- Caches results for fast health endpoint responses
- Automatically detects service degradation
- Provides detailed error reporting

## Troubleshooting

### Server Not Running
If tests show server connectivity issues:
1. Start the development server: `npm run dev`
2. Verify server is running on port 5000
3. Check firewall and network settings

### External API Issues
If external API tests fail:
1. Verify API keys are correctly set
2. Check network connectivity
3. Verify API quotas and limits
4. Review API documentation for changes

### Database Issues  
If database tests fail:
1. Verify DATABASE_URL is correctly configured
2. Check database server status
3. Verify network connectivity to database
4. Check authentication and permissions

## Integration with CI/CD

The test framework is designed for integration with continuous integration:

```bash
# In your CI pipeline
npm install
npm run test:install
npm run test:comprehensive
```

Test results are saved to `api-test-results.json` for processing by CI tools.

## Contributing

When adding new API endpoints or external integrations:

1. Add corresponding tests in the appropriate test file
2. Update health monitoring in `api-monitor.ts`
3. Add documentation for new endpoints
4. Test both success and failure scenarios
5. Update this README with new testing procedures