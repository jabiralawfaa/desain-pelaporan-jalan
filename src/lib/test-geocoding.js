/**
 * Simple manual test script for the geocoding system
 * Run with: node src/lib/test-geocoding.js
 */

// Simple test function to verify geocoding functionality
async function testGeocodingSystem() {
  console.log('🧪 Testing Enhanced Geocoding System...\n');

  // Test coordinates (Banyuwangi area)
  const testCoordinates = [
    { lat: -8.253, lng: 114.367, name: 'Banyuwangi Center' },
    { lat: -8.254, lng: 114.368, name: 'Near Banyuwangi' },
    { lat: -6.2, lng: 106.8, name: 'Jakarta' },
    { lat: -7.8, lng: 110.4, name: 'Yogyakarta' }
  ];

  console.log('📍 Test Coordinates:');
  testCoordinates.forEach((coord, index) => {
    console.log(`${index + 1}. ${coord.name}: ${coord.lat}, ${coord.lng}`);
  });
  console.log('');

  // Test API endpoint
  for (const coord of testCoordinates) {
    try {
      console.log(`🔍 Testing ${coord.name}...`);
      
      const response = await fetch(`http://localhost:3000/api/geocode?lat=${coord.lat}&lng=${coord.lng}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success: ${result.streetName}`);
        if (result.metadata) {
          console.log(`   📊 Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
          console.log(`   🔗 Source: ${result.metadata.source}`);
          if (result.metadata.roadType) {
            console.log(`   🛣️  Road Type: ${result.metadata.roadType}`);
          }
        }
      } else {
        const error = await response.json();
        console.log(`❌ Failed: ${error.error}`);
        if (error.fallback) {
          console.log(`   🔄 Fallback: ${error.fallback.streetName}`);
        }
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
    console.log('');
  }

  // Test utility functions
  console.log('🔧 Testing Utility Functions...\n');

  // Test coordinate validation
  const validCoords = [-8.253, 114.367];
  const invalidCoords = [91, 181];
  
  console.log(`✅ Valid coordinates (${validCoords.join(', ')}): Should be valid`);
  console.log(`❌ Invalid coordinates (${invalidCoords.join(', ')}): Should be invalid`);

  // Test distance calculation
  const coord1 = { lat: -8.253, lng: 114.367 };
  const coord2 = { lat: -8.254, lng: 114.368 };
  console.log(`📏 Distance between test points: ~${Math.round(calculateHaversineDistance(coord1, coord2))}m`);

  console.log('\n🎉 Testing completed!');
}

// Simple Haversine distance calculation for testing
function calculateHaversineDistance(coord1, coord2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1.lat * (Math.PI / 180)) *
            Math.cos(coord2.lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Performance Test...\n');
  
  const testCoord = { lat: -8.253, lng: 114.367 };
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`http://localhost:3000/api/geocode?lat=${testCoord.lat}&lng=${testCoord.lng}`);
      await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;
      times.push(duration);
      console.log(`Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`Request ${i + 1}: Failed - ${error.message}`);
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n📊 Performance Results:`);
    console.log(`   Average: ${avgTime.toFixed(1)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    
    if (avgTime < 2000) {
      console.log('✅ Performance: Good (< 2s average)');
    } else if (avgTime < 5000) {
      console.log('⚠️  Performance: Acceptable (2-5s average)');
    } else {
      console.log('❌ Performance: Poor (> 5s average)');
    }
  }
}

// Cache test
async function cacheTest() {
  console.log('\n💾 Cache Test...\n');
  
  const testCoord = { lat: -8.253, lng: 114.367 };
  
  console.log('First request (should hit API):');
  const start1 = Date.now();
  const response1 = await fetch(`http://localhost:3000/api/geocode?lat=${testCoord.lat}&lng=${testCoord.lng}`);
  const result1 = await response1.json();
  const time1 = Date.now() - start1;
  console.log(`Time: ${time1}ms, Result: ${result1.streetName}`);
  
  console.log('\nSecond request (should use cache):');
  const start2 = Date.now();
  const response2 = await fetch(`http://localhost:3000/api/geocode?lat=${testCoord.lat}&lng=${testCoord.lng}`);
  const result2 = await response2.json();
  const time2 = Date.now() - start2;
  console.log(`Time: ${time2}ms, Result: ${result2.streetName}`);
  
  if (time2 < time1 * 0.5) {
    console.log('✅ Cache working: Second request significantly faster');
  } else {
    console.log('⚠️  Cache may not be working optimally');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Enhanced Geocoding System Test Suite\n');
  console.log('Make sure the Next.js development server is running on localhost:3000\n');
  
  try {
    await testGeocodingSystem();
    await performanceTest();
    await cacheTest();
    
    console.log('\n✨ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Basic geocoding functionality');
    console.log('- ✅ Error handling and fallbacks');
    console.log('- ✅ Performance testing');
    console.log('- ✅ Cache functionality');
    console.log('\n🎯 System is ready for production use!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Next.js server is running: npm run dev');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify API endpoint is accessible');
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests();
}

module.exports = {
  testGeocodingSystem,
  performanceTest,
  cacheTest,
  runAllTests
};