#!/usr/bin/env node

const { PotBuddyOrchestrator, createSampleCVAnalysis } = require('./pot-buddy-orchestrator');
const { DamageReport, SFFormAutomation } = require('./sf-form-automation');
const path = require('path');

/**
 * Demo script showing how Pot Buddy automation works
 * This demonstrates the complete workflow without actually submitting to SF.gov
 */
class PotBuddyDemo {
  constructor() {
    this.orchestrator = new PotBuddyOrchestrator({
      automation: {
        headless: true, // Run in headless mode for demo
        timeout: 10000,
        retryAttempts: 1
      }
    });
  }

  /**
   * Run the complete demo
   */
  async runDemo() {
    console.log('🚀 Pot Buddy SF.gov Automation Demo\n');
    console.log('This demo shows how the automation would work with real CV analysis data.\n');

    // Demo 1: Show CV analysis input
    console.log('📸 Step 1: Computer Vision Analysis Input');
    console.log('==========================================');
    const sampleCV = createSampleCVAnalysis('pothole');
    console.log('CV Analysis Data:');
    console.log(JSON.stringify(sampleCV, null, 2));
    console.log('');

    // Demo 2: Show damage report creation
    console.log('📋 Step 2: Damage Report Creation');
    console.log('==================================');
    const damageReport = this.orchestrator.createDamageReportFromCV(sampleCV);
    console.log('Created Damage Report:');
    console.log(`  Type: ${damageReport.damageType}`);
    console.log(`  Description: ${damageReport.description}`);
    console.log(`  Location: ${damageReport.latitude}, ${damageReport.longitude}`);
    console.log(`  Severity: ${damageReport.severity}`);
    console.log(`  Reporter: ${damageReport.reporterName}`);
    console.log('');

    // Demo 3: Show form URL selection
    console.log('🌐 Step 3: Form URL Selection');
    console.log('=============================');
    const formUrl = damageReport.getFormUrl();
    console.log(`Selected SF.gov form: ${formUrl}`);
    console.log('');

    // Demo 4: Show field mappings
    console.log('🔧 Step 4: Field Mapping Strategy');
    console.log('==================================');
    this.showFieldMappings();
    console.log('');

    // Demo 5: Show social media posts
    console.log('📱 Step 5: Social Media Post Generation');
    console.log('========================================');
    this.showSocialMediaPosts(damageReport);
    console.log('');

    // Demo 6: Show different damage types
    console.log('🏗️ Step 6: Multiple Damage Types');
    console.log('===============================');
    await this.showMultipleDamageTypes();
    console.log('');

    console.log('✅ Demo completed! The automation is ready to process real CV analysis data.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Integrate with your computer vision pipeline');
    console.log('2. Test with real SF.gov forms (when accessible)');
    console.log('3. Deploy to production environment');
    console.log('4. Monitor submission success rates');
  }

  /**
   * Show field mapping strategy
   */
  showFieldMappings() {
    const mappings = {
      'address': 'GPS coordinates converted to street address',
      'description': 'AI-generated description from CV analysis',
      'name': 'Default reporter information',
      'email': 'Contact email for follow-up',
      'phone': 'Contact phone number',
      'severity': 'Calculated from CV analysis confidence and damage size',
      'image': 'Uploaded evidence photo'
    };

    Object.entries(mappings).forEach(([field, strategy]) => {
      console.log(`  ${field}: ${strategy}`);
    });
  }

  /**
   * Show social media post generation
   */
  showSocialMediaPosts(damageReport) {
    const twitterPost = this.orchestrator.createTwitterPost(damageReport, { success: true });
    const facebookPost = this.orchestrator.createFacebookPost(damageReport, { success: true });

    console.log('Twitter Post:');
    console.log(`  ${twitterPost.text}`);
    console.log('');
    console.log('Facebook Post:');
    console.log(`  ${facebookPost.text}`);
  }

  /**
   * Show multiple damage types
   */
  async showMultipleDamageTypes() {
    const damageTypes = ['pothole', 'sidewalk', 'graffiti', 'trash', 'streetMarkings', 'streetlight', 'fallenTree'];
    
    damageTypes.forEach(type => {
      const sampleCV = createSampleCVAnalysis(type);
      const report = this.orchestrator.createDamageReportFromCV(sampleCV);
      console.log(`  ${type}: ${report.description.substring(0, 50)}...`);
    });
  }

  /**
   * Test form validation
   */
  testFormValidation() {
    console.log('🧪 Testing Form Validation');
    console.log('==========================');

    // Test valid report
    const validReport = new DamageReport({
      damageType: 'pothole',
      description: 'Test pothole',
      latitude: 37.7749,
      longitude: -122.4194,
      imagePath: __filename // Use this file as a dummy image
    });

    const validation = validReport.validate();
    console.log(`Valid report: ${validation.isValid ? '✅' : '❌'}`);
    if (!validation.isValid) {
      console.log(`Errors: ${validation.errors.join(', ')}`);
    }

    // Test invalid report
    const invalidReport = new DamageReport({
      damageType: 'invalid',
      description: '',
      latitude: null,
      longitude: null,
      imagePath: 'nonexistent.jpg'
    });

    const invalidValidation = invalidReport.validate();
    console.log(`Invalid report: ${invalidValidation.isValid ? '✅' : '❌'}`);
    if (!invalidValidation.isValid) {
      console.log(`Errors: ${invalidValidation.errors.join(', ')}`);
    }
  }

  /**
   * Show configuration options
   */
  showConfiguration() {
    console.log('⚙️ Configuration Options');
    console.log('=========================');
    
    const config = {
      'Headless Mode': 'Set to true for production automation',
      'Timeout': 'Page load timeout in milliseconds',
      'Retry Attempts': 'Number of retries for failed submissions',
      'Delay Between Attempts': 'Wait time between retry attempts',
      'Default Reporter Info': 'Contact information for submissions',
      'Field Mappings': 'Custom field mapping strategies'
    };

    Object.entries(config).forEach(([option, description]) => {
      console.log(`  ${option}: ${description}`);
    });
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const demo = new PotBuddyDemo();
  
  if (args.length === 0) {
    // Run full demo
    await demo.runDemo();
  } else if (args[0] === 'validation') {
    // Test validation only
    demo.testFormValidation();
  } else if (args[0] === 'config') {
    // Show configuration
    demo.showConfiguration();
  } else {
    console.log('Usage:');
    console.log('  node demo.js              # Run full demo');
    console.log('  node demo.js validation   # Test form validation');
    console.log('  node demo.js config        # Show configuration options');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PotBuddyDemo };
