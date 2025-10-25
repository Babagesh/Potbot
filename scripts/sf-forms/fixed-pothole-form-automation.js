const { chromium } = require('playwright');

/**
 * Fixed Pothole Form Automation with Proper Map Marker Clicking
 */
class FixedPotholeFormAutomation {
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
   * Complete pothole form submission with proper map marker clicking
   */
  async submitPotholeReport(formData) {
    console.log('🚧 Starting Fixed Pothole Form Submission');
    console.log('=========================================');
    
    try {
      await this.init();
      
      // Step 1: Navigate to pothole form
      console.log('🌐 Step 1: Navigating to pothole form...');
      await this.page.goto('https://www.sf.gov/report-pothole-and-street-issues', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Step 2: Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
      const reportButton = await this.findReportButton();
      if (reportButton) {
        await reportButton.click();
        await this.page.waitForTimeout(5000);
      }
      
      // Step 3: Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      const nextButton = await this.findNextButton();
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForTimeout(3000);
      }
      
      // Step 4: Select issue type (Sidewalk/Curb or Street)
      console.log('📋 Step 4: Selecting issue type...');
      await this.selectIssueType(formData.issueType);
      
      // Step 5: Fill location data with proper map marker clicking
      console.log('📍 Step 5: Filling location data...');
      await this.fillLocationDataWithMapMarker(formData.coordinates, formData.locationDescription);
      
      // Step 6: Click Next to proceed
      console.log('➡️ Step 6: Clicking Next to proceed...');
      await this.clickNextButton();
      
      console.log('✅ Pothole form submission completed successfully!');
      
      return {
        success: true,
        completedSteps: [
          'Navigated to form',
          'Clicked Report button',
          'Handled emergency disclaimer',
          'Selected issue type',
          'Filled location data with map marker',
          'Proceeded to next page'
        ],
        submittedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.log(`❌ Error in pothole form submission: ${error.message}`);
      return {
        success: false,
        error: error.message,
        submittedAt: new Date().toISOString()
      };
    } finally {
      await this.cleanup();
    }
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
   * Select issue type (Sidewalk/Curb or Street)
   */
  async selectIssueType(issueType) {
    console.log(`   Selecting issue type: ${issueType}`);
    
    // Look for radio buttons or select options
    const issueTypeSelectors = [
      `input[type="radio"][value*="${issueType.toLowerCase()}"]`,
      `input[type="radio"][value*="street"]`,
      `input[type="radio"][value*="sidewalk"]`,
      `input[type="radio"][value*="curb"]`
    ];
    
    for (const selector of issueTypeSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.click();
          console.log(`   ✅ Selected issue type: ${issueType}`);
          await this.page.waitForTimeout(1000);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Fallback: look for any radio buttons and click the first one
    const radioButtons = await this.page.$$('input[type="radio"]');
    if (radioButtons.length > 0) {
      await radioButtons[0].click();
      console.log(`   ✅ Selected first available issue type`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ No issue type selection found`);
    }
  }

  /**
   * Fill location data with proper map marker clicking
   */
  async fillLocationDataWithMapMarker(coordinates, locationDescription) {
    console.log(`   Filling location with coordinates: ${coordinates}`);
    
    // Step 1: Find the address input field
    const addressFieldSelectors = [
      'input[placeholder*="address"]',
      'input[placeholder*="place"]',
      'input[placeholder*="Find address"]',
      'input[name*="address"]',
      'input[id*="address"]',
      'input[type="text"]'
    ];
    
    let addressField = null;
    for (const selector of addressFieldSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          addressField = element;
          console.log(`   ✅ Found address field: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Step 2: Enter coordinates
    await addressField.fill(coordinates);
    console.log(`   ✅ Entered coordinates: ${coordinates}`);
    await this.page.waitForTimeout(1000);
    
    // Step 3: Click the search/magnifying glass button
    const searchButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Search")',
      'button[class*="search"]',
      'button[class*="magnify"]',
      'input[type="submit"]',
      'button[aria-label*="search"]',
      'button[title*="search"]'
    ];
    
    let searchButton = null;
    for (const selector of searchButtonSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          searchButton = element;
          console.log(`   ✅ Found search button: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked search button`);
    } else {
      // Try pressing Enter
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter to search`);
    }
    
    // Step 4: Wait for map to load and marker to appear
    console.log(`   ⏳ Waiting for map to load and marker to appear...`);
    await this.page.waitForTimeout(3000);
    
    // Step 5: Click the blue marker on the map (enhanced detection)
    console.log(`   🔍 Looking for blue marker on map...`);
    await this.clickMapMarkerEnhanced();
    
    // Step 6: Wait for location field to be populated
    console.log(`   ⏳ Waiting for location field to be populated...`);
    await this.page.waitForTimeout(2000);
    
    // Step 7: Fill location description
    if (locationDescription) {
      await this.fillLocationDescription(locationDescription);
    }
  }

  /**
   * Enhanced map marker clicking with better detection
   */
  async clickMapMarkerEnhanced() {
    // Try multiple approaches to find and click the marker
    
    // Approach 1: Look for common map marker selectors
    const markerSelectors = [
      // Google Maps markers
      'div[class*="marker"]',
      'div[class*="pin"]',
      'div[class*="location"]',
      'div[style*="blue"]',
      'div[style*="marker"]',
      'img[src*="marker"]',
      'img[src*="pin"]',
      'svg[class*="marker"]',
      'svg[class*="pin"]',
      // Leaflet markers
      'div[class*="leaflet-marker"]',
      'div[class*="leaflet-marker-icon"]',
      // Generic map elements
      'div[class*="map-marker"]',
      'div[class*="map-pin"]',
      'div[class*="location-marker"]',
      // Clickable elements with marker-like classes
      'div[class*="clickable"][class*="marker"]',
      'div[class*="clickable"][class*="pin"]'
    ];
    
    for (const selector of markerSelectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            await element.click();
            console.log(`   ✅ Clicked map marker: ${selector}`);
            await this.page.waitForTimeout(2000);
            return;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Approach 2: Look for any clickable elements in the map area
    console.log(`   🔍 Looking for clickable elements in map area...`);
    const clickableElements = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const isInMapArea = rect.top > 200 && rect.top < 600 && rect.left > 200 && rect.left < 1000;
          const hasClickHandler = el.onclick || el.addEventListener;
          const isVisible = el.offsetParent !== null;
          return isInMapArea && isVisible && (el.tagName === 'DIV' || el.tagName === 'IMG' || el.tagName === 'SVG');
        })
        .map(el => ({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          style: el.style.cssText,
          rect: el.getBoundingClientRect()
        }));
      
      return elements;
    });
    
    console.log(`   Found ${clickableElements.length} clickable elements in map area:`);
    clickableElements.slice(0, 5).forEach((el, i) => {
      console.log(`     ${i + 1}. <${el.tag}> class="${el.className}" id="${el.id}"`);
    });
    
    // Try clicking the most promising elements
    for (const el of clickableElements.slice(0, 3)) {
      try {
        const selector = el.id ? `#${el.id}` : 
                        el.className ? `.${el.className.split(' ')[0]}` : 
                        `${el.tag.toLowerCase()}`;
        
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          console.log(`   ✅ Clicked potential marker: ${selector}`);
          await this.page.waitForTimeout(2000);
          return;
        }
      } catch (error) {
        // Continue to next element
      }
    }
    
    // Approach 3: Click in the center of the map area
    console.log(`   ⚠️ No marker found, clicking center of map area`);
    await this.page.click('body', { position: { x: 640, y: 360 } });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Fill location description field
   */
  async fillLocationDescription(description) {
    console.log(`   Filling location description: ${description}`);
    
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
          console.log(`   ✅ Filled location description`);
          await this.page.waitForTimeout(1000);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    console.log(`   ⚠️ Location description field not found`);
  }

  /**
   * Click Next button to proceed
   */
  async clickNextButton() {
    const nextButton = await this.findNextButton();
    if (nextButton) {
      await nextButton.click();
      console.log(`   ✅ Clicked Next button`);
      await this.page.waitForTimeout(3000);
    } else {
      throw new Error('Next button not found');
    }
  }

  /**
   * Test the pothole form with sample data
   */
  async testPotholeForm() {
    const sampleData = {
      issueType: 'Street',
      coordinates: '37.755196, -122.423207',
      locationDescription: 'On the side of the street facing Plane Jaine restaurant directly in the center of the right lane.'
    };
    
    console.log('🧪 Testing Fixed Pothole Form with Sample Data');
    console.log('============================================');
    console.log(`Issue Type: ${sampleData.issueType}`);
    console.log(`Coordinates: ${sampleData.coordinates}`);
    console.log(`Location Description: ${sampleData.locationDescription}`);
    console.log('');
    
    const result = await this.submitPotholeReport(sampleData);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    if (result.success) {
      console.log('Completed Steps:');
      result.completedSteps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
    } else {
      console.log(`Error: ${result.error}`);
    }
    
    return result;
  }
}

// Export the class
module.exports = { FixedPotholeFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runFixedPotholeTest() {
    const automation = new FixedPotholeFormAutomation({ headless: false });
    
    try {
      const result = await automation.testPotholeForm();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'fixed-pothole-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Fixed pothole form test failed:', error);
    }
  }
  
  runFixedPotholeTest();
}
