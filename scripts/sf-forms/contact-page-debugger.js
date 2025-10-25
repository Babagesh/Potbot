const { chromium } = require('playwright');

/**
 * Contact Information Page Debugger - Analyze What's on the Contact Page
 */
class ContactPageDebugger {
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
   * Debug contact information page
   */
  async debugContactPage() {
    console.log('🔍 Debugging Contact Information Page');
    console.log('====================================');
    
    try {
      await this.init();
      
      // Navigate to pothole form and get to contact page
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
      
      // Force click Next to get to request details page
      console.log('➡️ Force clicking Next button...');
      await this.forceNextButtonClick();
      
      // Fill request details
      console.log('📝 Filling request details...');
      await this.fillRequestDetails();
      
      // Click Next to get to contact page
      console.log('➡️ Clicking Next to get to contact page...');
      await this.clickNextToContactPage();
      
      // Now analyze the contact page
      console.log('🔍 Analyzing contact information page...');
      await this.analyzeContactPage();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Analyze contact page
   */
  async analyzeContactPage() {
    console.log(`\n🔍 Contact Page Analysis:`);
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
    
    // Analyze all visible input fields
    console.log(`\n📝 Visible Input Fields:`);
    console.log(`========================`);
    
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
      
      if (field.tag === 'INPUT' && field.type === 'radio') {
        console.log(`        Radio button - checking siblings...`);
      }
    });
    
    // Look for all radio buttons (visible and hidden)
    console.log(`\n🔘 All Radio Buttons:`);
    console.log(`====================`);
    
    const allRadioButtons = await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      return radios.map((radio, index) => ({
        index: index + 1,
        name: radio.name,
        id: radio.id,
        value: radio.value,
        checked: radio.checked,
        isVisible: radio.offsetParent !== null,
        isEnabled: !radio.disabled,
        className: radio.className,
        label: document.querySelector(`label[for="${radio.id}"]`)?.textContent?.trim() || '',
        siblingText: radio.nextElementSibling?.textContent?.trim() || '',
        parentText: radio.parentElement?.textContent?.trim() || ''
      }));
    });
    
    console.log(`   Found ${allRadioButtons.length} radio buttons:`);
    allRadioButtons.forEach((radio, i) => {
      console.log(`     ${i + 1}. name="${radio.name}" id="${radio.id}" value="${radio.value}"`);
      console.log(`        Label: "${radio.label}"`);
      console.log(`        Sibling Text: "${radio.siblingText}"`);
      console.log(`        Parent Text: "${radio.parentText.substring(0, 100)}..."`);
      console.log(`        Visible: ${radio.isVisible}, Enabled: ${radio.isEnabled}, Checked: ${radio.checked}`);
    });
    
    // Look for buttons
    console.log(`\n🔘 All Buttons:`);
    console.log(`===============`);
    
    const allButtons = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      return buttons.map((btn, index) => ({
        index: index + 1,
        tag: btn.tagName,
        text: btn.textContent?.trim() || btn.value || '',
        className: btn.className,
        id: btn.id,
        isVisible: btn.offsetParent !== null,
        isEnabled: !btn.disabled,
        type: btn.type
      })).filter(btn => btn.text);
    });
    
    console.log(`   Found ${allButtons.length} buttons:`);
    allButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" class="${btn.className}" id="${btn.id}"`);
      console.log(`        Visible: ${btn.isVisible}, Enabled: ${btn.isEnabled}`);
    });
    
    // Look for text content that might indicate anonymous options
    console.log(`\n📄 Page Text Analysis:`);
    console.log(`=====================`);
    
    const pageText = await this.page.evaluate(() => {
      return document.body.textContent || '';
    });
    
    const anonymousKeywords = ['anonymous', 'remain anonymous', 'contact', 'information', 'provide', 'no', 'yes'];
    anonymousKeywords.forEach(keyword => {
      const regex = new RegExp(`.{0,50}${keyword}.{0,50}`, 'gi');
      const matches = pageText.match(regex);
      if (matches) {
        console.log(`   Found "${keyword}":`);
        matches.slice(0, 3).forEach(match => {
          console.log(`     "${match.trim()}"`);
        });
      }
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
  }

  /**
   * Force Next button click using JavaScript
   */
  async forceNextButtonClick() {
    const success = await this.page.evaluate(() => {
      const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .filter(el => {
          const text = el.textContent?.trim() || el.value || '';
          return /next|continue|proceed/i.test(text);
        });
      
      if (nextButtons.length > 0) {
        nextButtons[0].click();
        return true;
      }
      return false;
    });
    
    if (success) {
      await this.page.waitForTimeout(3000);
    }
  }

  /**
   * Fill request details
   */
  async fillRequestDetails() {
    // Fill dropdown
    const dropdownElement = await this.page.$('select[name="Nature_of_request"]');
    if (dropdownElement) {
      await dropdownElement.evaluate((element) => {
        element.value = 'missing_side_sewer_vent_cover';
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    
    // Fill description
    const descriptionElement = await this.page.$('textarea[name="Request_description"]');
    if (descriptionElement) {
      await descriptionElement.fill('The manhole is completely missing a sewer cover, which is a huge safety liability.');
    }
    
    // Upload image
    const fileElement = await this.page.$('input[name="File_attach[]"]');
    if (fileElement) {
      await fileElement.setInputFiles('/Users/adhi/Desktop/pot-buddy/scripts/sf-forms/sample-pothole-image.jpg');
    }
    
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click Next to get to contact page
   */
  async clickNextToContactPage() {
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
module.exports = { ContactPageDebugger };

// Run test if this file is executed directly
if (require.main === module) {
  async function runContactPageDebug() {
    const debuggerInstance = new ContactPageDebugger({ headless: false });
    
    try {
      const result = await debuggerInstance.debugContactPage();
      
      console.log('\n📊 Debug Results:');
      console.log('=================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Contact page debug failed:', error);
    }
  }
  
  runContactPageDebug();
}
