const { chromium } = require('playwright');

/**
 * SVG Map Marker Automation - Target the actual map container
 */
class SVGMapMarkerAutomation {
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
   * Test SVG map marker clicking
   */
  async testSVGMapMarkerClicking() {
    console.log('🧪 Testing SVG Map Marker Clicking');
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
      
      // Now focus on the SVG map marker clicking
      console.log('📍 Testing SVG map marker clicking...');
      await this.testSVGMapInteraction();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test SVG map interaction specifically
   */
  async testSVGMapInteraction() {
    const coordinates = '37.755196, -122.423207';
    
    // Step 1: Find and fill the address field
    console.log('   Step 1: Finding address field...');
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Step 2: Enter coordinates
    console.log('   Step 2: Entering coordinates...');
    await addressField.fill(coordinates);
    await this.page.waitForTimeout(1000);
    
    // Step 3: Press Enter to search
    console.log('   Step 3: Pressing Enter to search...');
    await addressField.press('Enter');
    await this.page.waitForTimeout(3000);
    
    // Step 4: Look for the SVG map container
    console.log('   Step 4: Looking for SVG map container...');
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      console.log('   ✅ Found SVG map container');
      
      // Step 5: Look for elements inside the SVG
      console.log('   Step 5: Looking for elements inside SVG...');
      const svgElements = await this.page.evaluate(() => {
        const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
        if (!svg) return [];
        
        const elements = Array.from(svg.querySelectorAll('*'))
          .map(el => ({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            style: el.style.cssText,
            rect: el.getBoundingClientRect()
          }));
        
        return elements;
      });
      
      console.log(`   Found ${svgElements.length} elements inside SVG:`);
      svgElements.slice(0, 10).forEach((el, i) => {
        console.log(`     ${i + 1}. <${el.tag}> class="${el.className}" id="${el.id}"`);
      });
      
      // Step 6: Try clicking on the SVG map itself
      console.log('   Step 6: Trying to click on SVG map...');
      await svgMap.click();
      await this.page.waitForTimeout(2000);
      
      // Check if location field was populated
      const locationFieldValue = await addressField.inputValue();
      console.log(`   📍 Location field value after SVG click: "${locationFieldValue}"`);
      
      if (locationFieldValue && locationFieldValue !== coordinates) {
        console.log('   ✅ Location field was populated successfully!');
        return;
      }
    }
    
    // Step 7: Try clicking at specific coordinates within the SVG
    console.log('   Step 7: Trying to click at specific coordinates within SVG...');
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
      console.log(`   🖱️ Clicking at SVG center: (${svgRect.x}, ${svgRect.y})`);
      await this.page.click('body', { position: { x: svgRect.x, y: svgRect.y } });
      await this.page.waitForTimeout(2000);
      
      // Check if location field was populated
      const locationFieldValue = await addressField.inputValue();
      console.log(`   📍 Location field value after center click: "${locationFieldValue}"`);
      
      if (locationFieldValue && locationFieldValue !== coordinates) {
        console.log('   ✅ Location field was populated successfully!');
        return;
      }
    }
    
    // Step 8: Try clicking at different positions within the SVG
    console.log('   Step 8: Trying different positions within SVG...');
    const positions = [
      { x: svgRect.x - 100, y: svgRect.y - 50 },
      { x: svgRect.x + 100, y: svgRect.y - 50 },
      { x: svgRect.x - 100, y: svgRect.y + 50 },
      { x: svgRect.x + 100, y: svgRect.y + 50 }
    ];
    
    for (const pos of positions) {
      console.log(`   🖱️ Trying position: (${pos.x}, ${pos.y})`);
      await this.page.click('body', { position: pos });
      await this.page.waitForTimeout(1000);
      
      const locationFieldValue = await addressField.inputValue();
      if (locationFieldValue && locationFieldValue !== coordinates) {
        console.log(`   ✅ Success! Location field populated: "${locationFieldValue}"`);
        return;
      }
    }
    
    console.log('   ⚠️ Could not populate location field with any method');
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
module.exports = { SVGMapMarkerAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runSVGTest() {
    const automation = new SVGMapMarkerAutomation({ headless: false });
    
    try {
      const result = await automation.testSVGMapMarkerClicking();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('SVG map marker test failed:', error);
    }
  }
  
  runSVGTest();
}
