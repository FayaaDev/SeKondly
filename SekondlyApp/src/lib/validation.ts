/**
 * Integration Validation Script
 * Run this to verify the native app is properly connected to the backend and schema
 */

import type { User, Case, CaseComment } from '../types';
import { API_BASE_URL } from '../config/api';

// Test type compatibility with shared schema
const testTypeCompatibility = () => {
  console.log('🔍 Testing type compatibility with shared schema...');
  
  // Test User type
  const testUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    username: 'testuser',
    password: 'password',
    firstName: 'Test',
    lastName: 'User',
    profileImageUrl: null,
    phone: null,
    specialty: 'Cardiology',
    level: 'Consultant',
    institution: null,
    experience: null,
    isApproved: true,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedAt: null,
    approvedBy: null,
  };
  
  // Test Case type
  const testCase: Case = {
    id: 1,
    title: 'Test Case',
    history: 'Test case history',
    specialty: 'Cardiology',
    authorId: 'test-author-id',
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    likesCount: 0,
    commentsCount: 0,
    viewsCount: 0,
    approvedAt: null,
    approvedBy: null,
    imageUrls: [],
    format: 'short',
    chiefComplaint: null,
    historyOfPresentIllness: null,
    pastMedicalHistory: null,
    familyHistory: null,
    drugHistory: null,
    systemicReview: null,
    examination: null,
    management: null,
    isHot: false,
  };
  
  // Test CaseComment type
  const testComment: CaseComment = {
    id: 1,
    caseId: 1,
    userId: 'test-user-id',
    content: 'Test comment',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  console.log('✅ Type compatibility test passed');
  return { testUser, testCase, testComment };
};

// Test API connectivity
const testApiConnectivity = async () => {
  console.log('🌐 Testing API connectivity...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connectivity test passed');
      console.log('Health check response:', data);
      return true;
    } else {
      console.log('❌ API connectivity test failed');
      console.log('Response status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API connectivity test failed');
    console.log('Error:', error);
    return false;
  }
};

// Test database schema endpoints
const testSchemaEndpoints = async () => {
  console.log('📊 Testing schema endpoints...');
  
  const endpoints = [
    '/api/auth/user',
    '/api/cases',
    '/api/notifications',
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      results.push({
        endpoint,
        status: response.status,
        accessible: response.status !== 404,
      });
    } catch (error) {
      results.push({
        endpoint,
        status: 'error',
        accessible: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  console.log('Schema endpoints test results:', results);
  return results;
};

// Main validation function
export const validateIntegration = async () => {
  console.log('🚀 Starting SeKondly Native App Integration Validation...');
  console.log('===============================================');
  
  // Test 1: Type compatibility
  const typeTest = testTypeCompatibility();
  
  // Test 2: API connectivity
  const apiTest = await testApiConnectivity();
  
  // Test 3: Schema endpoints
  const schemaTest = await testSchemaEndpoints();
  
  console.log('===============================================');
  console.log('📋 Integration Validation Summary:');
  console.log(`✅ Types compatible with shared schema: TRUE`);
  console.log(`✅ API connectivity: ${apiTest ? 'TRUE' : 'FALSE'}`);
  console.log(`✅ Schema endpoints accessible: ${schemaTest.filter(r => r.accessible).length}/${schemaTest.length}`);
  
  const isFullyIntegrated = apiTest && schemaTest.every(r => r.accessible);
  
  if (isFullyIntegrated) {
    console.log('🎉 Native app is fully integrated with backend and schema!');
  } else {
    console.log('⚠️  Integration issues detected. Check the logs above.');
  }
  
  return {
    typeCompatibility: true,
    apiConnectivity: apiTest,
    schemaEndpoints: schemaTest,
    fullyIntegrated: isFullyIntegrated,
  };
};

// Usage instructions
console.log(`
📱 SeKondly Native App Integration Status

To validate the integration, run:
import { validateIntegration } from './src/lib/validation';
validateIntegration();

Current Configuration:
- Backend API: ${API_BASE_URL}
- Schema: /Users/fayaa/SeKondly/shared/schema.ts
- Database: Neon PostgreSQL

Make sure your backend server is running on port 5001!
`);

export default validateIntegration;
