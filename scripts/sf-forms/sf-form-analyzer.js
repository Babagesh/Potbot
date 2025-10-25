const { chromium } = require('playwright');

/**
 * Comprehensive form analyzer for all SF.gov forms
 */
class SFFormAnalyzer {
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
   * Navigate to a specific form and analyze its fields
   */
  async analyzeForm(damageType, formUrl) {
    console.log(`\n🔍 Analyzing ${damageType.toUpperCase()} Form`);
    console.log('='.repeat(50));
    
    try {
      await this.init();
      
      // Navigate to the form
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
      
      // Now analyze the actual form
      console.log('📝 Analyzing form fields...');
      const formAnalysis = await this.analyzeFormFields();
      
      return {
        damageType,
        formUrl,
        analysis: formAnalysis,
        analyzedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.log(`❌ Error analyzing ${damageType}: ${error.message}`);
      return {
        damageType,
        formUrl,
        error: error.message,
        analyzedAt: new Date().toISOString()
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Find Report or Request button
   */
  async findReportOrRequestButton() {
    // First, get all buttons and links to find the right one
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
    
    // Look for Verint buttons specifically
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
    
    // Fallback to original selectors
    const selectors = [
      'a:has-text("Report")',
      'a:has-text("Request")',
      'button:has-text("Report")',
      'button:has-text("Request")'
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
   * Analyze all form fields on the current page
   */
  async analyzeFormFields() {
    const analysis = await this.page.evaluate(() => {
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
          value: input.value || '',
          className: input.className || '',
          label: '',
          options: []
        };

        // Try to find associated label
        if (input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label) {
            field.label = label.textContent.trim();
          }
        }

        // For select elements, get options
        if (input.tagName.toLowerCase() === 'select') {
          const options = input.querySelectorAll('option');
          options.forEach(option => {
            if (option.value) {
              field.options.push({
                value: option.value,
                text: option.textContent.trim(),
                selected: option.selected
              });
            }
          });
        }

        // For radio buttons, get all options in the group
        if (input.type === 'radio') {
          const radioGroup = document.querySelectorAll(`input[name="${input.name}"]`);
          field.radioGroup = Array.from(radioGroup).map(radio => ({
            value: radio.value,
            text: radio.nextElementSibling?.textContent?.trim() || '',
            checked: radio.checked
          }));
        }

        // Only include fields with names/ids
        if (field.name || field.id) {
          fields.push(field);
        }
      });

      return {
        totalFields: fields.length,
        fields: fields,
        fieldTypes: {
          text: fields.filter(f => f.type === 'text').length,
          textarea: fields.filter(f => f.type === 'textarea').length,
          select: fields.filter(f => f.type === 'select-one').length,
          radio: fields.filter(f => f.type === 'radio').length,
          checkbox: fields.filter(f => f.type === 'checkbox').length,
          file: fields.filter(f => f.type === 'file').length,
          email: fields.filter(f => f.type === 'email').length,
          phone: fields.filter(f => f.type === 'tel').length,
          number: fields.filter(f => f.type === 'number').length,
          date: fields.filter(f => f.type === 'date').length
        },
        requiredFields: fields.filter(f => f.required).length,
        optionalFields: fields.filter(f => !f.required).length
      };
    });

    // Categorize fields by purpose
    const categorizedFields = this.categorizeFields(analysis.fields);
    
    return {
      ...analysis,
      categorizedFields
    };
  }

  /**
   * Categorize fields by their likely purpose
   */
  categorizeFields(fields) {
    const categories = {
      location: [],
      contact: [],
      description: [],
      details: [],
      fileUpload: [],
      other: []
    };

    fields.forEach(field => {
      const name = field.name.toLowerCase();
      const id = field.id.toLowerCase();
      const label = field.label.toLowerCase();
      const placeholder = field.placeholder.toLowerCase();

      // Location fields
      if (name.includes('address') || name.includes('location') || name.includes('street') || 
          name.includes('building') || name.includes('intersection') || name.includes('cross') ||
          id.includes('address') || id.includes('location') || id.includes('street') ||
          label.includes('address') || label.includes('location') || label.includes('street')) {
        categories.location.push(field);
      }
      // Contact fields
      else if (name.includes('name') || name.includes('email') || name.includes('phone') || 
               name.includes('contact') || name.includes('reporter') ||
               id.includes('name') || id.includes('email') || id.includes('phone') ||
               label.includes('name') || label.includes('email') || label.includes('phone')) {
        categories.contact.push(field);
      }
      // Description fields
      else if (name.includes('description') || name.includes('details') || name.includes('comment') ||
               name.includes('note') || name.includes('explain') ||
               id.includes('description') || id.includes('details') ||
               label.includes('description') || label.includes('details')) {
        categories.description.push(field);
      }
      // File upload fields
      else if (field.type === 'file' || name.includes('file') || name.includes('image') || 
               name.includes('photo') || name.includes('attachment') ||
               id.includes('file') || id.includes('image') || id.includes('photo')) {
        categories.fileUpload.push(field);
      }
      // Other specific fields
      else if (name.includes('issue') || name.includes('type') || name.includes('severity') ||
               name.includes('priority') || name.includes('urgency') ||
               id.includes('issue') || id.includes('type') || id.includes('severity')) {
        categories.details.push(field);
      }
      // Everything else
      else {
        categories.other.push(field);
      }
    });

    return categories;
  }

  /**
   * Analyze all SF.gov forms
   */
  async analyzeAllForms() {
    const forms = {
      pothole: 'https://www.sf.gov/report-pothole-and-street-issues',
      sidewalk: 'https://www.sf.gov/report-curb-and-sidewalk-problems',
      graffiti: 'https://www.sf.gov/report-graffiti-issues',
      trash: 'https://www.sf.gov/report-garbage-container-issues',
      streetMarkings: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
      streetlight: 'https://www.sf.gov/report-problem-streetlight',
      fallenTree: 'https://www.sf.gov/report-damaged-or-fallen-tree'
    };

    console.log('🧪 Analyzing All SF.gov Forms\n');
    console.log('=============================');

    const results = {};

    for (const [damageType, url] of Object.entries(forms)) {
      const result = await this.analyzeForm(damageType, url);
      results[damageType] = result;
      
      // Wait between analyses
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Summary
    console.log('\n📊 Form Analysis Summary:');
    console.log('=========================');
    
    Object.entries(results).forEach(([type, result]) => {
      if (result.analysis) {
        console.log(`✅ ${type}: ${result.analysis.totalFields} fields`);
        console.log(`   Location: ${result.analysis.categorizedFields.location.length}`);
        console.log(`   Contact: ${result.analysis.categorizedFields.contact.length}`);
        console.log(`   Description: ${result.analysis.categorizedFields.description.length}`);
        console.log(`   File Upload: ${result.analysis.categorizedFields.fileUpload.length}`);
        console.log(`   Details: ${result.analysis.categorizedFields.details.length}`);
        console.log(`   Other: ${result.analysis.categorizedFields.other.length}`);
      } else {
        console.log(`❌ ${type}: Error - ${result.error}`);
      }
    });

    return results;
  }
}

// Export the class
module.exports = { SFFormAnalyzer };

// Run analysis if this file is executed directly
if (require.main === module) {
  async function runAnalysis() {
    const analyzer = new SFFormAnalyzer({ headless: false });
    
    try {
      const results = await analyzer.analyzeAllForms();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'sf-form-analysis-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Analysis results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }
  
  runAnalysis();
}
