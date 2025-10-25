const { chromium } = require('playwright');

/**
 * Location Page Field Analyzer - Check What's Actually Required on Location Page
 */
class LocationPageAnalyzer {
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
   * Analyze what's actually required on the location page
   */
  async analyzeLocationPage() {
    console.log('🔍 Analyzing Location Page Requirements');
    console.log('======================================');
    
    try {
      await this.init();
      
      // Navigate to pothole form and get to location page
      console.log('🌐 Navigating to pothole form...');
      await this.page.goto('https://www.sf.gov/report-pothole-and-street-issues', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Click Report button
      console.log('🖱️ Clicking Report button...');
      const reportButton = await this.findReportButton();
      if (reportButton) {
        await reportButton.click();
        await this.page.waitForTimeout(5000);
      }
      
      // Handle emergency disclaimer
      console.log('🚨 Handling emergency disclaimer...');
      const nextButton = await this.findNextButton();
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForTimeout(3000);
      }
      
      // Select issue type
      console.log('📋 Selecting issue type...');
      await this.selectIssueType('Street');
      
      // Complete location workflow
      console.log('📍 Completing location workflow...');
      await this.completeLocationWorkflow();
      
      // Now analyze what's actually visible and required
      console.log('🔍 Analyzing visible fields on location page...');
      await this.analyzeVisibleFields();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Analyze visible fields on the current page
   */
  async analyzeVisibleFields() {
    console.log(`\n🔍 Visible Fields Analysis:`);
    console.log(`===========================`);
    
    // Get all visible input fields
    const visibleFields = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs
        .map((input, index) => ({
          index: index + 1,
          tag: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          required: input.required,
          value: input.value,
          className: input.className,
          isVisible: input.offsetParent !== null,
          isEnabled: !input.disabled,
          label: document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() || '',
          boundingRect: input.getBoundingClientRect()
        }))
        .filter(field => field.isVisible);
      
      return inputs;
    });
    
    console.log(`   Found ${visibleFields.length} visible fields:`);
    visibleFields.forEach(field => {
      console.log(`     ${field.index}. <${field.tag}> type="${field.type}" name="${field.name}" id="${field.id}"`);
      console.log(`        Label: "${field.label}"`);
      console.log(`        Required: ${field.required}`);
      console.log(`        Value: "${field.value}"`);
      console.log(`        Enabled: ${field.isEnabled}`);
      
      if (field.tag === 'SELECT' && field.type === 'select-one') {
        // Get options for select fields
        this.page.evaluate((fieldId) => {
          const select = document.getElementById(fieldId);
          if (select) {
            const options = Array.from(select.options).map(option => ({
              value: option.value,
              text: option.textContent?.trim()
            }));
            console.log(`        Options: ${options.length} items`);
            options.slice(0, 3).forEach((option, i) => {
              console.log(`          ${i + 1}. "${option.text}" (value: "${option.value}")`);
            });
          }
        }, field.id);
      }
    });
    
    // Check for any validation errors or messages
    console.log(`\n🔍 Validation Analysis:`);
    console.log(`======================`);
    
    const validationInfo = await this.page.evaluate(() => {
      const errors = [];
      
      // Check for required fields that are empty
      const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
      requiredFields.forEach(field => {
        if (!field.value || field.value.trim() === '') {
          const label = document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || '';
          errors.push({
            field: field.name || field.id,
            type: field.type,
            required: field.required,
            value: field.value,
            label: label,
            isVisible: field.offsetParent !== null
          });
        }
      });
      
      // Check for any error messages
      const errorMessages = document.querySelectorAll('.error, .invalid, [class*="error"], [class*="invalid"], .field-error, .validation-error');
      errorMessages.forEach(error => {
        if (error.textContent?.trim()) {
          errors.push({
            type: 'error_message',
            message: error.textContent.trim(),
            element: error.tagName,
            className: error.className
          });
        }
      });
      
      return errors;
    });
    
    console.log(`   Found ${validationInfo.length} validation issues:`);
    validationInfo.forEach((error, i) => {
      console.log(`     ${i + 1}. ${error.type}: ${error.field || error.message}`);
      if (error.label) console.log(`        Label: ${error.label}`);
      if (error.value !== undefined) console.log(`        Value: "${error.value}"`);
      if (error.isVisible !== undefined) console.log(`        Visible: ${error.isVisible}`);
    });
    
    // Check if there are any JavaScript validation functions
    console.log(`\n🔍 JavaScript Validation Analysis:`);
    console.log(`===================================`);
    
    const jsValidation = await this.page.evaluate(() => {
      // Look for form validation functions
      const form = document.querySelector('form');
      if (!form) return null;
      
      return {
        hasOnSubmit: !!form.onsubmit,
        hasAddEventListener: form.addEventListener ? 'has listeners' : 'no listeners',
        formId: form.id,
        formName: form.name,
        formAction: form.action,
        formMethod: form.method
      };
    });
    
    if (jsValidation) {
      console.log(`   Form validation info:`);
      console.log(`     Form ID: ${jsValidation.formId}`);
      console.log(`     Form Name: ${jsValidation.formName}`);
      console.log(`     Form Action: ${jsValidation.formAction}`);
      console.log(`     Form Method: ${jsValidation.formMethod}`);
      console.log(`     Has onSubmit: ${jsValidation.hasOnSubmit}`);
      console.log(`     Has Event Listeners: ${jsValidation.hasAddEventListener}`);
    }
  }

