const { chromium } = require('playwright');

/**
 * Comprehensive SF.gov form filler
 */
class SFFormFiller {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 30000;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

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

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Fill out a complete SF.gov form
   */
  async fillForm(damageType, formData) {
    console.log(`\n📝 Filling ${damageType.toUpperCase()} Form`);
    console.log('='.repeat(50));
    
    try {
      await this.init();
      
      // Navigate to form
      const formUrl = this.getFormUrl(damageType);
      console.log(`🌐 Navigating to: ${formUrl}`);
      await this.page.goto(formUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Click Report/Request button
      const reportButton = await this.findReportOrRequestButton();
      if (reportButton) {
        console.log(`🖱️ Clicking ${reportButton.text} button`);
        await reportButton.element.click();
        await this.page.waitForTimeout(5000);
      }
      
      // Handle emergency disclaimer
      const nextButton = await this.findNextButton();
      if (nextButton) {
        console.log(`🖱️ Clicking Next button`);
        await nextButton.element.click();
        await this.page.waitForTimeout(3000);
      }
      
      // Now fill out the form
      console.log('📝 Filling form fields...');
      const fillResult = await this.fillFormFields(formData);
      
      return {
        damageType,
        formUrl,
        success: true,
        fieldsFilled: fillResult.fieldsFilled,
        fieldsSkipped: fillResult.fieldsSkipped,
        filledAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.log(`❌ Error filling ${damageType}: ${error.message}`);
      return {
        damageType,
        formUrl: this.getFormUrl(damageType),
        success: false,
        error: error.message,
        filledAt: new Date().toISOString()
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Get form URL for damage type
   */
  getFormUrl(damageType) {
    const urls = {
      pothole: 'https://www.sf.gov/report-pothole-and-street-issues',
      sidewalk: 'https://www.sf.gov/report-curb-and-sidewalk-problems',
      graffiti: 'https://www.sf.gov/report-graffiti-issues',
      trash: 'https://www.sf.gov/report-garbage-container-issues',
      streetMarkings: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
      streetlight: 'https://www.sf.gov/report-problem-streetlight',
      fallenTree: 'https://www.sf.gov/report-damaged-or-fallen-tree'
    };
    
    return urls[damageType];
  }

  /**
   * Find Report or Request button
   */
  async findReportOrRequestButton() {
    const allButtons = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button'))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim() || '',
          href: el.href || '',
          className: el.className,
          id: el.id,
          isVisible: el.offsetParent !== null
        }))
        .filter(el => el.text && el.isVisible);
      
      return elements;
    });
    
    const verintButton = allButtons.find(btn => 
      btn.href && btn.href.includes('verintcloudservices.com')
    );
    
    if (verintButton) {
      const selector = verintButton.tag === 'A' ? 
        `a[href="${verintButton.href}"]` : 
        `button:has-text("${verintButton.text}")`;
      
      const element = await this.page.$(selector);
      if (element) {
        return { element, text: verintButton.text, selector };
      }
    }
    
    return null;
  }

