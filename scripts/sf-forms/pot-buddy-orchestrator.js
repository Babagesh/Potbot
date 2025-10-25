const { DamageReport, SFFormAutomation } = require('./sf-form-automation');
const fs = require('fs');
const path = require('path');

/**
 * Configuration for SF.gov form automation
 */
const CONFIG = {
  // Form URLs
  forms: {
    pothole: 'https://www.sf.gov/report-pothole-and-street-issues',
    sidewalk: 'https://www.sf.gov/report-curb-and-sidewalk-problems',
    graffiti: 'https://www.sf.gov/report-graffiti-issues',
    trash: 'https://www.sf.gov/report-garbage-container-issues',
    streetMarkings: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
    streetlight: 'https://www.sf.gov/report-problem-streetlight',
    fallenTree: 'https://www.sf.gov/report-damaged-or-fallen-tree'
  },
  
  // Default reporter information
  defaultReporter: {
    name: 'Pot Buddy User',
    email: 'potbuddy@example.com',
    phone: '555-POT-BUDDY'
  },
  
  // Automation settings
  automation: {
    headless: false, // Set to true for production
    timeout: 30000,
    retryAttempts: 3,
    delayBetweenAttempts: 2000
  },
  
  // Field mappings for different damage types
  fieldMappings: {
    pothole: {
      description: 'Large pothole approximately {size} in diameter and {depth} deep. Located {location}, causing {impact}.',
      severity: 'high'
    },
    sidewalk: {
      description: 'Sidewalk crack approximately {length} long and {width} wide. Located {location}, creating {hazard}.',
      severity: 'medium'
    },
    graffiti: {
      description: 'Graffiti vandalism covering approximately {area}. Located {location}, visible from {visibility}.',
      severity: 'low'
    },
    trash: {
      description: 'Overflowing trash container with {amount} of waste. Located {location}, causing {issues}.',
      severity: 'medium'
    },
    streetMarkings: {
      description: 'Faded street markings making {type} difficult to see. Located {location}, affecting {impact}.',
      severity: 'medium'
    },
    streetlight: {
      description: 'Broken streetlight {condition}. Located {location}, affecting {area} visibility.',
      severity: 'high'
    },
    fallenTree: {
      description: 'Fallen tree approximately {size} blocking {obstruction}. Located {location}, causing {hazards}.',
      severity: 'high'
    }
  }
};

/**
 * Main orchestrator class for handling damage reports
 */
