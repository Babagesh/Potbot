const { chromium } = require('playwright');

/**
 * Manual Address Entry Automation - Type Address Directly
 */
class ManualAddressEntryAutomation {
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
   * Test manual address entry
   */
  async testManualAddressEntry() {
    console.log('🧪 Testing Manual Address Entry');
    console.log('==============================');
    
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
      
      // Test manual address entry
      console.log('📍 Testing manual address entry...');
      await this.testManualAddressApproaches();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test manual address entry approaches
   */
  async testManualAddressApproaches() {
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    const coordinates = '37.755196, -122.423207';
    const expectedAddress = '3232 22ND ST SAN FRANCISCO, CA 94110';
    
    // Approach 1: Try typing the expected address directly
    console.log(`\n   Approach 1: Type expected address directly`);
    await addressField.fill(expectedAddress);
    console.log(`   ✅ Typed expected address: ${expectedAddress}`);
    await this.page.waitForTimeout(2000);
    
    // Check if Next button becomes visible
    const nextButtonVisible = await this.checkNextButtonVisibility();
    if (nextButtonVisible) {
      console.log(`   ✅ Next button is visible!`);
      return true;
    }
    
    // Approach 2: Try typing coordinates first, then address
    console.log(`\n   Approach 2: Type coordinates then address`);
    await addressField.fill(coordinates);
    console.log(`   ✅ Typed coordinates: ${coordinates}`);
    await this.page.waitForTimeout(1000);
    
    // Click search button
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked search button`);
      await this.page.waitForTimeout(2000);
    }
    
    // Now type the address
    await addressField.fill(expectedAddress);
    console.log(`   ✅ Typed address after search: ${expectedAddress}`);
    await this.page.waitForTimeout(2000);
    
    // Check if Next button becomes visible
    const nextButtonVisible2 = await this.checkNextButtonVisibility();
    if (nextButtonVisible2) {
      console.log(`   ✅ Next button is visible!`);
      return true;
    }
    
    // Approach 3: Try different address formats
    console.log(`\n   Approach 3: Try different address formats`);
    const addressFormats = [
      '3232 22ND ST SAN FRANCISCO, CA 94110',
      '3232 22nd St, San Francisco, CA 94110',
      '3232 22nd Street, San Francisco, CA 94110',
      '3232 22ND STREET SAN FRANCISCO CA 94110',
      '3232 22nd St San Francisco CA 94110'
    ];
    
    for (let i = 0; i < addressFormats.length; i++) {
      const address = addressFormats[i];
      console.log(`   Format ${i + 1}: ${address}`);
      
      await addressField.fill(address);
      await this.page.waitForTimeout(1000);
      
      const nextButtonVisible = await this.checkNextButtonVisibility();
      if (nextButtonVisible) {
        console.log(`   ✅ SUCCESS! Next button is visible with format ${i + 1}!`);
        return true;
      }
    }
    
    console.log(`   ❌ All approaches failed to make Next button visible`);
    return false;
  }

  /**
   * Check if Next button is visible
   */
  async checkNextButtonVisibility() {
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
      console.log(`   📍 Next button found: "${nextButton.text}" at (${nextButton.rect.centerX}, ${nextButton.rect.centerY})`);
      
      // Try to click it
      try {
        const selector = nextButton.tag === 'A' ? 
          `a:has-text("${nextButton.text}")` : 
          nextButton.tag === 'INPUT' ?
          `input[value="${nextButton.text}"]` :
          `button:has-text("${nextButton.text}")`;
        
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          console.log(`   ✅ Successfully clicked Next button!`);
          await this.page.waitForTimeout(3000);
          
          const currentUrl = this.page.url();
          console.log(`   🌐 Current URL: ${currentUrl}`);
          
          return true;
        }
      } catch (error) {
        console.log(`   ⚠️ Could not click Next button: ${error.message}`);
      }
    }
    
    return false;
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
module.exports = { ManualAddressEntryAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runManualAddressTest() {
    const automation = new ManualAddressEntryAutomation({ headless: false });
    
    try {
      const result = await automation.testManualAddressEntry();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Manual address test failed:', error);
    }
  }
  
  runManualAddressTest();
}
