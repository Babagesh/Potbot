const { chromium } = require('playwright');

/**
 * Next Button Debugging - Understand Why Next Button Isn't Working
 */
class NextButtonDebugger {
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
   * Debug the Next button issue
   */
  async debugNextButton() {
    console.log('🔍 Debugging Next Button Issue');
    console.log('==============================');
    
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
      
      // Fill required fields
      console.log('📝 Filling required fields...');
      await this.fillRequiredFields();
      
      // Now debug the Next button
      console.log('🔍 Debugging Next button...');
      await this.debugNextButtonDetails();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Debug Next button details
   */
  async debugNextButtonDetails() {
    console.log(`\n🔍 Next Button Analysis:`);
    console.log(`========================`);
    
    // Get all buttons with their positions
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
    
    console.log(`   Found ${allButtons.length} buttons:`);
    allButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" class="${btn.className}" id="${btn.id}"`);
      console.log(`        Position: (${btn.rect.centerX}, ${btn.rect.centerY})`);
      console.log(`        Enabled: ${btn.isEnabled}, Visible: ${btn.isVisible}`);
    });
    
    // Find Next buttons
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    console.log(`\n🔍 Next Button Analysis:`);
    console.log(`========================`);
    console.log(`   Found ${nextButtons.length} Next buttons:`);
    nextButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. "${btn.text}" at (${btn.rect.centerX}, ${btn.rect.centerY})`);
      console.log(`        Class: ${btn.className}`);
      console.log(`        ID: ${btn.id}`);
    });
    
    if (nextButtons.length > 0) {
      const nextButton = nextButtons[0];
      console.log(`\n🔍 Detailed Next Button Analysis:`);
      console.log(`==================================`);
      
      // Get more details about the Next button
      const buttonDetails = await this.page.evaluate((buttonId) => {
        const button = document.getElementById(buttonId);
        if (!button) return null;
        
        return {
          tagName: button.tagName,
          textContent: button.textContent?.trim(),
          className: button.className,
          id: button.id,
          name: button.name,
          type: button.type,
          disabled: button.disabled,
          hidden: button.hidden,
          style: button.style.cssText,
          parentElement: button.parentElement?.tagName,
          parentClassName: button.parentElement?.className,
          form: button.form ? button.form.id : null,
          onclick: button.onclick ? button.onclick.toString() : null,
          addEventListener: button.addEventListener ? 'has listeners' : 'no listeners'
        };
      }, nextButton.id);
      
      if (buttonDetails) {
        console.log(`   Button Details:`);
        console.log(`     Tag: ${buttonDetails.tagName}`);
        console.log(`     Text: "${buttonDetails.textContent}"`);
        console.log(`     Class: ${buttonDetails.className}`);
        console.log(`     ID: ${buttonDetails.id}`);
        console.log(`     Name: ${buttonDetails.name}`);
        console.log(`     Type: ${buttonDetails.type}`);
        console.log(`     Disabled: ${buttonDetails.disabled}`);
        console.log(`     Hidden: ${buttonDetails.hidden}`);
        console.log(`     Style: ${buttonDetails.style}`);
        console.log(`     Parent: ${buttonDetails.parentElement} (${buttonDetails.parentClassName})`);
        console.log(`     Form: ${buttonDetails.form}`);
        console.log(`     OnClick: ${buttonDetails.onclick}`);
        console.log(`     Event Listeners: ${buttonDetails.addEventListener}`);
      }
      
      // Check if there are any validation errors
      console.log(`\n🔍 Form Validation Analysis:`);
      console.log(`============================`);
      
      const validationErrors = await this.page.evaluate(() => {
        const errors = [];
        
        // Check for required fields that are empty
        const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
        requiredFields.forEach(field => {
          if (!field.value || field.value.trim() === '') {
            errors.push({
              field: field.name || field.id,
              type: field.type,
              required: field.required,
              value: field.value,
              label: document.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || ''
            });
          }
        });
        
        // Check for any error messages
        const errorMessages = document.querySelectorAll('.error, .invalid, [class*="error"], [class*="invalid"]');
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
      
      console.log(`   Found ${validationErrors.length} validation issues:`);
      validationErrors.forEach((error, i) => {
        console.log(`     ${i + 1}. ${error.type}: ${error.field || error.message}`);
        if (error.label) console.log(`        Label: ${error.label}`);
        if (error.value !== undefined) console.log(`        Value: "${error.value}"`);
      });
      
      // Try clicking the button and see what happens
      console.log(`\n🔍 Testing Next Button Click:`);
      console.log(`=============================`);
      
      const urlBefore = this.page.url();
      console.log(`   URL before click: ${urlBefore}`);
      
      try {
        // Try different clicking methods
        console.log(`   Trying coordinate-based click...`);
        await this.page.click('body', { position: { x: nextButton.rect.centerX, y: nextButton.rect.centerY } });
        await this.page.waitForTimeout(2000);
        
        const urlAfter = this.page.url();
        console.log(`   URL after click: ${urlAfter}`);
        
        if (urlAfter !== urlBefore) {
          console.log(`   ✅ SUCCESS! URL changed - moved to next page!`);
        } else {
          console.log(`   ⚠️ URL didn't change - still on same page`);
          