class PotBuddyOrchestrator {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.automation = new SFFormAutomation(this.config.automation);
    this.submissionHistory = [];
  }

  /**
   * Process a damage report from computer vision analysis
   */
  async processDamageReport(cvAnalysis) {
    console.log('Processing damage report from CV analysis...');
    
    // Validate CV analysis
    if (!this.validateCVAnalysis(cvAnalysis)) {
      throw new Error('Invalid CV analysis data');
    }

    // Create damage report
    const damageReport = this.createDamageReportFromCV(cvAnalysis);
    
    // Submit to SF.gov
    const submissionResult = await this.submitToSFGov(damageReport);
    
    // Create social media posts
    const socialMediaResult = await this.createSocialMediaPosts(damageReport, submissionResult);
    
    // Store results
    const result = {
      damageReport,
      sfSubmission: submissionResult,
      socialMedia: socialMediaResult,
      timestamp: new Date().toISOString()
    };
    
    this.submissionHistory.push(result);
    this.saveSubmissionHistory();
    
    return result;
  }

  /**
   * Validate CV analysis data
   */
  validateCVAnalysis(cvAnalysis) {
    const required = ['damageType', 'description', 'latitude', 'longitude', 'imagePath'];
    return required.every(field => cvAnalysis[field]);
  }

  /**
   * Create damage report from CV analysis
   */
  createDamageReportFromCV(cvAnalysis) {
    const damageType = cvAnalysis.damageType;
    const fieldMapping = this.config.fieldMappings[damageType];
    
    // Enhance description using field mapping template
    let enhancedDescription = cvAnalysis.description;
    if (fieldMapping && fieldMapping.description) {
      // Replace template variables with actual data
      enhancedDescription = fieldMapping.description
        .replace('{size}', cvAnalysis.size || 'unknown size')
        .replace('{depth}', cvAnalysis.depth || 'unknown depth')
        .replace('{length}', cvAnalysis.length || 'unknown length')
        .replace('{width}', cvAnalysis.width || 'unknown width')
        .replace('{area}', cvAnalysis.area || 'unknown area')
        .replace('{amount}', cvAnalysis.amount || 'significant amount')
        .replace('{type}', cvAnalysis.type || 'traffic markings')
        .replace('{condition}', cvAnalysis.condition || 'not functioning')
        .replace('{location}', `at coordinates ${cvAnalysis.latitude}, ${cvAnalysis.longitude}`)
        .replace('{impact}', cvAnalysis.impact || 'traffic safety concerns')
        .replace('{hazard}', cvAnalysis.hazard || 'pedestrian safety hazard')
        .replace('{visibility}', cvAnalysis.visibility || 'public areas')
        .replace('{issues}', cvAnalysis.issues || 'sanitation concerns')
        .replace('{obstruction}', cvAnalysis.obstruction || 'roadway')
        .replace('{hazards}', cvAnalysis.hazards || 'traffic obstruction');
    }

    return new DamageReport({
      damageType,
      description: enhancedDescription,
      latitude: cvAnalysis.latitude,
      longitude: cvAnalysis.longitude,
      imagePath: cvAnalysis.imagePath,
      severity: fieldMapping?.severity || cvAnalysis.severity || 'medium',
      reporterName: this.config.defaultReporter.name,
      reporterEmail: this.config.defaultReporter.email,
      reporterPhone: this.config.defaultReporter.phone,
      additionalNotes: `Reported via Pot Buddy AI system. Original CV analysis: ${cvAnalysis.description}`
    });
  }

  /**
   * Submit damage report to SF.gov
   */
  async submitToSFGov(damageReport) {
    console.log(`Submitting ${damageReport.damageType} report to SF.gov...`);
    
    let lastError;
    for (let attempt = 1; attempt <= this.config.automation.retryAttempts; attempt++) {
      try {
        const result = await this.automation.submitDamageReport(damageReport);
        console.log(`SF.gov submission successful on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        console.log(`SF.gov submission attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.config.automation.retryAttempts) {
          console.log(`Waiting ${this.config.automation.delayBetweenAttempts}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.config.automation.delayBetweenAttempts));
        }
      }
    }
    
    throw new Error(`SF.gov submission failed after ${this.config.automation.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Create social media posts for awareness
   */
  async createSocialMediaPosts(damageReport, submissionResult) {
    console.log('Creating social media posts...');
    
    const posts = {
      twitter: this.createTwitterPost(damageReport, submissionResult),
      facebook: this.createFacebookPost(damageReport, submissionResult)
    };
    
    // In a real implementation, you would post these to actual social media APIs
    console.log('Twitter post:', posts.twitter);
    console.log('Facebook post:', posts.facebook);
    
    return {
      success: true,
      posts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create Twitter post content
   */
  createTwitterPost(damageReport, submissionResult) {
    const hashtags = ['#SanFrancisco', '#Infrastructure', '#PotBuddy'];
    const damageHashtag = `#${damageReport.damageType.charAt(0).toUpperCase() + damageReport.damageType.slice(1)}`;
    
    return {
      text: `🚨 ${damageReport.damageType.toUpperCase()} REPORTED 🚨\n\n${damageReport.description}\n\n📍 Location: ${damageReport.latitude}, ${damageReport.longitude}\n🏛️ Reported to SF.gov\n\n${hashtags.join(' ')} ${damageHashtag}`,
      hashtags: [...hashtags, damageHashtag],
      imagePath: damageReport.imagePath
    };
  }

  /**
   * Create Facebook post content
   */
  createFacebookPost(damageReport, submissionResult) {
    return {
      text: `Infrastructure Issue Reported in San Francisco\n\nType: ${damageReport.damageType}\nDescription: ${damageReport.description}\nLocation: ${damageReport.latitude}, ${damageReport.longitude}\n\nThis issue has been reported to San Francisco city services through Pot Buddy, an AI-powered infrastructure monitoring system.`,
      imagePath: damageReport.imagePath,
      tags: ['San Francisco', 'Infrastructure', 'City Services', 'Pot Buddy']
    };
  }

  /**
   * Save submission history to file
   */
  saveSubmissionHistory() {
    const historyPath = path.join(__dirname, 'submission-history.json');
    fs.writeFileSync(historyPath, JSON.stringify(this.submissionHistory, null, 2));
  }

  /**
   * Load submission history from file
   */
  loadSubmissionHistory() {
    const historyPath = path.join(__dirname, 'submission-history.json');
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf8');
      this.submissionHistory = JSON.parse(data);
    }
  }

  /**
   * Get submission statistics
   */
  getStats() {
    const stats = {
      totalSubmissions: this.submissionHistory.length,
      successfulSubmissions: this.submissionHistory.filter(s => s.sfSubmission.success).length,
      damageTypeBreakdown: {},
      recentSubmissions: this.submissionHistory.slice(-5)
    };

    this.submissionHistory.forEach(submission => {
      const type = submission.damageReport.damageType;
      stats.damageTypeBreakdown[type] = (stats.damageTypeBreakdown[type] || 0) + 1;
    });

    return stats;
  }
}

/**
 * Sample CV analysis data for testing
 */
function createSampleCVAnalysis(damageType = 'pothole') {
  return {
    damageType,
    description: 'Large pothole approximately 2 feet in diameter and 6 inches deep',
    latitude: 37.7749,
    longitude: -122.4194,
    imagePath: path.join(__dirname, 'sample-image.jpg'),
    size: '2 feet in diameter',
    depth: '6 inches deep',
    severity: 'high',
    confidence: 0.95
  };
}

// Export classes and functions
module.exports = {
  PotBuddyOrchestrator,
  CONFIG,
  createSampleCVAnalysis
};

// Run sample test if this file is executed directly
if (require.main === module) {
  async function runSampleTest() {
    const orchestrator = new PotBuddyOrchestrator();
    const sampleCV = createSampleCVAnalysis('pothole');
    
    try {
      const result = await orchestrator.processDamageReport(sampleCV);
      console.log('Sample test completed successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
      
      const stats = orchestrator.getStats();
      console.log('Stats:', JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('Sample test failed:', error);
    }
  }
  
  runSampleTest();
}
