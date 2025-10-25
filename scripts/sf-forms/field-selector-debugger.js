const { chromium } = require('playwright');

/**
 * Field Selector Debugger - Find Correct Selectors for Required Fields
 */
class FieldSelectorDebugger {
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
   * Debug field selectors
   */
  async debugFieldSelectors() {
    console.log('🔍 Debugging Field Selectors');
    console.log('============================');
    
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
      
      // Now debug the specific required fields
      console.log('🔍 Debugging Required Field Selectors...');
      await this.debugRequiredFieldSelectors();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Debug specific required field selectors
   */
  async debugRequiredFieldSelectors() {
    console.log(`\n🔍 Required Field Selector Analysis:`);
    console.log(`===================================`);
    
    // Debug Request type dropdown
    console.log(`\n1. Request Type Dropdown:`);
    console.log(`=======================`);
    await this.debugField('Request type', [
      'select[name="Request_type"]',
      'select[id*="Request_type"]',
      'select[class*="Request_type"]',
      'select:has(option:contains("Collapsed sidewalk"))',
      'select:has(option:contains("Lifted sidewalk"))'
    ]);
    
    // Debug Last Name field
    console.log(`\n2. Last Name Field:`);
    console.log(`==================`);
    await this.debugField('Last Name', [
      'input[name="surname"]',
      'input[id*="surname"]',
      'input[class*="surname"]',
      'input[placeholder*="Last Name"]',
      'input[placeholder*="last name"]'
    ]);
    
    // Debug Email field
    console.log(`\n3. Email Field:`);
    console.log(`===============`);
    await this.debugField('Email', [
      'input[name="txt_individual_email_address_1"]',
      'input[id*="txt_individual_email_address_1"]',
      'input[class*="txt_individual_email_address_1"]',
      'input[placeholder*="email"]',
      'input[type="email"]'
    ]);
    
    // Debug Address question radio buttons
    console.log(`\n4. Address Question Radio Buttons:`);
    console.log(`===================================`);
    await this.debugRadioButtons('rad_haveaddress', [
      'input[name="rad_haveaddress"]',
      'input[id*="rad_haveaddress"]',
      'input[class*="rad_haveaddress"]'
    ]);
    
    // Debug Recap question radio buttons
    console.log(`\n5. Recap Question Radio Buttons:`);
    console.log(`=================================`);
    await this.debugRadioButtons('Recap', [
      'input[name="Recap"]',
      'input[id*="Recap"]',
      'input[class*="Recap"]'
    ]);
  }

  /**
   * Debug a specific field
   */
  async debugField(fieldName, selectors) {
    console.log(`   Debugging ${fieldName} field...`);
    
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          const tagName = await element.evaluate(el => el.tagName);
          const actualName = await element.evaluate(el => el.name);
          const actualId = await element.evaluate(el => el.id);
          const actualClass = await element.evaluate(el => el.className);
          const actualPlaceholder = await element.evaluate(el => el.placeholder);
          
          console.log(`   ✅ Found with selector: ${selector}`);
          console.log(`      Tag: ${tagName}`);
          console.log(`      Name: ${actualName}`);
          console.log(`      ID: ${actualId}`);
          console.log(`      Class: ${actualClass}`);
          console.log(`      Placeholder: ${actualPlaceholder}`);
          console.log(`      Visible: ${isVisible}`);
          console.log(`      Enabled: ${isEnabled}`);
          
          // Try to interact with the field
          if (isVisible && isEnabled) {
            if (tagName === 'SELECT') {
              const options = await element.evaluate(el => {
                return Array.from(el.options).map(option => ({
                  value: option.value,
                  text: option.textContent?.trim()
                }));
              });
              console.log(`      Options: ${options.length} items`);
              options.slice(0, 3).forEach((option, i) => {
                console.log(`        ${i + 1}. "${option.text}" (value: "${option.value}")`);
              });
            } else if (tagName === 'INPUT') {
              const inputType = await element.evaluate(el => el.type);
              console.log(`      Input type: ${inputType}`);
            }
          }
          
          return true;
        }
      } catch (error) {
        console.log(`   ❌ Error with selector ${selector}: ${error.message}`);
      }
    }
    
    console.log(`   ⚠️ No valid selector found for ${fieldName}`);
    return false;
  }

  /**
   * Debug radio button groups
   */
  async debugRadioButtons(groupName, selectors) {
    console.log(`   Debugging ${groupName} radio buttons...`);
    
    for (const selector of selectors) {
      try {
        const elements = await this.page.$$(selector);
        if (elements.length > 0) {
          console.log(`   ✅ Found ${elements.length} radio buttons with selector: ${selector}`);
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            const value = await element.evaluate(el => el.value);
            const checked = await element.evaluate(el => el.checked);
            const actualName = await element.evaluate(el => el.name);
            const actualId = await element.evaluate(el => el.id);
            
            console.log(`      Radio ${i + 1}:`);
            console.log(`        Name: ${actualName}`);
            console.log(`        ID: ${actualId}`);
            console.log(`        Value: ${value}`);
            console.log(`        Checked: ${checked}`);
            console.log(`        Visible: ${isVisible}`);
            console.log(`        Enabled: ${isEnabled}`);
          }
          
          return true;
        }
      } catch (error) {
        console.log(`   ❌ Error with selector ${selector}: ${error.message}`);
      }
    }
    
    console.log(`   ⚠️ No valid selector found for ${groupName}`);
    return false;
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
module.exports = { FieldSelectorDebugger };

// Run test if this file is executed directly
if (require.main === module) {
  async function runFieldSelectorDebug() {
    const debuggerInstance = new FieldSelectorDebugger({ headless: false });
    
    try {
      const result = await debuggerInstance.debugFieldSelectors();
      
      console.log('\n📊 Debug Results:');
      console.log('=================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Field selector debug failed:', error);
    }
  }
  
  runFieldSelectorDebug();
}
