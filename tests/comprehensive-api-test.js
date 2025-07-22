#!/usr/bin/env node

/**
 * Comprehensive API Testing and Validation Suite
 * This script performs thorough testing of all API endpoints and integrations
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  baseUrl: 'http://localhost:5000',
  timeout: 30000,
  maxRetries: 3
};

const RESULTS = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    skipped: 0
  },
  tests: [],
  issues: [],
  recommendations: []
};

// Test result logging
function logTest(name, status, details = '', category = 'general') {
  const emoji = {
    pass: '✅',
    fail: '❌', 
    warn: '⚠️',
    skip: '⏭️',
    info: 'ℹ️'
  };

  const result = {
    name,
    status,
    details,
    category,
    timestamp: new Date().toISOString()
  };

  RESULTS.tests.push(result);
  RESULTS.summary.total++;
  RESULTS.summary[status === 'pass' ? 'passed' : 
                   status === 'fail' ? 'failed' :
                   status === 'warn' ? 'warnings' : 'skipped']++;

  console.log(`${emoji[status] || emoji.info} [${category.toUpperCase()}] ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function addRecommendation(type, message, priority = 'medium') {
  RESULTS.recommendations.push({ type, message, priority, timestamp: new Date().toISOString() });
}

function addIssue(service, issue, severity = 'medium') {
  RESULTS.issues.push({ service, issue, severity, timestamp: new Date().toISOString() });
}

// HTTP request helper
async function makeRequest(method, path, data = null, headers = {}) {
  const config = {
    method,
    url: `${CONFIG.baseUrl}${path}`,
    timeout: CONFIG.timeout,
    validateStatus: () => true,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      headers: response.headers,
      timing: response.config.metadata?.timing || null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.response?.status || 0
    };
  }
}

// Test Suite: Server Connectivity
async function testServerConnectivity() {
  console.log('\n🔌 Testing Server Connectivity...\n');

  try {
    const response = await makeRequest('GET', '/api/info');
    
    if (response.success) {
      logTest('Server Availability', 'pass', 
             `Server running on ${CONFIG.baseUrl}`, 'connectivity');
      
      const info = response.data;
      if (info.name === 'OdyCAnalyzer API') {
        logTest('API Identity', 'pass', `Version: ${info.version}`, 'connectivity');
      } else {
        logTest('API Identity', 'warn', 'Unexpected API response', 'connectivity');
      }
    } else {
      logTest('Server Availability', 'fail', 
             `HTTP ${response.status}: ${response.error || 'Server not responding'}`, 'connectivity');
      addIssue('server', 'Server is not running or not accessible', 'high');
      return false;
    }
  } catch (error) {
    logTest('Server Availability', 'fail', error.message, 'connectivity');
    addIssue('server', `Server connection failed: ${error.message}`, 'high');
    return false;
  }

  return true;
}

// Test Suite: Health Monitoring
async function testHealthMonitoring() {
  console.log('\n🏥 Testing Health Monitoring...\n');

  // Test basic health endpoint
  const healthResponse = await makeRequest('GET', '/api/health');
  
  if (healthResponse.success) {
    const health = healthResponse.data;
    logTest('Health Endpoint', 'pass', 
           `Status: ${health.status || health.overall}`, 'health');

    // Test detailed health check
    const detailedResponse = await makeRequest('GET', '/api/health?detailed=true');
    
    if (detailedResponse.success) {
      const detailedHealth = detailedResponse.data;
      logTest('Detailed Health Check', 'pass', 
             `${detailedHealth.services?.length || 0} services monitored`, 'health');
      
      // Analyze service health
      if (detailedHealth.services) {
        const healthyServices = detailedHealth.services.filter(s => s.status === 'healthy').length;
        const totalServices = detailedHealth.services.length;
        
        if (healthyServices === totalServices) {
          logTest('Service Health', 'pass', 
                 `All ${totalServices} services healthy`, 'health');
        } else {
          logTest('Service Health', 'warn', 
                 `${healthyServices}/${totalServices} services healthy`, 'health');
          
          // Log issues for each unhealthy service
          detailedHealth.services
            .filter(s => s.status !== 'healthy')
            .forEach(service => {
              const severity = service.status === 'not_configured' ? 'low' : 
                             service.status === 'degraded' ? 'medium' : 'high';
              addIssue(service.service, 
                      `Service ${service.status}: ${service.error || service.details || 'No details'}`, 
                      severity);
            });
        }
      }
    } else {
      logTest('Detailed Health Check', 'fail', 
             `HTTP ${detailedResponse.status}`, 'health');
    }

    // Test health report
    const reportResponse = await makeRequest('GET', '/api/health/report');
    
    if (reportResponse.success) {
      logTest('Health Report', 'pass', 
             'Health report generated successfully', 'health');
    } else {
      logTest('Health Report', 'fail', 
             `HTTP ${reportResponse.status}`, 'health');
    }

  } else {
    logTest('Health Endpoint', 'fail', 
           `HTTP ${healthResponse.status}: ${healthResponse.error}`, 'health');
    addIssue('health_monitoring', 'Health endpoint not accessible', 'high');
  }
}

// Test Suite: Core API Endpoints
async function testCoreApiEndpoints() {
  console.log('\n🔗 Testing Core API Endpoints...\n');

  const endpoints = [
    { method: 'GET', path: '/api/files', name: 'List Files', expectedMin: 200, expectedMax: 299 },
    { method: 'GET', path: '/api/agents', name: 'List Agents', expectedMin: 200, expectedMax: 299 },
    { method: 'GET', path: '/api/logs', name: 'Get Logs', expectedMin: 200, expectedMax: 299 },
    // Test error handling
    { method: 'GET', path: '/api/files/999999', name: 'Non-existent File', expectedMin: 404, expectedMax: 404 },
    { method: 'GET', path: '/api/analysis/999999', name: 'Non-existent Analysis', expectedMin: 400, expectedMax: 404 },
    { method: 'POST', path: '/api/analysis/start', name: 'Analysis Without Data', expectedMin: 400, expectedMax: 400 }
  ];

  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint.method, endpoint.path, 
                                     endpoint.method === 'POST' ? {} : null);

    const statusInRange = response.status >= endpoint.expectedMin && 
                         response.status <= endpoint.expectedMax;

    if (statusInRange) {
      logTest(endpoint.name, 'pass', 
             `${endpoint.method} ${endpoint.path} → HTTP ${response.status}`, 'api');
    } else {
      logTest(endpoint.name, 'fail', 
             `Expected HTTP ${endpoint.expectedMin}-${endpoint.expectedMax}, got ${response.status}`, 'api');
      addIssue('api_endpoint', `${endpoint.path} returned unexpected status ${response.status}`, 'medium');
    }
  }
}

// Test Suite: External API Integration
async function testExternalApiIntegration() {
  console.log('\n🌐 Testing External API Integration...\n');

  // Test AI service configuration
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (hasOpenAI || hasAnthropic) {
    logTest('AI API Configuration', 'pass', 
           `Configured: ${hasOpenAI ? 'OpenAI ' : ''}${hasAnthropic ? 'Anthropic' : ''}`.trim(), 'external');
  } else {
    logTest('AI API Configuration', 'warn', 
           'No AI API keys configured (OPENAI_API_KEY, ANTHROPIC_API_KEY)', 'external');
    addRecommendation('configuration', 
                     'Configure AI API keys for full functionality', 'medium');
  }

  // Test database configuration
  const hasDatabase = !!process.env.DATABASE_URL;
  
  if (hasDatabase) {
    logTest('Database Configuration', 'pass', 'DATABASE_URL configured', 'external');
  } else {
    logTest('Database Configuration', 'warn', 'DATABASE_URL not configured', 'external');
    addRecommendation('configuration', 
                     'Configure DATABASE_URL for persistent storage', 'high');
  }

  // Test external connectivity (may fail in sandboxed environments)
  try {
    const connectivityTest = await axios({
      method: 'GET',
      url: 'https://httpbin.org/status/200',
      timeout: 5000
    });

    if (connectivityTest.status === 200) {
      logTest('External Connectivity', 'pass', 'Can reach external APIs', 'external');
    } else {
      logTest('External Connectivity', 'warn', 'Limited external connectivity', 'external');
    }
  } catch (error) {
    logTest('External Connectivity', 'warn', 
           'External connectivity limited (may be expected in sandboxed environment)', 'external');
    addRecommendation('environment', 
                     'External API features may be limited in current environment', 'low');
  }
}

// Test Suite: Error Handling
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...\n');

  const errorTests = [
    {
      name: 'Invalid JSON',
      method: 'POST',
      path: '/api/files/analyze-url',
      data: '{"invalid": json}',
      headers: { 'Content-Type': 'application/json' },
      expectError: true
    },
    {
      name: 'Missing Required Field',
      method: 'POST',
      path: '/api/files/analyze-url',
      data: {},
      expectError: true
    },
    {
      name: 'Invalid URL Format',
      method: 'POST',
      path: '/api/files/analyze-url',
      data: { url: 'not-a-valid-url' },
      expectError: true
    }
  ];

  for (const test of errorTests) {
    const response = await makeRequest(test.method, test.path, test.data, test.headers);
    
    const hasError = response.status >= 400;
    
    if (test.expectError && hasError) {
      logTest(test.name, 'pass', 
             `Correctly returned error: HTTP ${response.status}`, 'error_handling');
    } else if (!test.expectError && !hasError) {
      logTest(test.name, 'pass', 
             `Request succeeded as expected: HTTP ${response.status}`, 'error_handling');
    } else {
      logTest(test.name, 'fail', 
             `Expected ${test.expectError ? 'error' : 'success'}, got HTTP ${response.status}`, 'error_handling');
      addIssue('error_handling', `${test.name} did not handle error as expected`, 'medium');
    }
  }
}

// Test Suite: Performance
async function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');

  const performanceTests = [
    { path: '/api/health', name: 'Health Check', maxTime: 1000 },
    { path: '/api/files', name: 'List Files', maxTime: 2000 },
    { path: '/api/agents', name: 'List Agents', maxTime: 1000 }
  ];

  for (const test of performanceTests) {
    const startTime = Date.now();
    const response = await makeRequest('GET', test.path);
    const responseTime = Date.now() - startTime;

    if (response.success && responseTime <= test.maxTime) {
      logTest(test.name, 'pass', 
             `Response time: ${responseTime}ms (< ${test.maxTime}ms)`, 'performance');
    } else if (response.success) {
      logTest(test.name, 'warn', 
             `Response time: ${responseTime}ms (> ${test.maxTime}ms)`, 'performance');
      addIssue('performance', `${test.name} is slower than expected`, 'low');
    } else {
      logTest(test.name, 'fail', 
             `Request failed: HTTP ${response.status}`, 'performance');
    }
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n📊 Comprehensive API Integration Report');
  console.log('='.repeat(60));
  
  // Summary
  console.log(`\n📈 Test Summary:`);
  console.log(`   Total Tests: ${RESULTS.summary.total}`);
  console.log(`   ✅ Passed: ${RESULTS.summary.passed}`);
  console.log(`   ❌ Failed: ${RESULTS.summary.failed}`);
  console.log(`   ⚠️  Warnings: ${RESULTS.summary.warnings}`);
  console.log(`   ⏭️  Skipped: ${RESULTS.summary.skipped}`);
  
  const successRate = RESULTS.summary.total > 0 ? 
    (RESULTS.summary.passed / RESULTS.summary.total * 100).toFixed(1) : 0;
  console.log(`   Success Rate: ${successRate}%`);

  // Issues
  if (RESULTS.issues.length > 0) {
    console.log(`\n🚨 Issues Found (${RESULTS.issues.length}):`);
    RESULTS.issues.forEach((issue, index) => {
      const emoji = issue.severity === 'high' ? '🔴' : 
                   issue.severity === 'medium' ? '🟡' : '🟢';
      console.log(`   ${emoji} [${issue.service.toUpperCase()}] ${issue.issue}`);
    });
  }

  // Recommendations
  if (RESULTS.recommendations.length > 0) {
    console.log(`\n💡 Recommendations (${RESULTS.recommendations.length}):`);
    RESULTS.recommendations.forEach((rec, index) => {
      const emoji = rec.priority === 'high' ? '🔥' : 
                   rec.priority === 'medium' ? '⚠️' : 'ℹ️';
      console.log(`   ${emoji} [${rec.type.toUpperCase()}] ${rec.message}`);
    });
  }

  // Overall assessment
  console.log(`\n🎯 Overall Assessment:`);
  
  if (RESULTS.summary.failed === 0 && RESULTS.summary.warnings === 0) {
    console.log(`   ✅ EXCELLENT: All API integrations are functioning perfectly`);
  } else if (RESULTS.summary.failed === 0) {
    console.log(`   ⚠️  GOOD: API integrations working with minor warnings`);
  } else if (RESULTS.summary.failed <= 2) {
    console.log(`   🔧 NEEDS ATTENTION: Some API integrations require fixes`);
  } else {
    console.log(`   🚨 CRITICAL: Multiple API integrations are failing`);
  }

  console.log('\n' + '='.repeat(60));
  
  // Save detailed results to file
  const reportPath = path.join(__dirname, 'api-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: RESULTS.summary,
    tests: RESULTS.tests,
    issues: RESULTS.issues,
    recommendations: RESULTS.recommendations
  }, null, 2));
  
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
}

// Main test execution
async function runFullTestSuite() {
  console.log('🔍 OdyCAnalyzer Comprehensive API Test Suite');
  console.log('='.repeat(60));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Target: ${CONFIG.baseUrl}\n`);

  try {
    // Test server connectivity first
    const serverAvailable = await testServerConnectivity();
    
    if (serverAvailable) {
      // Run all test suites
      await testHealthMonitoring();
      await testCoreApiEndpoints();
      await testErrorHandling();
      await testPerformance();
    } else {
      logTest('Server Required Tests', 'skip', 
             'Skipping server-dependent tests - server not available', 'connectivity');
    }
    
    // Always run external API tests (don't require server)
    await testExternalApiIntegration();
    
    // Generate comprehensive report
    generateReport();
    
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    addIssue('test_suite', `Test execution failed: ${error.message}`, 'high');
    generateReport();
    process.exit(1);
  }
}

// Export for use as module
export { runFullTestSuite, RESULTS, CONFIG };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullTestSuite().catch(console.error);
}