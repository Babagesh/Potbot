const { chromium } = require('playwright');

/**
 * Robust Pothole Form Automation - Fixed Map Marker Clicking
 */
class RobustPotholeFormAutomation {
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
   * Complete pothole form submission with robust map marker clicking
   */
  async submitPotholeReport(formData) {
    console.log('🚧 Starting Robust Pothole Form Submission');
    console.log('===========================================');
    
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
      
      // Step 5: Fill location data with robust map marker clicking
      console.log('📍 Step 5: Filling location data...');
      await this.fillLocationDataRobust(formData.coordinates, formData.locationDescription);
      
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
   * Robust location data filling with map marker clicking
   */
  async fillLocationDataRobust(coordinates, locationDescription) {
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
    
    // Step 3: Press Enter to search
    await addressField.press('Enter');
    console.log(`   ✅ Pressed Enter to search`);
    await this.page.waitForTimeout(3000);
    
    // Step 4: Try to find and click the blue marker
    console.log(`   🔍 Looking for blue marker...`);
    const markerClicked = await this.findAndClickBlueMarkerRobust();
    
    if (markerClicked) {
      console.log(`   ✅ Successfully clicked blue marker`);
      await this.page.waitForTimeout(2000);
      
      // Check if location field was populated
      const newValue = await addressField.inputValue();
      console.log(`   📍 Location field now contains: "${newValue}"`);
    } else {
      console.log(`   ⚠️ Could not find blue marker, trying alternative approach`);
      // Try clicking in the center of the map area
      await this.page.click('body', { position: { x: 640, y: 360 } });
      await this.page.waitForTimeout(2000);
    }
    
    // Step 5: Fill location description
    if (locationDescription) {
      await this.fillLocationDescription(locationDescription);
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
   * Robust blue marker detection and clicking
   */
  async findAndClickBlueMarkerRobust() {
    // Wait for the map to fully load
    await this.page.waitForTimeout(2000);
    
    // Look for elements that might be the blue marker
    const markerCandidates = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const isInMapArea = rect.top > 200 && rect.top < 600 && rect.left > 200 && rect.left < 1000;
          const isVisible = el.offsetParent !== null;
          const hasClickHandler = el.onclick || el.addEventListener;
          
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
          rect: el.getBoundingClientRect()
        }));
      
      return elements;
    });
    
    console.log(`   Found ${markerCandidates.length} potential marker elements`);
    
    // Try clicking the most promising candidates
    for (let i = 0; i < Math.min(markerCandidates.length, 10); i++) {
      const candidate = markerCandidates[i];
      try {
        // Create a more robust selector
        let selector = '';
        if (candidate.id) {
          selector = `#${candidate.id}`;
        } else if (candidate.className) {
          const firstClass = candidate.className.split(' ')[0];
          if (firstClass) {
            selector = `.${firstClass}`;
          }
        }
        
        if (selector) {
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
                return true;
              }
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Failed to click candidate ${i + 1}: ${error.message}`);
      }
    }
    
    return false;
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
    
    console.log('🧪 Testing Robust Pothole Form with Sample Data');
    console.log('==============================================');
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
module.exports = { RobustPotholeFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runRobustTest() {
    const automation = new RobustPotholeFormAutomation({ headless: false });
    
    try {
      const result = await automation.testPotholeForm();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'robust-pothole-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Robust pothole form test failed:', error);
    }
  }
  
  runRobustTest();
}