          // Check if there are any JavaScript errors
          const jsErrors = await this.page.evaluate(() => {
            return window.consoleErrors || [];
          });
          
          if (jsErrors.length > 0) {
            console.log(`   JavaScript errors found:`);
            jsErrors.forEach((error, i) => {
              console.log(`     ${i + 1}. ${error}`);
            });
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Click failed: ${error.message}`);
      }
    }
  }

  /**
   * Fill required fields to enable Next button
   */
  async fillRequiredFields() {
    console.log(`   Filling required fields...`);
    
    // Fill Request type dropdown (required)
    console.log(`   Filling Request type dropdown...`);
    await this.fillRequestTypeDropdown();
    
    // Fill Last Name (required)
    console.log(`   Filling Last Name...`);
    await this.fillLastName('TestUser');
    
    // Fill Email (required)
    console.log(`   Filling Email...`);
    await this.fillEmail('test@example.com');
    
    // Answer "Would You Like to Add an Address?" (required)
    console.log(`   Answering address question...`);
    await this.answerAddressQuestion(true);
    
    // Answer "Recap Provided?" (required)
    console.log(`   Answering recap question...`);
    await this.answerRecapQuestion(true);
    
    console.log(`   ✅ All required fields filled`);
  }

  /**
   * Fill Request type dropdown
   */
  async fillRequestTypeDropdown() {
    const requestTypeSelector = 'select[name="Request_type"]';
    const requestTypeElement = await this.page.$(requestTypeSelector);
    
    if (requestTypeElement && await requestTypeElement.isVisible()) {
      // Get options
      const options = await requestTypeElement.evaluate(el => {
        return Array.from(el.options).map(option => ({
          value: option.value,
          text: option.textContent?.trim()
        }));
      });
      
      // Select first non-empty option
      const validOption = options.find(option => option.value && option.value !== '');
      if (validOption) {
        await requestTypeElement.selectOption(validOption.value);
        console.log(`   ✅ Selected Request type: "${validOption.text}"`);
      }
    }
  }

  /**
   * Fill Last Name
   */
  async fillLastName(lastName) {
    const lastNameSelector = 'input[name="surname"]';
    const lastNameElement = await this.page.$(lastNameSelector);
    
    if (lastNameElement && await lastNameElement.isVisible()) {
      await lastNameElement.fill(lastName);
      console.log(`   ✅ Filled Last Name: ${lastName}`);
    }
  }

  /**
   * Fill Email
   */
  async fillEmail(email) {
    const emailSelector = 'input[name="txt_individual_email_address_1"]';
    const emailElement = await this.page.$(emailSelector);
    
    if (emailElement && await emailElement.isVisible()) {
      await emailElement.fill(email);
      console.log(`   ✅ Filled Email: ${email}`);
    }
  }

  /**
   * Answer "Would You Like to Add an Address?" question
   */
  async answerAddressQuestion(hasAddress) {
    const addressRadioSelector = hasAddress ? 
      'input[name="rad_haveaddress"][value="Yes"]' : 
      'input[name="rad_haveaddress"][value="No"]';
    
    const addressRadioElement = await this.page.$(addressRadioSelector);
    if (addressRadioElement && await addressRadioElement.isVisible()) {
      await addressRadioElement.click();
      console.log(`   ✅ Answered address question: ${hasAddress ? 'Yes' : 'No'}`);
    }
  }

  /**
   * Answer "Recap Provided?" question
   */
  async answerRecapQuestion(recapProvided) {
    const recapRadioSelector = recapProvided ? 
      'input[name="Recap"][value="Yes"]' : 
      'input[name="Recap"][value="Decline"]';
    
    const recapRadioElement = await this.page.$(recapRadioSelector);
    if (recapRadioElement && await recapRadioElement.isVisible()) {
      await recapRadioElement.click();
      console.log(`   ✅ Answered recap question: ${recapProvided ? 'Yes' : 'Decline'}`);
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
module.exports = { NextButtonDebugger };

// Run test if this file is executed directly
if (require.main === module) {
  async function runNextButtonDebug() {
    const debuggerInstance = new NextButtonDebugger({ headless: false });
    
    try {
      const result = await debuggerInstance.debugNextButton();
      
      console.log('\n📊 Debug Results:');
      console.log('=================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Next button debug failed:', error);
    }
  }
  
  runNextButtonDebug();
}
