#!/usr/bin/env node

/**
 * 404 Handling Tests for OdyCAnalyzer API
 * Tests that API endpoints properly return 404 status codes for non-existent resources
 */

import axios from 'axios';

const CONFIG = {
  baseUrl: 'http://localhost:5000',
  timeout: 10000
};

const RESULTS = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (details) {
    console.log(`   Details: ${details}`);
  }
  
  RESULTS.total++;
  if (success) {
    RESULTS.passed++;
  } else {
    RESULTS.failed++;
    RESULTS.errors.push({ test: testName, details });
  }
}

async function testAPI404Handling() {
  console.log('\n🧪 Starting 404 Handling Tests...\n');
  
  try {
    // Test server connectivity first
    const healthResponse = await axios.get(`${CONFIG.baseUrl}/api/health`, { timeout: CONFIG.timeout });
    if (healthResponse.status !== 200) {
      console.log('❌ Server is not running or not healthy');
      process.exit(1);
    }
    console.log('✅ Server is running and healthy\n');
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure the server is running on port 5000.');
    console.log('   Run: npm run dev');
    process.exit(1);
  }

  // Test 1: GET /api/files/:id with non-existent file ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/files/99999`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true // Don't throw on 404
    });
    
    if (response.status === 404 && response.data.message === 'File not found') {
      logTest('GET /api/files/:id returns 404 for non-existent file', true, 'Correct 404 response with proper message');
    } else {
      logTest('GET /api/files/:id returns 404 for non-existent file', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/files/:id returns 404 for non-existent file', false, error.message);
  }

  // Test 2: GET /api/files/:id with invalid file ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/files/invalid`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 400 && response.data.message === 'Invalid file ID') {
      logTest('GET /api/files/:id returns 400 for invalid file ID', true, 'Correct 400 response for invalid ID');
    } else {
      logTest('GET /api/files/:id returns 400 for invalid file ID', false, `Expected 400, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/files/:id returns 400 for invalid file ID', false, error.message);
  }

  // Test 3: DELETE /api/files/:id with non-existent file ID  
  try {
    const response = await axios.delete(`${CONFIG.baseUrl}/api/files/99999`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'File not found') {
      logTest('DELETE /api/files/:id returns 404 for non-existent file', true, 'Correct 404 response');
    } else {
      logTest('DELETE /api/files/:id returns 404 for non-existent file', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('DELETE /api/files/:id returns 404 for non-existent file', false, error.message);
  }

  // Test 4: GET /api/files/:fileId/analysis with non-existent file ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/files/99999/analysis`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'File not found') {
      logTest('GET /api/files/:fileId/analysis returns 404 for non-existent file', true, 'Validates parent file existence');
    } else {
      logTest('GET /api/files/:fileId/analysis returns 404 for non-existent file', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/files/:fileId/analysis returns 404 for non-existent file', false, error.message);
  }

  // Test 5: GET /api/analysis/:id with non-existent analysis ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/analysis/99999`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'Analysis run not found') {
      logTest('GET /api/analysis/:id returns 404 for non-existent analysis', true, 'Correct 404 response');
    } else {
      logTest('GET /api/analysis/:id returns 404 for non-existent analysis', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/analysis/:id returns 404 for non-existent analysis', false, error.message);
  }

  // Test 6: GET /api/analysis/:id/logs with non-existent analysis ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/analysis/99999/logs`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'Analysis run not found') {
      logTest('GET /api/analysis/:id/logs returns 404 for non-existent analysis', true, 'Validates parent analysis existence');
    } else {
      logTest('GET /api/analysis/:id/logs returns 404 for non-existent analysis', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/analysis/:id/logs returns 404 for non-existent analysis', false, error.message);
  }

  // Test 7: GET /api/analysis/:id/output with non-existent analysis ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/analysis/99999/output`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'Analysis run not found') {
      logTest('GET /api/analysis/:id/output returns 404 for non-existent analysis', true, 'Validates parent analysis existence');
    } else {
      logTest('GET /api/analysis/:id/output returns 404 for non-existent analysis', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/analysis/:id/output returns 404 for non-existent analysis', false, error.message);
  }

  // Test 8: GET /api/analysis/:id/download/:format with non-existent analysis ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/analysis/99999/download/markdown`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'Analysis run not found') {
      logTest('GET /api/analysis/:id/download/:format returns 404 for non-existent analysis', true, 'Validates parent analysis existence');
    } else {
      logTest('GET /api/analysis/:id/download/:format returns 404 for non-existent analysis', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/analysis/:id/download/:format returns 404 for non-existent analysis', false, error.message);
  }

  // Test 9: GET /api/analysis/:id/export/:format with non-existent analysis ID
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/analysis/99999/export/markdown`, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'Analysis run not found') {
      logTest('GET /api/analysis/:id/export/:format returns 404 for non-existent analysis', true, 'Validates parent analysis existence');
    } else {
      logTest('GET /api/analysis/:id/export/:format returns 404 for non-existent analysis', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('GET /api/analysis/:id/export/:format returns 404 for non-existent analysis', false, error.message);
  }

  // Test 10: PATCH /api/agents/:id with non-existent agent ID
  try {
    const response = await axios.patch(`${CONFIG.baseUrl}/api/agents/99999`, { enabled: true }, { 
      timeout: CONFIG.timeout,
      validateStatus: () => true
    });
    
    if (response.status === 404 && response.data.message === 'Agent not found') {
      logTest('PATCH /api/agents/:id returns 404 for non-existent agent', true, 'Validates agent existence before update');
    } else {
      logTest('PATCH /api/agents/:id returns 404 for non-existent agent', false, `Expected 404, got ${response.status}. Message: ${response.data?.message || 'none'}`);
    }
  } catch (error) {
    logTest('PATCH /api/agents/:id returns 404 for non-existent agent', false, error.message);
  }

  // Test edge cases for invalid IDs
  const invalidIds = ['abc', '-1', '0', 'null', 'undefined'];
  
  for (const invalidId of invalidIds) {
    try {
      const response = await axios.get(`${CONFIG.baseUrl}/api/files/${invalidId}`, { 
        timeout: CONFIG.timeout,
        validateStatus: () => true
      });
      
      if (response.status === 400 || response.status === 404) {
        logTest(`GET /api/files/${invalidId} handles invalid ID correctly`, true, `Status: ${response.status}`);
      } else {
        logTest(`GET /api/files/${invalidId} handles invalid ID correctly`, false, `Expected 400 or 404, got ${response.status}`);
      }
    } catch (error) {
      logTest(`GET /api/files/${invalidId} handles invalid ID correctly`, false, error.message);
    }
  }
}

async function runTests() {
  console.log('🔍 OdyCAnalyzer API 404 Handling Tests');
  console.log('=====================================');
  
  await testAPI404Handling();
  
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${RESULTS.total}`);
  console.log(`Passed: ${RESULTS.passed} ✅`);
  console.log(`Failed: ${RESULTS.failed} ❌`);
  console.log(`Success Rate: ${((RESULTS.passed / RESULTS.total) * 100).toFixed(1)}%`);
  
  if (RESULTS.failed > 0) {
    console.log('\n❌ Failed Tests:');
    RESULTS.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`);
      if (error.details) {
        console.log(`   Details: ${error.details}`);
      }
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});