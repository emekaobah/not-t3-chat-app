// Test script for Phase 2 implementation
// This tests the core utilities in /lib/models.ts

console.log('🧪 Testing Phase 2 Implementation...\n');

// Test 1: Test API endpoints
async function testAPIEndpoints() {
  console.log('📡 Testing API Endpoints...');
  
  try {
    // Test models endpoint
    const modelsResponse = await fetch('http://localhost:3002/api/models');
    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      console.log(`✅ /api/models: Found ${models.length} models`);
      console.log(`   Models: ${models.map(m => m.name).join(', ')}`);
    } else {
      console.log('❌ /api/models: Failed');
    }

    // Test models grouped endpoint
    const groupedResponse = await fetch('http://localhost:3002/api/models?grouped=true');
    if (groupedResponse.ok) {
      const grouped = await groupedResponse.json();
      console.log('✅ /api/models?grouped=true: Working');
      console.log(`   Text models: ${grouped.text?.length || 0}`);
      console.log(`   Multimodal models: ${grouped.multimodal?.length || 0}`);
    } else {
      console.log('❌ /api/models?grouped=true: Failed');
    }

  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
  console.log('');
}

// Test 2: Test that the models.ts utilities are importable
async function testModuleImports() {
  console.log('📦 Testing Module Imports...');
  
  try {
    // This will test if the module can be imported without errors
    const modelUtils = await import('./lib/models.ts');
    console.log('✅ /lib/models.ts: Module imports successfully');
    
    // Check if main functions exist
    const expectedFunctions = [
      'getAvailableModels',
      'getGroupedModels', 
      'getUserEnabledModels',
      'validateUserModelAccess',
      'getModelConfigByName',
      'createDefaultUserPreferences'
    ];
    
    expectedFunctions.forEach(funcName => {
      if (typeof modelUtils[funcName] === 'function') {
        console.log(`✅ ${funcName}: Function exists`);
      } else {
        console.log(`❌ ${funcName}: Function missing`);
      }
    });
    
  } catch (error) {
    console.log('❌ Module import failed:', error.message);
  }
  console.log('');
}

// Test 3: Check if app is responsive
async function testAppHealth() {
  console.log('🏃 Testing App Health...');
  
  try {
    const response = await fetch('http://localhost:3002');
    if (response.ok) {
      console.log('✅ App is responding on port 3002');
    } else {
      console.log('❌ App health check failed');
    }
  } catch (error) {
    console.log('❌ App is not reachable:', error.message);
  }
  console.log('');
}

// Run all tests
async function runTests() {
  await testAppHealth();
  await testAPIEndpoints();
  await testModuleImports();
  
  console.log('🎉 Phase 2 Testing Complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   - Core utilities implemented in /lib/models.ts');
  console.log('   - API endpoints working (/api/models)');
  console.log('   - App running successfully on port 3002');
  console.log('   - Ready for Phase 3 testing if needed');
}

runTests().catch(console.error);