  /**
   * Find Next button
   */
  async findNextButton() {
    const selectors = [
      'button:has-text("Next")',
      'a:has-text("Next")',
      'button:has-text("Continue")',
      'a:has-text("Continue")'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          const text = await element.textContent();
          return { element, text: text.trim(), selector };
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }

  /**
   * Fill form fields with data
   */
  async fillFormFields(formData) {
    const fieldsFilled = [];
    const fieldsSkipped = [];
    
    // Get all form fields
    const fields = await this.page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      const fields = [];
      
      inputs.forEach((input, index) => {
        const field = {
          index: index + 1,
          type: input.type || input.tagName.toLowerCase(),
          name: input.name || '',
          id: input.id || '',
          placeholder: input.placeholder || '',
          required: input.required || false,
          className: input.className || '',
          label: ''
        };

        // Try to find associated label
        if (input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label) {
            field.label = label.textContent.trim();
          }
        }

        // Only include fields with names/ids
        if (field.name || field.id) {
          fields.push(field);
        }
      });

      return fields;
    });

    console.log(`   Found ${fields.length} form fields to process`);

    // Fill fields based on their purpose
    for (const field of fields) {
      try {
        const value = this.getFieldValue(field, formData);
        
        if (value !== null) {
          await this.fillField(field, value);
          fieldsFilled.push({
            name: field.name,
            id: field.id,
            type: field.type,
            value: value
          });
          console.log(`   ✅ Filled ${field.name || field.id}: ${value}`);
        } else {
          fieldsSkipped.push({
            name: field.name,
            id: field.id,
            type: field.type,
            reason: 'No matching data'
          });
        }
      } catch (error) {
        fieldsSkipped.push({
          name: field.name,
          id: field.id,
          type: field.type,
          reason: error.message
        });
        console.log(`   ⚠️ Skipped ${field.name || field.id}: ${error.message}`);
      }
    }

    return { fieldsFilled, fieldsSkipped };
  }

  /**
   * Get appropriate value for a field based on its name/type
   */
  getFieldValue(field, formData) {
    const name = field.name.toLowerCase();
    const id = field.id.toLowerCase();
    const label = field.label.toLowerCase();
    const placeholder = field.placeholder.toLowerCase();

    // Location fields
    if (name.includes('address') || name.includes('street') || name.includes('building')) {
      return formData.address || '123 Main Street, San Francisco, CA';
    }
    
    if (name.includes('location') || name.includes('intersection')) {
      return formData.location || 'Main Street and Market Street';
    }

    // Contact fields
    if (name.includes('name') && !name.includes('building')) {
      return formData.reporterName || 'Pot Buddy User';
    }
    
    if (name.includes('email')) {
      return formData.reporterEmail || 'potbuddy@example.com';
    }
    
    if (name.includes('phone') || name.includes('tel')) {
      return formData.reporterPhone || '555-123-4567';
    }

    // Description fields
    if (name.includes('description') || name.includes('details') || name.includes('comment')) {
      return formData.description || `AI-detected ${formData.damageType} issue requiring attention`;
    }

    // Issue type fields
    if (name.includes('issue') || name.includes('type')) {
      return formData.damageType || 'general';
    }

    // Severity fields
    if (name.includes('severity') || name.includes('priority') || name.includes('urgency')) {
      return formData.severity || 'medium';
    }

    // Skip system fields
    if (name.includes('ref') || name.includes('password') || name.includes('conf')) {
      return null;
    }

    // Default values for common field types
    if (field.type === 'text' && !name.includes('ref')) {
      return 'Sample data';
    }
    
    if (field.type === 'textarea') {
      return 'Additional details about the issue';
    }

    return null;
  }

  /**
   * Fill a specific field
   */
  async fillField(field, value) {
    const selector = field.id ? `#${field.id}` : `[name="${field.name}"]`;
    
    try {
      const element = await this.page.$(selector);
      if (!element) {
        throw new Error('Element not found');
      }

      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await this.page.selectOption(selector, value);
      } else if (field.type === 'radio') {
        await this.page.check(`input[name="${field.name}"][value="${value}"]`);
      } else if (field.type === 'checkbox') {
        await this.page.check(selector);
      } else if (field.type === 'file') {
        // Skip file uploads for now
        throw new Error('File upload not implemented');
      } else {
        await this.page.fill(selector, value);
      }
    } catch (error) {
      throw new Error(`Failed to fill field: ${error.message}`);
    }
  }

  /**
   * Test form filling for all damage types
   */
  async testAllForms() {
    const sampleData = {
      damageType: 'pothole',
      description: 'Large pothole approximately 2 feet in diameter and 6 inches deep',
      address: '123 Main Street, San Francisco, CA',
      location: 'Main Street and Market Street',
      reporterName: 'Pot Buddy User',
      reporterEmail: 'potbuddy@example.com',
      reporterPhone: '555-123-4567',
      severity: 'high'
    };

    const damageTypes = ['pothole', 'sidewalk', 'trash', 'streetlight', 'fallenTree'];

    console.log('🧪 Testing Form Filling for All Damage Types\n');
    console.log('==========================================');

    const results = {};

    for (const damageType of damageTypes) {
      const formData = { ...sampleData, damageType };
      const result = await this.fillForm(damageType, formData);
      results[damageType] = result;
      
      console.log(`Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (result.success) {
        console.log(`   Fields filled: ${result.fieldsFilled.length}`);
        console.log(`   Fields skipped: ${result.fieldsSkipped.length}`);
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    return results;
  }
}

// Export the class
module.exports = { SFFormFiller };

// Run test if this file is executed directly
if (require.main === module) {
  async function runFormFillingTest() {
    const filler = new SFFormFiller({ headless: false });
    
    try {
      const results = await filler.testAllForms();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'sf-form-filling-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Form filling results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Form filling test failed:', error);
    }
  }
  
  runFormFillingTest();
}
