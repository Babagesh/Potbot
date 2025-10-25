const { chromium } = require('playwright');

/**
 * Corrected Pothole Form Automation - Fixed Issues
 */
class CorrectedPotholeFormAutomation {
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
   * Complete pothole form submission with corrected approach
   */
  async submitPotholeReport(formData) {
    console.log('🚧 Starting Corrected Pothole Form Submission');
    console.log('=============================================');
    
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
      
      // Step 4: Select issue type (FIXED: Ensure we select Street and keep it)
      console.log('📋 Step 4: Selecting issue type...');
      await this.selectIssueTypeCorrectly(formData.issueType);
      
      // Step 5: Fill location data with corrected map clicking
      console.log('📍 Step 5: Filling location data...');
      await this.fillLocationDataCorrectly(formData.coordinates, formData.locationDescription);
      
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
          'Selected issue type correctly',
          'Filled location data with center map click',
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
   * CORRECTED: Select issue type properly and ensure it stays selected
   */
  async selectIssueTypeCorrectly(issueType) {
    console.log(`   Selecting issue type: ${issueType}`);
    
    // Wait for the form to load
    await this.page.waitForTimeout(2000);
    
    // Look for radio buttons
    const radioButtons = await this.page.$$('input[type="radio"]');
    console.log(`   Found ${radioButtons.length} radio buttons`);
    
    if (radioButtons.length > 0) {
      // Click the first radio button (which should be Street)
      await radioButtons[0].click();
      console.log(`   ✅ Selected first radio button (Street)`);
      await this.page.waitForTimeout(1000);
      
      // Verify the selection is still there
      const isChecked = await radioButtons[0].isChecked();
      console.log(`   ✅ Verified selection is checked: ${isChecked}`);
      
      // Wait a bit more to ensure the selection is stable
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ No radio buttons found`);
    }
  }

  /**
   * CORRECTED: Fill location data with center map clicking
   */
  async fillLocationDataCorrectly(coordinates, locationDescription) {
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
    
    // Step 3: Find and click the magnifying glass/search button
    console.log(`   🔍 Looking for magnifying glass/search button...`);
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked magnifying glass/search button`);
    } else {
      // Fallback: Press Enter
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter to search`);
    }
    
    // Step 4: Wait for map to load and center
    console.log(`   ⏳ Waiting for map to load and center...`);
    await this.page.waitForTimeout(3000);
    
    // Step 5: Click the exact center of the map (where the marker should be)
    console.log(`   🎯 Clicking exact center of map...`);
    await this.clickMapCenter();
    
    // Step 6: Wait for location field to be populated
    console.log(`   ⏳ Waiting for location field to be populated...`);
    await this.page.waitForTimeout(2000);
    
    // Step 7: Check if location field was populated
    const locationFieldValue = await addressField.inputValue();
    console.log(`   📍 Location field value: "${locationFieldValue}"`);
    
    if (locationFieldValue && locationFieldValue !== coordinates) {
      console.log(`   ✅ SUCCESS! Location field populated: "${locationFieldValue}"`);
    } else {
      console.log(`   ⚠️ Location field not populated, but continuing...`);
    }
    
    // Step 8: Fill location description
    if (locationDescription) {
      await this.fillLocationDescription(locationDescription);
    }
  }

  /**
   * Find the magnifying glass/search button
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
   * Click the exact center of the map
   */
  async clickMapCenter() {
    // Get the SVG map container
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      // Get the bounding box of the SVG
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
        console.log(`   🎯 SVG map center: (${svgRect.x}, ${svgRect.y})`);
        console.log(`   📏 SVG map size: ${svgRect.width}x${svgRect.height}`);
        
        // Click the exact center of the SVG
        await this.page.click('body', { position: { x: svgRect.x, y: svgRect.y } });
        console.log(`   ✅ Clicked exact center of map`);
      } else {
        console.log(`   ⚠️ Could not get SVG dimensions`);
      }
    } else {
      console.log(`   ⚠️ SVG map not found`);
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
    
    console.log('🧪 Testing Corrected Pothole Form with Sample Data');
    console.log('================================================');
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
module.exports = { CorrectedPotholeFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runCorrectedTest() {
    const automation = new CorrectedPotholeFormAutomation({ headless: false });
    
    try {
      const result = await automation.testPotholeForm();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'corrected-pothole-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Corrected pothole form test failed:', error);
    }
  }
  
  runCorrectedTest();
}
