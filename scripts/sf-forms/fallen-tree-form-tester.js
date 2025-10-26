const FallenTreeFormAutomation = require('./fallen-tree-form-automation');

class FallenTreeFormTester {
  constructor() {
    this.automation = new FallenTreeFormAutomation();
  }

  async init() {
    await this.automation.init();
  }

  async cleanup() {
    await this.automation.cleanup();
  }

  /**
   * Test all fallen tree request types
   */
  async testAllFallenTreeTypes() {
    console.log('🧪 Testing All Fallen Tree Request Types');
    console.log('========================================');

    const testCases = [
      {
        name: 'Damaged Tree - Fallen tree',
        requestRegarding: 'Damaged Tree',
        requestType: 'Fallen tree',
        coordinates: '37.755196, -122.423207',
        locationDescription: 'Large tree has fallen across the sidewalk blocking pedestrian access.',
        requestDescription: 'Emergency: Large oak tree has fallen across the sidewalk and is blocking pedestrian access. Immediate removal required for safety.',
        imagePath: 'scripts/sf-forms/sample-pothole-image.jpg'
      },
      {
        name: 'Damaging Property - Lifted sidewalk',
        requestRegarding: 'Damaging Property',
        requestType: 'Lifted sidewalk - tree roots',
        coordinates: '37.755196, -122.423207',
        locationDescription: 'Tree roots have lifted the sidewalk creating a tripping hazard.',
        requestDescription: 'Tree roots from the large maple tree have significantly lifted the sidewalk creating a dangerous tripping hazard for pedestrians.',
        imagePath: 'scripts/sf-forms/sample-pothole-image.jpg'
      },
      {
        name: 'Landscaping - Remove tree suckers',
        requestRegarding: 'Landscaping',
        requestType: 'Remove tree suckers',
        coordinates: '37.755196, -122.423207',
        locationDescription: '', // Empty location description to test skipping
        requestDescription: 'Please remove the numerous tree suckers that have grown around the base of the tree. They are making the area look unkempt.',
        imagePath: 'scripts/sf-forms/sample-pothole-image.jpg'
      },
      {
        name: 'Overgrown Tree - Blocking sidewalk',
        requestRegarding: 'Overgrown Tree',
        requestType: 'Blocking sidewalk',
        coordinates: '37.755196, -122.423207',
        locationDescription: 'Tree branches are hanging low and blocking the sidewalk.',
        requestDescription: 'The tree branches have grown too low and are now blocking pedestrian access on the sidewalk. Pruning is needed.',
        imagePath: 'scripts/sf-forms/sample-pothole-image.jpg'
      },
      {
        name: 'Other - N/A',
        requestRegarding: 'Other',
        requestType: 'N/A',
        coordinates: '37.755196, -122.423207',
        locationDescription: '', // Empty location description to test skipping
        requestDescription: 'General tree maintenance request that does not fit into the other specific categories.',
        imagePath: 'scripts/sf-forms/sample-pothole-image.jpg'
      }
    ];

    const results = [];
    let successCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🎯 Test ${i + 1}/${testCases.length}: ${testCase.name}`);
      console.log('============================================================');
      
      try {
        const result = await this.automation.submitFallenTreeReport(testCase);
        
        if (result.success) {
          console.log(`✅ Test ${i + 1} completed successfully!`);
          console.log(`   Service Request Number: ${result.serviceRequestNumber}`);
          console.log(`   Address: ${result.address}`);
          successCount++;
        } else {
          console.log(`❌ Test ${i + 1} failed: ${result.error}`);
        }
        
        results.push({
          testCase: testCase.name,
          success: result.success,
          serviceRequestNumber: result.serviceRequestNumber,
          address: result.address,
          issueType: testCase.requestRegarding,
          requestType: testCase.requestType,
          error: result.error
        });
        
        // Wait before next test
        if (i < testCases.length - 1) {
          console.log('\n⏳ Waiting before next test...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.log(`❌ Test ${i + 1} failed with error: ${error.message}`);
        results.push({
          testCase: testCase.name,
          success: false,
          error: error.message,
          issueType: testCase.requestRegarding,
          requestType: testCase.requestType
        });
      }
    }

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${testCases.length - successCount}`);

    console.log('\n📋 Detailed Results:');
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`✅ Test ${index + 1}: ${result.testCase}`);
        console.log(`   Service Request Number: ${result.serviceRequestNumber}`);
        console.log(`   Address: ${result.address}`);
      } else {
        console.log(`❌ Test ${index + 1}: ${result.testCase}`);
        console.log(`   Error: ${result.error}`);
      }
    });

    // Save results to file
    const fs = require('fs');
    const resultsPath = 'scripts/sf-forms/fallen-tree-form-test-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Test results saved to: ${resultsPath}`);

    return results;
  }

  /**
   * Test a single fallen tree type
   */
  async testSingleFallenTreeType(testCase) {
    console.log(`🧪 Testing Single Fallen Tree Type: ${testCase.name}`);
    console.log('=====================================================');

    try {
      const result = await this.automation.submitFallenTreeReport(testCase);
      
      if (result.success) {
        console.log('✅ Single test completed successfully!');
        console.log(`📋 Service Request Number: ${result.serviceRequestNumber}`);
        console.log(`📍 Address: ${result.address}`);
      } else {
        console.log(`❌ Single test failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error during single test:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Test runner
(async () => {
  const tester = new FallenTreeFormTester();
  
  try {
    await tester.init();
    
    // Test single case first
    const singleTestCase = {
      name: 'Damaged Tree - Fallen tree',
      requestRegarding: 'Damaged Tree',
      requestType: 'Fallen tree',
      coordinates: '37.755196, -122.423207',
      locationDescription: 'Large tree has fallen across the sidewalk blocking pedestrian access.',
      requestDescription: 'Emergency: Large oak tree has fallen across the sidewalk and is blocking pedestrian access. Immediate removal required for safety.',
      imagePath: 'scripts/sf-forms/sample-pothole-image.jpg'
    };
    
    console.log('🧪 Testing Single Fallen Tree Type First');
    console.log('=========================================');
    await tester.testSingleFallenTreeType(singleTestCase);
    
    // Test all types
    console.log('\n🧪 Testing All Fallen Tree Types');
    console.log('=================================');
    await tester.testAllFallenTreeTypes();
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await tester.cleanup();
  }
})();

module.exports = FallenTreeFormTester;
