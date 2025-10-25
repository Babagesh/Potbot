const { chromium } = require('playwright');

/**
 * Contact Page Button Debugger - Find Available Buttons After Anonymous Selection
 */
class ContactPageButtonDebugger {
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
   * Debug contact page buttons
   */
  async debugContactPageButtons() {
    console.log('🔍 Debugging Contact Page Buttons');
    console.log('==================================');
    
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
      
      // Select anonymous option
      console.log('👤 Selecting anonymous option...');
      await this.selectAnonymousOption();
      
      // Now analyze all available buttons
      console.log('🔍 Analyzing all available buttons...');
      await this.analyzeAllButtons();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Analyze all buttons on the page
   */
  async analyzeAllButtons() {
    console.log(`\n🔘 All Buttons Analysis:`);
    console.log(`========================`);
    
    const allButtons = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      return buttons.map((btn, index) => ({
        index: index + 1,
        tag: btn.tagName,
        text: btn.textContent?.trim() || btn.value || '',
        className: btn.className,
        id: btn.id,
        name: btn.name,
        type: btn.type,
        isVisible: btn.offsetParent !== null,
        isEnabled: !btn.disabled,
        boundingRect: btn.getBoundingClientRect()
      })).filter(btn => btn.text); // Only show buttons with text
    });
    
    console.log(`   Found ${allButtons.length} buttons with text:`);
    allButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}"`);
      console.log(`        Class: ${btn.className}`);
      console.log(`        ID: ${btn.id}`);
      console.log(`        Name: ${btn.name}`);
      console.log(`        Type: ${btn.type}`);
      console.log(`        Visible: ${btn.isVisible}, Enabled: ${btn.isEnabled}`);
      console.log(`        Position: (${btn.boundingRect.x}, ${btn.boundingRect.y})`);
      console.log('');
    });
    
    // Look specifically for anonymous-related buttons
    console.log(`\n🔍 Anonymous-Related Buttons:`);
    console.log(`=============================`);
    
    const anonymousButtons = allButtons.filter(btn => 
      btn.text.toLowerCase().includes('anonymous') ||
      btn.text.toLowerCase().includes('report') ||
      btn.text.toLowerCase().includes('submit') ||
      btn.className.toLowerCase().includes('anonymous') ||
      btn.id.toLowerCase().includes('anonymous')
    );
    
    if (anonymousButtons.length > 0) {
      console.log(`   Found ${anonymousButtons.length} anonymous-related buttons:`);
      anonymousButtons.forEach((btn, i) => {
        console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}"`);
        console.log(`        Class: ${btn.className}`);
        console.log(`        ID: ${btn.id}`);
        console.log(`        Visible: ${btn.isVisible}, Enabled: ${btn.isEnabled}`);
      });
    } else {
      console.log(`   ⚠️ No anonymous-related buttons found`);
    }
    
    // Look for any buttons that might be submit buttons
    console.log(`\n🔍 Submit-Related Buttons:`);
    console.log(`==========================`);
    
    const submitButtons = allButtons.filter(btn => 
      btn.text.toLowerCase().includes('submit') ||
      btn.text.toLowerCase().includes('send') ||
      btn.text.toLowerCase().includes('complete') ||
      btn.text.toLowerCase().includes('finish') ||
      btn.type === 'submit'
    );
    
    if (submitButtons.length > 0) {
      console.log(`   Found ${submitButtons.length} submit-related buttons:`);
      submitButtons.forEach((btn, i) => {
        console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}"`);
        console.log(`        Class: ${btn.className}`);
        console.log(`        ID: ${btn.id}`);
        console.log(`        Visible: ${btn.isVisible}, Enabled: ${btn.isEnabled}`);
      });
    } else {
      console.log(`   ⚠️ No submit-related buttons found`);
    }
  }

  /**
   * Select anonymous option
   */
  async selectAnonymousOption() {
    const anonymousSelected = await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const anonymousRadio = radios.find(radio => {
        const text = radio.nextElementSibling?.textContent?.trim() || '';
        return text.toLowerCase().includes('remain anonymous') || 
               text.toLowerCase().includes('no, i want to remain anonymous');
      });
      
      if (anonymousRadio) {
        anonymousRadio.click();
        console.log(`   ✅ Clicked anonymous radio button`);
        return true;
      }
      
      const contactRadios = radios.filter(radio => 
        radio.name.includes('contact') && radio.value === 'false'
      );
      
      if (contactRadios.length > 0) {
        contactRadios[0].click();
        console.log(`   ✅ Clicked contact radio button (false)`);
        return true;
      }
      
      return false;
    });
    
    if (anonymousSelected) {
      await this.page.waitForTimeout(2000); // Wait for page to update
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
      await descriptionElement.press('Enter'); // Add Enter key press
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
module.exports = { ContactPageButtonDebugger };

// Run test if this file is executed directly
if (require.main === module) {
  async function runContactPageButtonDebug() {
    const debuggerInstance = new ContactPageButtonDebugger({ headless: false });
    
    try {
      const result = await debuggerInstance.debugContactPageButtons();
      
      console.log('\n📊 Debug Results:');
      console.log('=================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Contact page button debug failed:', error);
    }
  }
  
  runContactPageButtonDebug();
}
