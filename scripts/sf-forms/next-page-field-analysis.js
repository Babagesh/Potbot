const { chromium } = require('playwright');

/**
 * Next Page Field Analysis - Debug What Fields Are Available
 */
class NextPageFieldAnalysis {
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
   * Analyze fields on the next page
   */
  async analyzeNextPageFields() {
    console.log('🔍 Analyzing Next Page Fields');
    console.log('============================');
    
    try {
      await this.init();
      
      // Navigate to pothole form and get to next page
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
      
      // Now analyze the next page
      console.log('🔍 Analyzing next page fields...');
      await this.analyzeFieldsOnCurrentPage();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Analyze all fields on the current page
   */
  async analyzeFieldsOnCurrentPage() {
    console.log(`\n📊 Current Page Analysis:`);
    console.log(`========================`);
    
    const pageInfo = await this.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasForm: document.querySelector('form') !== null,
        formCount: document.querySelectorAll('form').length
      };
    });
    
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   Has form: ${pageInfo.hasForm}`);
    console.log(`   Form count: ${pageInfo.formCount}`);
    
    // Analyze all input fields
    console.log(`\n📝 Input Fields Analysis:`);
    console.log(`========================`);
    
    const inputFields = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map((input, index) => ({
        index: index + 1,
        tag: input.tagName,
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        required: input.required,
        value: input.value,
        className: input.className,
        label: document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() || '',
        options: input.tagName === 'SELECT' ? Array.from(input.options).map(option => ({
          value: option.value,
          text: option.textContent?.trim()
        })) : []
      }));
    });
    
    console.log(`   Found ${inputFields.length} input fields:`);
    inputFields.forEach(field => {
      console.log(`     ${field.index}. <${field.tag}> type="${field.type}" name="${field.name}" id="${field.id}" placeholder="${field.placeholder}" required=${field.required}`);
      console.log(`        Label: "${field.label}"`);
      if (field.options.length > 0) {
        console.log(`        Options: ${field.options.length} items`);
        field.options.slice(0, 5).forEach((option, i) => {
          console.log(`          ${i + 1}. "${option.text}" (value: "${option.value}")`);
        });
        if (field.options.length > 5) {
          console.log(`          ... and ${field.options.length - 5} more options`);
        }
      }
    });
    
    // Look for specific field types
    console.log(`\n🔍 Specific Field Analysis:`);
    console.log(`===========================`);
    
    // Dropdown/Select fields
    const selectFields = inputFields.filter(field => field.tag === 'SELECT');
    console.log(`   Select/Dropdown fields: ${selectFields.length}`);
    selectFields.forEach((field, i) => {
      console.log(`     ${i + 1}. "${field.label}" (${field.options.length} options)`);
    });
    
    // File upload fields
    const fileFields = inputFields.filter(field => field.type === 'file');
    console.log(`   File upload fields: ${fileFields.length}`);
    fileFields.forEach((field, i) => {
      console.log(`     ${i + 1}. "${field.label}" name="${field.name}" id="${field.id}"`);
    });
    
    // Text/Textarea fields
    const textFields = inputFields.filter(field => 
      field.type === 'text' || field.type === 'textarea' || field.tag === 'TEXTAREA'
    );
    console.log(`   Text/Textarea fields: ${textFields.length}`);
    textFields.forEach((field, i) => {
      console.log(`     ${i + 1}. "${field.label}" placeholder="${field.placeholder}" name="${field.name}"`);
    });
    
    // Look for buttons
    console.log(`\n🔘 Button Analysis:`);
    console.log(`===================`);
    
    const buttons = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      return elements.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim() || el.value || '',
        className: el.className,
        id: el.id,
        isVisible: el.offsetParent !== null,
        isEnabled: !el.disabled
      })).filter(btn => btn.text && btn.isVisible && btn.isEnabled);
    });
    
    console.log(`   Found ${buttons.length} buttons:`);
    buttons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" class="${btn.className}" id="${btn.id}"`);
    });
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
    
    // Click Next button
    await this.clickNextButtonFinal();
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
   * FINAL: Click Next button using coordinate-based approach
   */
  async clickNextButtonFinal() {
    const allButtons = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: el.textContent?.trim() || el.value || '',
            className: el.className,
            id: el.id,
            isVisible: el.offsetParent !== null,
            isEnabled: !el.disabled,
            rect: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2
            }
          };
        })
        .filter(el => el.text && el.isVisible && el.isEnabled);
      
      return elements;
    });
    
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    if (nextButtons.length > 0) {
      const nextButton = nextButtons[0];
      await this.page.click('body', { position: { x: nextButton.rect.centerX, y: nextButton.rect.centerY } });
      await this.page.waitForTimeout(3000);
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
module.exports = { NextPageFieldAnalysis };

// Run test if this file is executed directly
if (require.main === module) {
  async function runFieldAnalysis() {
    const automation = new NextPageFieldAnalysis({ headless: false });
    
    try {
      const result = await automation.analyzeNextPageFields();
      
      console.log('\n📊 Analysis Results:');
      console.log('===================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Field analysis failed:', error);
    }
  }
  
  runFieldAnalysis();
}
