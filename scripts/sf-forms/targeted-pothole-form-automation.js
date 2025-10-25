const { chromium } = require('playwright');

/**
 * Targeted Pothole Form Automation - Focus on Map Marker Clicking
 */
class TargetedPotholeFormAutomation {
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
   * Test just the map marker clicking part
   */
  async testMapMarkerClicking() {
    console.log('🧪 Testing Map Marker Clicking');
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
      
      // Now focus on the map marker clicking
      console.log('📍 Testing map marker clicking...');
      await this.testMapMarkerInteraction();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test map marker interaction specifically
   */
  async testMapMarkerInteraction() {
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
    
    // Step 4: Take a screenshot to see what's on the page
    console.log('   Step 4: Taking screenshot...');
    await this.page.screenshot({ path: 'map-after-search.png', fullPage: true });
    console.log('   📸 Screenshot saved as: map-after-search.png');
    
    // Step 5: Look for the blue marker with enhanced detection
    console.log('   Step 5: Looking for blue marker...');
    await this.findAndClickBlueMarker();
    
    // Step 6: Wait and check if location field was populated
    console.log('   Step 6: Checking if location field was populated...');
    await this.page.waitForTimeout(2000);
    
    const locationFieldValue = await addressField.inputValue();
    console.log(`   📍 Location field value: "${locationFieldValue}"`);
    
    if (locationFieldValue && locationFieldValue !== coordinates) {
      console.log('   ✅ Location field was populated successfully!');
    } else {
      console.log('   ⚠️ Location field was not populated');
    }
  }

  /**
   * Find the address field
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
   * Enhanced blue marker detection and clicking
   */
  async findAndClickBlueMarker() {
    // Wait a bit more for the marker to appear
    await this.page.waitForTimeout(2000);
    
    // Look for elements that might be the blue marker
    const markerCandidates = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const isInMapArea = rect.top > 200 && rect.top < 600 && rect.left > 200 && rect.left < 1000;
          const isVisible = el.offsetParent !== null;
          const hasBlueColor = window.getComputedStyle(el).backgroundColor.includes('blue') ||
                              window.getComputedStyle(el).color.includes('blue') ||
                              el.style.backgroundColor?.includes('blue') ||
                              el.style.color?.includes('blue');
          
          return isInMapArea && isVisible && (
            el.tagName === 'DIV' || 
            el.tagName === 'IMG' || 
            el.tagName === 'SVG' ||
            el.tagName === 'CANVAS'
          );
        })
        .map(el => ({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          style: el.style.cssText,
          computedStyle: window.getComputedStyle(el).cssText,
          rect: el.getBoundingClientRect()
        }));
      
      return elements;
    });
    
    console.log(`   Found ${markerCandidates.length} potential marker elements:`);
    markerCandidates.forEach((el, i) => {
      console.log(`     ${i + 1}. <${el.tag}> class="${el.className}" id="${el.id}"`);
    });
    
    // Try clicking the most promising candidates
    for (let i = 0; i < Math.min(markerCandidates.length, 5); i++) {
      const candidate = markerCandidates[i];
      try {
        const selector = candidate.id ? `#${candidate.id}` : 
                        candidate.className ? `.${candidate.className.split(' ')[0]}` : 
                        `${candidate.tag.toLowerCase()}`;
        
        const element = await this.page.$(selector);
        if (element) {
          console.log(`   🖱️ Trying to click: ${selector}`);
          await element.click();
          await this.page.waitForTimeout(1000);
          
          // Check if location field was populated
          const addressField = await this.findAddressField();
          if (addressField) {
            const value = await addressField.inputValue();
            if (value && value !== '37.755196, -122.423207') {
              console.log(`   ✅ Success! Location field populated: "${value}"`);
              return;
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Failed to click ${selector}: ${error.message}`);
      }
    }
    
    // If no specific marker found, try clicking in the center of the map
    console.log('   🔄 No specific marker found, trying center click...');
    await this.page.click('body', { position: { x: 640, y: 360 } });
    await this.page.waitForTimeout(1000);
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
module.exports = { TargetedPotholeFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runTargetedTest() {
    const automation = new TargetedPotholeFormAutomation({ headless: false });
    
    try {
      const result = await automation.testMapMarkerClicking();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Targeted test failed:', error);
    }
  }
  
  runTargetedTest();
}
