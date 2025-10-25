const { chromium } = require('playwright');

/**
 * Final Pothole Form Automation - With Location Field Population
 */
class FinalPotholeFormAutomation {
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
   * Test location field population with different approaches
   */
  async testLocationFieldPopulation() {
    console.log('🧪 Testing Location Field Population');
    console.log('===================================');
    
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
      
      // Test different approaches to populate location field
      console.log('📍 Testing location field population...');
      await this.testLocationFieldApproaches();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test different approaches to populate location field
   */
  async testLocationFieldApproaches() {
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Test different coordinate formats
    const coordinateFormats = [
      '37.755196, -122.423207',
      '37.755196,-122.423207',
      '37.755196 -122.423207',
      '37.755196 -122.423207',
      '37.755196, -122.423207',
      '37.755196, -122.423207'
    ];
    
    for (let i = 0; i < coordinateFormats.length; i++) {
      const coords = coordinateFormats[i];
      console.log(`\n   Approach ${i + 1}: Testing coordinates "${coords}"`);
      
      // Clear the field
      await addressField.fill('');
      await this.page.waitForTimeout(500);
      
      // Enter coordinates
      await addressField.fill(coords);
      console.log(`   ✅ Entered coordinates: ${coords}`);
      await this.page.waitForTimeout(1000);
      
      // Press Enter
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter`);
      await this.page.waitForTimeout(3000);
      
      // Check if location field was populated
      const locationFieldValue = await addressField.inputValue();
      console.log(`   📍 Location field value: "${locationFieldValue}"`);
      
      if (locationFieldValue && locationFieldValue !== coords) {
        console.log(`   ✅ SUCCESS! Location field populated: "${locationFieldValue}"`);
        
        // Try to click Next button
        const nextButton = await this.findNextButton();
        if (nextButton) {
          console.log(`   🖱️ Found Next button, attempting to click...`);
          try {
            await nextButton.click();
            console.log(`   ✅ Successfully clicked Next button!`);
            await this.page.waitForTimeout(3000);
            
            // Check if we moved to the next page
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
        
        // Try clicking on the map
        const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
        if (svgMap) {
          console.log(`   🖱️ Trying to click on map...`);
          await svgMap.click();
          await this.page.waitForTimeout(2000);
          
          const newValue = await addressField.inputValue();
          console.log(`   📍 Location field value after map click: "${newValue}"`);
          
          if (newValue && newValue !== coords) {
            console.log(`   ✅ SUCCESS! Location field populated after map click: "${newValue}"`);
            return true;
          }
        }
      }
    }
    
    console.log(`   ❌ All approaches failed to populate location field`);
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
module.exports = { FinalPotholeFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runFinalTest() {
    const automation = new FinalPotholeFormAutomation({ headless: false });
    
    try {
      const result = await automation.testLocationFieldPopulation();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Final test failed:', error);
    }
  }
  
  runFinalTest();
}
