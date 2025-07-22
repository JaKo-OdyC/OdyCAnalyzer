/**
 * API Integration Tests for OdyCAnalyzer
 * Tests all external and internal API integrations
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const config = {
  baseUrl: 'http://localhost:5000',
  timeout: 30000,
  retries: 3,
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  apiEndpoints: [],
  externalApis: []
};

// Utility functions
function logResult(testName, success, details) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (details) {
    console.log(`   Details: ${details}`);
  }
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
}

function logWarning(testName, message) {
  console.log(`⚠️  WARNING: ${testName} - ${message}`);
  testResults.warnings.push({ test: testName, message });
}

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const response = await axios({
      method,
      url: `${config.baseUrl}${url}`,
      data,
      headers,
      timeout: config.timeout,
      validateStatus: () => true // Don't throw on non-2xx status codes
    });
    
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Test External API Integrations
async function testExternalApis() {
  console.log('\n🔍 Testing External API Integrations...\n');
  
  // Test AI Service APIs (OpenAI/Anthropic)
  await testAiApiConnectivity();
  
  // Test URL processing with external requests
  await testUrlProcessingConnectivity();
  
  // Test database connectivity
  await testDatabaseConnectivity();
}

async function testAiApiConnectivity() {
  // Check if AI API keys are configured
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  
  if (!hasOpenAI && !hasAnthropic) {
    logWarning('AI APIs', 'No AI API keys found in environment (OPENAI_API_KEY, ANTHROPIC_API_KEY)');
    testResults.externalApis.push({ name: 'AI APIs', status: 'not_configured', message: 'No API keys found' });
    return;
  }
  
  // Test OpenAI connectivity if configured
  if (hasOpenAI) {
    try {
      const openAIResponse = await axios({
        method: 'GET',
        url: 'https://api.openai.com/v1/models',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (openAIResponse.status === 200) {
        logResult('OpenAI API Connectivity', true, `Available models: ${openAIResponse.data.data?.length || 0}`);
        testResults.externalApis.push({ name: 'OpenAI', status: 'connected', models: openAIResponse.data.data?.length || 0 });
      } else {
        logResult('OpenAI API Connectivity', false, `HTTP ${openAIResponse.status}: ${openAIResponse.data?.error?.message || 'Unknown error'}`);
        testResults.externalApis.push({ name: 'OpenAI', status: 'error', error: openAIResponse.data?.error?.message });
      }
    } catch (error) {
      logResult('OpenAI API Connectivity', false, error.message);
      testResults.externalApis.push({ name: 'OpenAI', status: 'error', error: error.message });
    }
  }
  
  // Test Anthropic connectivity if configured
  if (hasAnthropic) {
    try {
      // Use a minimal message request to test connectivity
      const anthropicResponse = await axios({
        method: 'POST',
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        data: {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        },
        timeout: 10000
      });
      
      if (anthropicResponse.status === 200) {
        logResult('Anthropic API Connectivity', true, 'Successfully connected to Claude API');
        testResults.externalApis.push({ name: 'Anthropic', status: 'connected', model: 'claude-3-haiku-20240307' });
      } else {
        logResult('Anthropic API Connectivity', false, `HTTP ${anthropicResponse.status}: ${anthropicResponse.data?.error?.message || 'Unknown error'}`);
        testResults.externalApis.push({ name: 'Anthropic', status: 'error', error: anthropicResponse.data?.error?.message });
      }
    } catch (error) {
      logResult('Anthropic API Connectivity', false, error.message);
      testResults.externalApis.push({ name: 'Anthropic', status: 'error', error: error.message });
    }
  }
}

async function testUrlProcessingConnectivity() {
  // Test basic HTTP connectivity for URL processing
  const testUrls = [
    'https://httpbin.org/status/200',
    'https://httpbin.org/json',
    'https://example.com'
  ];
  
  for (const testUrl of testUrls) {
    try {
      const response = await axios({
        method: 'GET',
        url: testUrl,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (OdyCAnalyzer Test)'
        }
      });
      
      if (response.status === 200) {
        logResult(`URL Processing - ${testUrl}`, true, `Successfully fetched content (${response.data?.toString().length || 0} chars)`);
      } else {
        logResult(`URL Processing - ${testUrl}`, false, `HTTP ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        logWarning(`URL Processing - ${testUrl}`, 'Network connectivity issue - may be expected in sandboxed environment');
      } else {
        logResult(`URL Processing - ${testUrl}`, false, error.message);
      }
    }
  }
}

async function testDatabaseConnectivity() {
  // Test database connection through the application
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    logWarning('Database Connectivity', 'DATABASE_URL not configured');
    return;
  }
  
  // We'll test this through the API endpoints since we can't directly connect here
  logResult('Database Configuration', true, 'DATABASE_URL is configured');
}

// Test Internal API Endpoints
async function testInternalApis() {
  console.log('\n🔍 Testing Internal API Endpoints...\n');
  
  const endpoints = [
    // File endpoints
    { method: 'GET', path: '/api/files', name: 'List Files' },
    { method: 'GET', path: '/api/agents', name: 'List Agents' },
    { method: 'GET', path: '/api/logs', name: 'Get Logs' },
    
    // Health/info endpoints
    { method: 'GET', path: '/api/files/999999', name: 'Get Non-existent File (should return 404)' },
    { method: 'GET', path: '/api/analysis/999999', name: 'Get Non-existent Analysis (should return 404)' },
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    
    testResults.apiEndpoints.push({
      method: endpoint.method,
      path: endpoint.path,
      status: result.status,
      success: result.success,
      error: result.error
    });
    
    if (result.success || (result.status === 404 && endpoint.path.includes('999999'))) {
      logResult(`${endpoint.name} (${endpoint.method} ${endpoint.path})`, true, `HTTP ${result.status}`);
    } else {
      logResult(`${endpoint.name} (${endpoint.method} ${endpoint.path})`, false, 
               result.error || `HTTP ${result.status}: ${JSON.stringify(result.data)}`);
    }
  }
}

// Check if server is running
async function checkServerStatus() {
  console.log('🚀 Checking if OdyCAnalyzer server is running...\n');
  
  try {
    const response = await axios.get(`${config.baseUrl}/api/files`, { timeout: 5000 });
    logResult('Server Status', true, `Server is running on ${config.baseUrl}`);
    return true;
  } catch (error) {
    console.log(`❌ Server is not running on ${config.baseUrl}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Please start the server with: npm run dev`);
    return false;
  }
}

// Generate Health Check Report
function generateHealthReport() {
  console.log('\n📊 API Integration Health Report\n');
  console.log('='.repeat(50));
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.externalApis.length > 0) {
    console.log(`\n🌐 External API Status:`);
    testResults.externalApis.forEach(api => {
      const status = api.status === 'connected' ? '✅' : api.status === 'not_configured' ? '⚙️' : '❌';
      console.log(`   ${status} ${api.name}: ${api.status}`);
      if (api.error) console.log(`      Error: ${api.error}`);
      if (api.models) console.log(`      Models available: ${api.models}`);
    });
  }
  
  if (testResults.apiEndpoints.length > 0) {
    console.log(`\n🔗 Internal API Endpoints:`);
    testResults.apiEndpoints.forEach(endpoint => {
      const status = endpoint.success ? '✅' : '❌';
      console.log(`   ${status} ${endpoint.method} ${endpoint.path} → HTTP ${endpoint.status}`);
      if (endpoint.error) console.log(`      Error: ${endpoint.error}`);
    });
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.details}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    testResults.warnings.forEach(warning => {
      console.log(`   • ${warning.test}: ${warning.message}`);
    });
  }
  
  console.log(`\n💡 Recommendations:`);
  
  if (testResults.failed === 0) {
    console.log(`   ✅ All critical API integrations are functioning correctly`);
  } else {
    console.log(`   🔧 ${testResults.failed} integration(s) need attention`);
  }
  
  if (testResults.warnings.some(w => w.message.includes('API keys'))) {
    console.log(`   🔑 Configure AI API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY) for full functionality`);
  }
  
  if (testResults.warnings.some(w => w.message.includes('Network'))) {
    console.log(`   🌐 Some network-dependent features may be limited in sandboxed environments`);
  }
  
  console.log('\n' + '='.repeat(50));
}

// Main test execution
async function runAllTests() {
  console.log('🔍 OdyCAnalyzer API Integration Test Suite');
  console.log('='.repeat(50));
  
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('\n⚠️  Cannot run full API tests without server running');
    console.log('   Start server: npm run dev');
    console.log('   Then run: node tests/api-integration.test.js');
    
    // Still run external API tests
    console.log('\n🔍 Running External API Tests (no server required)...\n');
    await testExternalApis();
    generateHealthReport();
    return;
  }
  
  try {
    // Run all test suites
    await testExternalApis();
    await testInternalApis();
    
    // Generate final report
    generateHealthReport();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  runAllTests,
  testResults,
  config
};