  /**
   * Complete location workflow (same as before)
   */
  async completeLocationWorkflow() {
    const coordinates = '37.755196, -122.423207';
    const locationDescription = 'On the side of the street facing Plane Jaine restaurant directly in the center of the right lane.';
    
    // Find and fill the address field
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Enter coordinates
    await addressField.fill(coordinates);
    await this.page.waitForTimeout(1000);
    
    // Click magnifying glass to search
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
    } else {
      await addressField.press('Enter');
    }
    
    // Wait for map to load
    await this.page.waitForTimeout(3000);
    
    // Click + button twice to zoom in
    await this.clickZoomInButton();
    
    // Wait for zoom to complete
    await this.page.waitForTimeout(2000);
    
    // Click center of map
    await this.clickMapCenter();
    
    // Wait for location field to be populated
    await this.page.waitForTimeout(2000);
    
    // Fill location description and press Enter
    await this.fillLocationDescriptionAndSave(locationDescription);
  }

  /**
   * Click zoom in button twice
   */
  async clickZoomInButton() {
    const zoomInSelectors = [
      'button[title*="zoom in"]',
      'button[aria-label*="zoom in"]',
      'button[class*="zoom-in"]',
      'button[class*="zoomIn"]',
      'button:has-text("+")',
      'div[class*="zoom-in"]',
      'div[class*="zoomIn"]',
      'div:has-text("+")'
    ];
    
    let zoomInButton = null;
    for (const selector of zoomInSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          zoomInButton = element;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (zoomInButton) {
      await zoomInButton.click();
      await this.page.waitForTimeout(500);
      await zoomInButton.click();
    }
  }

  /**
   * Click center of map
   */
  async clickMapCenter() {
    const mapInfo = await this.page.evaluate(() => {
      const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      return {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2
      };
    });
    
    if (mapInfo) {
      await this.page.click('body', { position: { x: mapInfo.centerX, y: mapInfo.centerY } });
    }
  }

  /**
   * Fill location description and press Enter to save
   */
  async fillLocationDescriptionAndSave(description) {
    const descriptionFieldSelectors = [
      'textarea[placeholder*="description"]',
      'textarea[placeholder*="details"]',
      'textarea[name*="description"]',
      'textarea[id*="description"]',
      'input[placeholder*="description"]',
      'input[name*="description"]',
      'input[id*="description"]',
      'textarea',
      'input[type="text"]'
    ];
    
    for (const selector of descriptionFieldSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.fill(description);
          await element.press('Enter');
          await this.page.waitForTimeout(1000);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
  }

  /**
   * Find address field
   */
  async findAddressField() {
    const selectors = [
      'input[placeholder*="address"]',
      'input[placeholder*="place"]',
      'input[placeholder*="Find address"]',
      'input[name*="address"]',
      'input[id*="address"]',
      'input[type="text"]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }

  /**
   * Find search button
   */
  async findSearchButton() {
    const searchButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Search")',
      'button[class*="search"]',
      'button[class*="magnify"]',
      'input[type="submit"]',
      'button[aria-label*="search"]',
      'button[title*="search"]',
      'div[class*="searchBtn"]',
      'div[class*="searchSubmit"]'
    ];
    
    for (const selector of searchButtonSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }

  /**
   * Find Report button
   */
  async findReportButton() {
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
      const selector = `a[href="${verintButton.href}"]`;
      return await this.page.$(selector);
    }
    
    return null;
  }

  /**
   * Find Next button
   */
  async findNextButton() {
    const allButtons = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim() || el.value || '',
          className: el.className,
          id: el.id,
          isVisible: el.offsetParent !== null,
          isEnabled: !el.disabled
        }))
        .filter(el => el.text && el.isVisible && el.isEnabled);
      
      return elements;
    });
    
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    if (nextButtons.length > 0) {
      const firstNextButton = nextButtons[0];
      const selector = firstNextButton.tag === 'A' ? 
        `a:has-text("${firstNextButton.text}")` : 
        firstNextButton.tag === 'INPUT' ?
        `input[value="${firstNextButton.text}"]` :
        `button:has-text("${firstNextButton.text}")`;
      
      return await this.page.$(selector);
    }
    
    return null;
  }

  /**
   * Select issue type - FIXED to select Street specifically
   */
  async selectIssueType(issueType) {
    const streetSelector = 'input[type="radio"][value="street_defect"]';
    const streetElement = await this.page.$(streetSelector);
    
    if (streetElement) {
      await streetElement.click();
      await this.page.waitForTimeout(1000);
    }
  }
}

// Export the class
module.exports = { LocationPageAnalyzer };

// Run test if this file is executed directly
if (require.main === module) {
  async function runLocationPageAnalysis() {
    const analyzer = new LocationPageAnalyzer({ headless: false });
    
    try {
      const result = await analyzer.analyzeLocationPage();
      
      console.log('\n📊 Analysis Results:');
      console.log('===================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Location page analysis failed:', error);
    }
  }
  
  runLocationPageAnalysis();
}
