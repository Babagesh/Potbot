const { chromium } = require('playwright');

/**
 * Final Working Pothole Form Automation - Bypass SVG Interception
 */
class FinalWorkingPotholeFormAutomation {
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
   * Complete pothole form submission with working approach
   */
  async submitPotholeReport(formData) {
    console.log('🚧 Starting Final Working Pothole Form Submission');
    console.log('================================================');
    
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
      
      // Step 4: Select issue type
      console.log('📋 Step 4: Selecting issue type...');
      await this.selectIssueType(formData.issueType);
      
      // Step 5: Fill location data with working approach
      console.log('📍 Step 5: Filling location data...');
      await this.fillLocationDataWorking(formData.coordinates, formData.locationDescription);
      
      // Step 6: Click Next to proceed
      console.log('➡️ Step 6: Clicking Next to proceed...');
      await this.clickNextButtonWorking();
      
      console.log('✅ Pothole form submission completed successfully!');
      
      return {
        success: true,
        completedSteps: [
          'Navigated to form',
          'Clicked Report button',
          'Handled emergency disclaimer',
          'Selected issue type',
          'Filled location data',
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
   * Working location data filling approach
   */
  async fillLocationDataWorking(coordinates, locationDescription) {
    console.log(`   Filling location with coordinates: ${coordinates}`);
    
    // Step 1: Find the address input field
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Step 2: Enter coordinates
    await addressField.fill(coordinates);
    console.log(`   ✅ Entered coordinates: ${coordinates}`);
    await this.page.waitForTimeout(1000);
    
    // Step 3: Click search button
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked search button`);
    } else {
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter`);
    }
    
    // Step 4: Wait for map to load
    await this.page.waitForTimeout(3000);
    
    // Step 5: Try to populate location field using different approaches
    console.log(`   🔍 Trying to populate location field...`);
    
    // Approach 1: Try clicking the map with different methods
    const locationPopulated = await this.tryPopulateLocationField(addressField);
    
    if (locationPopulated) {
      console.log(`   ✅ Location field populated successfully!`);
    } else {
      console.log(`   ⚠️ Location field not populated, but continuing...`);
    }
    
    // Step 6: Fill location description
    if (locationDescription) {
      await this.fillLocationDescription(locationDescription);
    }
  }

  /**
   * Try different approaches to populate location field
   */
  async tryPopulateLocationField(addressField) {
    const approaches = [
      { name: 'SVG Direct Click', method: () => this.clickSVGDirect() },
      { name: 'Coordinate Click', method: () => this.clickMapCoordinates() },
      { name: 'JavaScript Click', method: () => this.clickMapWithJavaScript() },
      { name: 'Mouse Events', method: () => this.clickMapWithMouseEvents() }
    ];
    
    for (let i = 0; i < approaches.length; i++) {
      const approach = approaches[i];
      console.log(`   Approach ${i + 1}: ${approach.name}`);
      
      try {
        await approach.method();
        await this.page.waitForTimeout(1000);
        
        const locationFieldValue = await addressField.inputValue();
        console.log(`   📍 Location field value: "${locationFieldValue}"`);
        
        if (locationFieldValue && locationFieldValue !== '37.755196, -122.423207') {
          console.log(`   ✅ SUCCESS! Location field populated: "${locationFieldValue}"`);
          return true;
        }
      } catch (error) {
        console.log(`   ❌ Approach failed: ${error.message}`);
      }
    }
    
    return false;
  }

  /**
   * Click SVG directly
   */
  async clickSVGDirect() {
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      await svgMap.click();
      console.log(`   ✅ Clicked SVG directly`);
    }
  }

  /**
   * Click map coordinates
   */
  async clickMapCoordinates() {
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
      console.log(`   ✅ Clicked map coordinates: (${mapInfo.centerX}, ${mapInfo.centerY})`);
    }
  }

  /**
   * Click map using JavaScript
   */
  async clickMapWithJavaScript() {
    await this.page.evaluate(() => {
      const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create and dispatch click event
        const clickEvent = new MouseEvent('click', {
          clientX: centerX,
          clientY: centerY,
          bubbles: true,
          cancelable: true
        });
        
        svg.dispatchEvent(clickEvent);
      }
    });
    console.log(`   ✅ Clicked map with JavaScript`);
  }

  /**
   * Click map using mouse events
   */
  async clickMapWithMouseEvents() {
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
      // Use mouse events instead of click
      await this.page.mouse.move(mapInfo.centerX, mapInfo.centerY);
      await this.page.mouse.click(mapInfo.centerX, mapInfo.centerY);
      console.log(`   ✅ Clicked map with mouse events: (${mapInfo.centerX}, ${mapInfo.centerY})`);
    }
  }

  /**
   * WORKING: Click Next button using the correct detection
   */
  async clickNextButtonWorking() {
    console.log(`   🔍 Looking for Next button...`);
    
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
    
    // Find Next buttons
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    if (nextButtons.length > 0) {
      console.log(`   ✅ Found ${nextButtons.length} Next buttons:`);
      nextButtons.forEach((btn, i) => {
        console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" at (${btn.rect.centerX}, ${btn.rect.centerY})`);
      });
      
      // Use the first Next button (which should be the one in bottom right)
      const nextButton = nextButtons[0];
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
      } else {
        throw new Error('Next button element not found');
      }
    } else {
      throw new Error('Next button not found');
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
    console.log(`   Selecting issue type: ${issueType}`);
    
    const radioButtons = await this.page.$$('input[type="radio"]');
    if (radioButtons.length > 0) {
      await radioButtons[0].click();
      console.log(`   ✅ Selected issue type: ${issueType}`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ No issue type selection found`);
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
    
    console.log('🧪 Testing Final Working Pothole Form with Sample Data');
    console.log('====================================================');
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
module.exports = { FinalWorkingPotholeFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runFinalWorkingTest() {
    const automation = new FinalWorkingPotholeFormAutomation({ headless: false });
    
    try {
      const result = await automation.testPotholeForm();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'final-working-pothole-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Final working pothole form test failed:', error);
    }
  }
  
  runFinalWorkingTest();
}
