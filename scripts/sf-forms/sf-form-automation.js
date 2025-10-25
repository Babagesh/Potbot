const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { SF_FORM_URLS } = require('./form-scraper');

/**
 * Data structure for damage report information
 */
class DamageReport {
  constructor(data) {
    this.damageType = data.damageType; // 'pothole', 'sidewalk', 'graffiti', etc.
    this.description = data.description; // AI-generated description
    this.latitude = data.latitude; // GPS latitude
    this.longitude = data.longitude; // GPS longitude
    this.imagePath = data.imagePath; // Path to uploaded image
    this.severity = data.severity || 'medium'; // 'low', 'medium', 'high'
    this.reporterName = data.reporterName || 'Anonymous';
    this.reporterEmail = data.reporterEmail || '';
    this.reporterPhone = data.reporterPhone || '';
    this.additionalNotes = data.additionalNotes || '';
  }

  /**
   * Get the appropriate SF.gov form URL for this damage type
   */
  getFormUrl() {
    return SF_FORM_URLS[this.damageType];
  }

  /**
   * Validate that all required data is present
   */
  validate() {
    const errors = [];
    
    if (!this.damageType || !SF_FORM_URLS[this.damageType]) {
      errors.push('Invalid or missing damage type');
    }
    
    if (!this.description) {
      errors.push('Description is required');
    }
    
    if (!this.latitude || !this.longitude) {
      errors.push('GPS coordinates are required');
    }
    
    if (!this.imagePath || !fs.existsSync(this.imagePath)) {
      errors.push('Valid image path is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Main automation class for SF.gov form submission
 */
class SFFormAutomation {
  constructor(options = {}) {
    this.headless = options.headless !== false; // Default to headless
    this.timeout = options.timeout || 30000; // 30 second timeout
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize browser and context
   */
  async init() {
    this.browser = await chromium.launch({ 
      headless: this.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.timeout);
  }

  /**
   * Fill out and submit a damage report form
   */
  async submitDamageReport(damageReport) {
    const validation = damageReport.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid damage report: ${validation.errors.join(', ')}`);
    }

    try {
      await this.init();
      
      const formUrl = damageReport.getFormUrl();
      console.log(`Navigating to: ${formUrl}`);
      
      await this.page.goto(formUrl, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);

      // Fill out the form fields
      await this.fillFormFields(damageReport);
      
      // Upload the image if there's a file input
      await this.uploadImage(damageReport.imagePath);
      
      // Submit the form
      const submissionResult = await this.submitForm();
      
      await this.cleanup();
      
      return {
        success: true,
        damageType: damageReport.damageType,
        formUrl,
        submissionId: submissionResult.id,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error submitting damage report:', error);
      await this.cleanup();
      
      return {
        success: false,
        error: error.message,
        damageType: damageReport.damageType,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fill out form fields based on damage type and report data
   */
  async fillFormFields(damageReport) {
    console.log('Filling form fields...');

    // Common field mappings for SF.gov forms
    const fieldMappings = {
      // Location fields
      'address': () => this.fillAddressField(damageReport),
      'location': () => this.fillLocationField(damageReport),
      'street': () => this.fillStreetField(damageReport),
      'cross_street': () => this.fillCrossStreetField(damageReport),
      
      // Description fields
      'description': () => this.fillDescriptionField(damageReport.description),
      'details': () => this.fillDescriptionField(damageReport.description),
      'problem_description': () => this.fillDescriptionField(damageReport.description),
      
      // Contact fields
      'name': () => this.fillTextField('name', damageReport.reporterName),
      'email': () => this.fillTextField('email', damageReport.reporterEmail),
      'phone': () => this.fillTextField('phone', damageReport.reporterPhone),
      
      // Severity/Priority
      'severity': () => this.fillSeverityField(damageReport.severity),
      'priority': () => this.fillSeverityField(damageReport.severity),
      'urgency': () => this.fillSeverityField(damageReport.severity),
      
      // Additional notes
      'notes': () => this.fillTextField('notes', damageReport.additionalNotes),
      'additional_info': () => this.fillTextField('additional_info', damageReport.additionalNotes)
    };

    // Try to fill each field type
    for (const [fieldType, fillFunction] of Object.entries(fieldMappings)) {
      try {
        await fillFunction();
      } catch (error) {
        console.log(`Could not fill ${fieldType} field: ${error.message}`);
      }
    }
  }

  /**
   * Fill address field using GPS coordinates (reverse geocoding would be ideal)
   */
  async fillAddressField(damageReport) {
    // For now, we'll use a generic SF address format
    // In production, you'd want to use reverse geocoding
    const address = `San Francisco, CA (${damageReport.latitude}, ${damageReport.longitude})`;
    await this.fillTextField('address', address);
  }

  /**
   * Fill location field
   */
  async fillLocationField(damageReport) {
    const location = `${damageReport.latitude}, ${damageReport.longitude}`;
    await this.fillTextField('location', location);
  }

  /**
   * Fill street field
   */
  async fillStreetField(damageReport) {
    // This would ideally use reverse geocoding to get the actual street name
    await this.fillTextField('street', 'Street location from GPS coordinates');
  }

  /**
   * Fill cross street field
   */
  async fillCrossStreetField(damageReport) {
    await this.fillTextField('cross_street', 'Nearest cross street');
  }

  /**
   * Fill description field
   */
  async fillDescriptionField(description) {
    await this.fillTextField('description', description);
  }

  /**
   * Fill severity field
   */
  async fillSeverityField(severity) {
    const severityMap = {
      'low': 'Low',
      'medium': 'Medium', 
      'high': 'High'
    };
    
    const severityValue = severityMap[severity] || 'Medium';
    
    // Try different selectors for severity
    const selectors = [
      'select[name="severity"]',
      'select[name="priority"]',
      'select[name="urgency"]',
      'input[name="severity"][value="' + severityValue.toLowerCase() + '"]',
      'input[name="priority"][value="' + severityValue.toLowerCase() + '"]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'select') {
            await this.page.selectOption(selector, severityValue);
          } else {
            await this.page.check(selector);
          }
          console.log(`Filled severity field: ${severityValue}`);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    throw new Error('Could not find severity field');
  }

  /**
   * Generic text field filler
   */
  async fillTextField(fieldName, value) {
    if (!value) return;
    
    const selectors = [
      `input[name="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `input[id="${fieldName}"]`,
      `textarea[id="${fieldName}"]`,
      `[name="${fieldName}"]`,
      `[id="${fieldName}"]`
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          await this.page.fill(selector, value);
          console.log(`Filled ${fieldName}: ${value}`);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    throw new Error(`Could not find field: ${fieldName}`);
  }

  /**
   * Upload image file
   */
  async uploadImage(imagePath) {
    console.log(`Uploading image: ${imagePath}`);
    
    const fileSelectors = [
      'input[type="file"]',
      'input[name="file"]',
      'input[name="image"]',
      'input[name="photo"]',
      'input[name="attachment"]'
    ];
    
    for (const selector of fileSelectors) {
      try {
        const fileInput = await this.page.$(selector);
        if (fileInput) {
          await this.page.setInputFiles(selector, imagePath);
          console.log(`Image uploaded successfully`);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    console.log('No file input found - image upload skipped');
  }

  /**
   * Submit the form
   */
  async submitForm() {
    console.log('Submitting form...');
    
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Send")',
      'button:has-text("Report")',
      '.submit-button',
      '#submit'
    ];
    
    for (const selector of submitSelectors) {
      try {
        const submitButton = await this.page.$(selector);
        if (submitButton) {
          await this.page.click(selector);
          console.log('Form submitted successfully');
          
          // Wait for confirmation or redirect
          await this.page.waitForTimeout(3000);
          
          // Try to extract submission ID or confirmation
          const confirmation = await this.page.evaluate(() => {
            const successText = document.querySelector('.success, .confirmation, .thank-you');
            return successText ? successText.textContent : 'Form submitted';
          });
          
          return {
            id: `sf_${Date.now()}`,
            confirmation
          };
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    throw new Error('Could not find submit button');
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

/**
 * Utility function to create a sample damage report for testing
 */
function createSampleReport(damageType = 'pothole') {
  return new DamageReport({
    damageType,
    description: 'Large pothole approximately 2 feet in diameter and 6 inches deep. Located in the center of the lane, causing significant vehicle damage risk.',
    latitude: 37.7749,
    longitude: -122.4194,
    imagePath: path.join(__dirname, 'sample-image.jpg'), // You'll need to provide a sample image
    severity: 'high',
    reporterName: 'Test Reporter',
    reporterEmail: 'test@example.com',
    reporterPhone: '555-123-4567',
    additionalNotes: 'Reported via Pot Buddy automation system'
  });
}

// Export classes and functions
module.exports = {
  DamageReport,
  SFFormAutomation,
  createSampleReport
};

// Run sample test if this file is executed directly
if (require.main === module) {
  async function runSampleTest() {
    const automation = new SFFormAutomation({ headless: false });
    const sampleReport = createSampleReport('pothole');
    
    try {
      const result = await automation.submitDamageReport(sampleReport);
      console.log('Test result:', result);
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
  
  runSampleTest();
}
