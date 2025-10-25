#!/usr/bin/env node

const { PotBuddyOrchestrator, createSampleCVAnalysis } = require('./pot-buddy-orchestrator');
const { scrapeSFForms } = require('./form-scraper');
const path = require('path');

/**
 * Test script for Pot Buddy SF.gov automation
 */
class PotBuddyTester {
  constructor() {
    this.orchestrator = new PotBuddyOrchestrator({
      automation: {
        headless: false, // Set to true for automated testing
        timeout: 30000,
        retryAttempts: 2
      }
    });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Pot Buddy SF.gov Automation Tests\n');
    
    try {
      // Test 1: Scrape SF forms
      console.log('📋 Test 1: Scraping SF.gov forms...');
      await this.testFormScraping();
      
      // Test 2: Test each damage type
      console.log('\n🚧 Test 2: Testing damage type submissions...');
      await this.testDamageTypes();
      
      // Test 3: Test error handling
      console.log('\n❌ Test 3: Testing error handling...');
      await this.testErrorHandling();
      
      // Test 4: Show statistics
      console.log('\n📊 Test 4: Submission statistics...');
      this.showStats();
      
      console.log('\n✅ All tests completed!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  /**
   * Test form scraping functionality
   */
  async testFormScraping() {
    try {
      const formData = await scrapeSFForms();
      console.log('✅ Form scraping successful');
      
      // Show summary
      Object.entries(formData).forEach(([type, data]) => {
        if (data.fields) {
          console.log(`   ${type}: ${data.fields.length} fields found`);
        } else {
          console.log(`   ${type}: Error - ${data.error}`);
        }
      });
      
    } catch (error) {
      console.log('❌ Form scraping failed:', error.message);
    }
  }

  /**
   * Test each damage type
   */
  async testDamageTypes() {
    const damageTypes = ['pothole', 'sidewalk', 'graffiti', 'trash', 'streetMarkings', 'streetlight', 'fallenTree'];
    
    for (const damageType of damageTypes) {
      console.log(`   Testing ${damageType}...`);
      
      try {
        const sampleCV = createSampleCVAnalysis(damageType);
        
        // Note: This will actually try to submit to SF.gov
        // In a real test environment, you might want to mock this
        const result = await this.orchestrator.processDamageReport(sampleCV);
        
        if (result.sfSubmission.success) {
          console.log(`   ✅ ${damageType}: Success`);
        } else {
          console.log(`   ❌ ${damageType}: Failed - ${result.sfSubmission.error}`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${damageType}: Error - ${error.message}`);
      }
      
      // Wait between tests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    const invalidCVData = {
      damageType: 'invalid',
      description: 'Test description',
      latitude: null,
      longitude: null,
      imagePath: 'nonexistent.jpg'
    };
    
    try {
      await this.orchestrator.processDamageReport(invalidCVData);
      console.log('❌ Error handling test failed - should have thrown error');
    } catch (error) {
      console.log('✅ Error handling test passed - correctly caught invalid data');
    }
  }

  /**
   * Show submission statistics
   */
  showStats() {
    const stats = this.orchestrator.getStats();
    
    console.log(`   Total submissions: ${stats.totalSubmissions}`);
    console.log(`   Successful submissions: ${stats.successfulSubmissions}`);
    console.log(`   Success rate: ${stats.totalSubmissions > 0 ? (stats.successfulSubmissions / stats.totalSubmissions * 100).toFixed(1) : 0}%`);
    
    console.log('   Damage type breakdown:');
    Object.entries(stats.damageTypeBreakdown).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
  }

  /**
   * Run a single damage type test
   */
  async testSingleDamageType(damageType) {
    console.log(`🧪 Testing single damage type: ${damageType}\n`);
    
    try {
      const sampleCV = createSampleCVAnalysis(damageType);
      const result = await this.orchestrator.processDamageReport(sampleCV);
      
      console.log('✅ Test completed successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Run form scraping only
   */
  async testFormScrapingOnly() {
    console.log('📋 Testing form scraping only...\n');
    await this.testFormScraping();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const tester = new PotBuddyTester();
  
  if (args.length === 0) {
    // Run all tests
    await tester.runAllTests();
  } else if (args[0] === 'scrape') {
    // Run form scraping only
    await tester.testFormScrapingOnly();
  } else if (args[0] === 'test' && args[1]) {
    // Test specific damage type
    await tester.testSingleDamageType(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node test.js                    # Run all tests');
    console.log('  node test.js scrape             # Run form scraping only');
    console.log('  node test.js test <damageType>  # Test specific damage type');
    console.log('');
    console.log('Available damage types:');
    console.log('  pothole, sidewalk, graffiti, trash, streetMarkings, streetlight, fallenTree');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PotBuddyTester };
