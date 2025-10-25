const { chromium } = require('playwright');

/**
 * Persistent Map Clicking Automation - Try multiple approaches
 */
class PersistentMapClickingAutomation {
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
   * Test persistent map clicking approaches
   */
  async testPersistentMapClicking() {
    console.log('🧪 Testing Persistent Map Clicking');
    console.log('==================================');
    
    try {
      await this.init();
      
      // Navigate to the form
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
      
      // Test persistent map clicking
      console.log('📍 Testing persistent map clicking...');
      await this.testPersistentMapApproaches();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test multiple persistent approaches to populate location field
   */
  async testPersistentMapApproaches() {
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    const coordinates = '37.755196, -122.423207';
    
    // Step 1: Enter coordinates
    console.log(`   Step 1: Entering coordinates: ${coordinates}`);
    await addressField.fill(coordinates);
    await this.page.waitForTimeout(1000);
    
    // Step 2: Click search button
    console.log(`   Step 2: Clicking search button...`);
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked search button`);
    } else {
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter`);
    }
    
    // Step 3: Wait for map to load
    console.log(`   Step 3: Waiting for map to load...`);
    await this.page.waitForTimeout(3000);
    
    // Step 4: Try multiple clicking approaches
    const approaches = [
      { name: 'Center Click', method: () => this.clickMapCenter() },
      { name: 'Multiple Center Clicks', method: () => this.clickMapCenterMultiple() },
      { name: 'Different Positions', method: () => this.clickMapPositions() },
      { name: 'Wait and Click', method: () => this.waitAndClickMap() }
    ];
    
    for (let i = 0; i < approaches.length; i++) {
      const approach = approaches[i];
      console.log(`\n   Approach ${i + 1}: ${approach.name}`);
      
      try {
        await approach.method();
        await this.page.waitForTimeout(2000);
        
        const locationFieldValue = await addressField.inputValue();
        console.log(`   📍 Location field value: "${locationFieldValue}"`);
        
        if (locationFieldValue && locationFieldValue !== coordinates) {
          console.log(`   ✅ SUCCESS! Location field populated: "${locationFieldValue}"`);
          
          // Try to find Next button
          const nextButton = await this.findNextButton();
          if (nextButton) {
            console.log(`   🖱️ Found Next button, attempting to click...`);
            try {
              await nextButton.click();
              console.log(`   ✅ Successfully clicked Next button!`);
              await this.page.waitForTimeout(3000);
              
              const currentUrl = this.page.url();
              console.log(`   🌐 Current URL: ${currentUrl}`);
              
              return true;
            } catch (error) {
              console.log(`   ⚠️ Could not click Next button: ${error.message}`);
            }
          } else {
            console.log(`   ⚠️ Next button not found`);
          }
          
          return true;
        } else {
          console.log(`   ⚠️ Location field not populated`);
        }
      } catch (error) {
        console.log(`   ❌ Approach failed: ${error.message}`);
      }
    }
    
    console.log(`   ❌ All approaches failed to populate location field`);
    return false;
  }

  /**
   * Click map center once
   */
  async clickMapCenter() {
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      const svgRect = await this.page.evaluate(() => {
        const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      });
      
      if (svgRect) {
        console.log(`   🎯 Clicking map center: (${svgRect.x}, ${svgRect.y})`);
        await this.page.click('body', { position: { x: svgRect.x, y: svgRect.y } });
        console.log(`   ✅ Clicked map center`);
      }
    }
  }

  /**
   * Click map center multiple times
   */
  async clickMapCenterMultiple() {
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      const svgRect = await this.page.evaluate(() => {
        const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      });
      
      if (svgRect) {
        console.log(`   🎯 Clicking map center multiple times...`);
        for (let i = 0; i < 3; i++) {
          await this.page.click('body', { position: { x: svgRect.x, y: svgRect.y } });
          await this.page.waitForTimeout(500);
          console.log(`   ✅ Click ${i + 1}/3`);
        }
      }
    }
  }

  /**
   * Click different positions on the map
   */
  async clickMapPositions() {
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      const svgRect = await this.page.evaluate(() => {
        const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height
        };
      });
      
      if (svgRect) {
        const positions = [
          { x: svgRect.x, y: svgRect.y, name: 'Center' },
          { x: svgRect.x - 50, y: svgRect.y, name: 'Left of Center' },
          { x: svgRect.x + 50, y: svgRect.y, name: 'Right of Center' },
          { x: svgRect.x, y: svgRect.y - 50, name: 'Above Center' },
          { x: svgRect.x, y: svgRect.y + 50, name: 'Below Center' }
        ];
        
        console.log(`   🎯 Clicking different positions...`);
        for (const pos of positions) {
          console.log(`   🖱️ Clicking ${pos.name}: (${pos.x}, ${pos.y})`);
          await this.page.click('body', { position: { x: pos.x, y: pos.y } });
          await this.page.waitForTimeout(500);
        }
      }
    }
  }

  /**
   * Wait longer and then click map
   */
  async waitAndClickMap() {
    console.log(`   ⏳ Waiting 5 seconds for map to fully load...`);
    await this.page.waitForTimeout(5000);
    
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      const svgRect = await this.page.evaluate(() => {
        const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      });
      
      if (svgRect) {
        console.log(`   🎯 Clicking map center after wait: (${svgRect.x}, ${svgRect.y})`);
        await this.page.click('body', { position: { x: svgRect.x, y: svgRect.y } });
        console.log(`   ✅ Clicked map center after wait`);
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
          console.log(`   ✅ Found address field: ${selector}`);
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
          console.log(`   ✅ Found search button: ${selector}`);
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
   * Select issue type
   */
  async selectIssueType(issueType) {
    const radioButtons = await this.page.$$('input[type="radio"]');
    if (radioButtons.length > 0) {
      await radioButtons[0].click();
      console.log(`   ✅ Selected issue type: ${issueType}`);
      await this.page.waitForTimeout(1000);
    }
  }
}

// Export the class
module.exports = { PersistentMapClickingAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runPersistentTest() {
    const automation = new PersistentMapClickingAutomation({ headless: false });
    
    try {
      const result = await automation.testPersistentMapClicking();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Persistent test failed:', error);
    }
  }
  
  runPersistentTest();
}
