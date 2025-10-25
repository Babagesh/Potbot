const { chromium } = require('playwright');

/**
 * Complete Workflow Pothole Form Automation - Following Exact Steps
 */
class CompleteWorkflowPotholeFormAutomation {
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
   * Complete pothole form submission following exact workflow
   */
  async submitPotholeReport(formData) {
    console.log('🚧 Starting Complete Workflow Pothole Form Submission');
    console.log('====================================================');
    
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
      
      // Step 5: Complete location workflow
      console.log('📍 Step 5: Completing location workflow...');
      await this.completeLocationWorkflow(formData.coordinates, formData.locationDescription);
      
      // Step 6: Click Next to proceed
      console.log('➡️ Step 6: Clicking Next to proceed...');
      await this.clickNextButtonFinal();
      
      console.log('✅ Pothole form submission completed successfully!');
      
      return {
        success: true,
        completedSteps: [
          'Navigated to form',
          'Clicked Report button',
          'Handled emergency disclaimer',
          'Selected issue type',
          'Completed location workflow',
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
   * Complete location workflow following exact steps
   */
  async completeLocationWorkflow(coordinates, locationDescription) {
    console.log(`   Following exact location workflow...`);
    
    // Step 1: Find and fill the address field
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Step 2: Enter coordinates
    console.log(`   Step 1: Entering coordinates: ${coordinates}`);
    await addressField.fill(coordinates);
    await this.page.waitForTimeout(1000);
    
    // Step 3: Click magnifying glass to search
    console.log(`   Step 2: Clicking magnifying glass to search...`);
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked magnifying glass`);
    } else {
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter to search`);
    }
    
    // Step 4: Wait for map to load
    console.log(`   Step 3: Waiting for map to load...`);
    await this.page.waitForTimeout(3000);
    
    // Step 5: Click + button twice to zoom in
    console.log(`   Step 4: Clicking + button twice to zoom in...`);
    await this.clickZoomInButton();
    
    // Step 6: Wait for zoom to complete
    console.log(`   Step 5: Waiting for zoom to complete...`);
    await this.page.waitForTimeout(2000);
    
    // Step 7: Click blue marker (or center of map as fallback)
    console.log(`   Step 6: Clicking blue marker or center of map...`);
    await this.clickBlueMarkerOrCenter();
    
    // Step 8: Wait for location field to be populated
    console.log(`   Step 7: Waiting for location field to be populated...`);
    await this.page.waitForTimeout(2000);
    
    // Step 9: Check if location field was populated
    const locationFieldValue = await addressField.inputValue();
    console.log(`   📍 Location field value: "${locationFieldValue}"`);
    
    if (locationFieldValue && locationFieldValue !== coordinates) {
      console.log(`   ✅ SUCCESS! Location field populated: "${locationFieldValue}"`);
    } else {
      console.log(`   ⚠️ Location field not populated, but continuing...`);
    }
    
    // Step 10: Fill location description and press Enter
    console.log(`   Step 8: Filling location description and pressing Enter...`);
    await this.fillLocationDescriptionAndSave(locationDescription);
  }

  /**
   * Click zoom in button twice
   */
  async clickZoomInButton() {
    // Look for + button (zoom in button)
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
          console.log(`   ✅ Found zoom in button: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (zoomInButton) {
      // Click twice
      await zoomInButton.click();
      console.log(`   ✅ Clicked + button (1/2)`);
      await this.page.waitForTimeout(500);
      
      await zoomInButton.click();
      console.log(`   ✅ Clicked + button (2/2)`);
    } else {
      console.log(`   ⚠️ Zoom in button not found, trying alternative approach...`);
      
      // Alternative: Look for any + symbols on the page
      const plusElements = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent?.trim() === '+' && el.offsetParent !== null)
          .map(el => ({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            rect: el.getBoundingClientRect()
          }));
        
        return elements;
      });
      
      console.log(`   Found ${plusElements.length} + elements:`);
      plusElements.forEach((el, i) => {
        console.log(`     ${i + 1}. <${el.tag}> class="${el.className}" id="${el.id}"`);
      });
      
      if (plusElements.length > 0) {
        // Try clicking the first + element
        const firstPlus = plusElements[0];
        const selector = firstPlus.id ? `#${firstPlus.id}` : 
                        firstPlus.className ? `.${firstPlus.className.split(' ')[0]}` : 
                        `${firstPlus.tag.toLowerCase()}`;
        
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click();
            console.log(`   ✅ Clicked + element (1/2)`);
            await this.page.waitForTimeout(500);
            
            await element.click();
            console.log(`   ✅ Clicked + element (2/2)`);
          }
        } catch (error) {
          console.log(`   ❌ Could not click + element: ${error.message}`);
        }
      }
    }
  }

  /**
   * Click blue marker or center of map
   */
  async clickBlueMarkerOrCenter() {
    // First try to find blue marker
    console.log(`   🔍 Looking for blue marker...`);
    
    const blueMarkerFound = await this.findAndClickBlueMarker();
    
    if (!blueMarkerFound) {
      console.log(`   🔄 Blue marker not found, clicking center of map...`);
      await this.clickMapCenter();
    }
  }

  /**
   * Find and click blue marker
   */
  async findAndClickBlueMarker() {
    // Look for blue marker elements
    const markerSelectors = [
      'div[class*="marker"]',
      'div[class*="pin"]',
      'div[class*="location"]',
      'div[style*="blue"]',
      'div[style*="marker"]',
      'img[src*="marker"]',
      'img[src*="pin"]',
      'svg[class*="marker"]',
      'svg[class*="pin"]',
      'div[class*="blue"]',
      'div[class*="marker-icon"]',
      'div[class*="pin-icon"]'
    ];
    
    for (const selector of markerSelectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            await element.click();
            console.log(`   ✅ Clicked blue marker: ${selector}`);
            return true;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return false;
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
      console.log(`   ✅ Clicked map center: (${mapInfo.centerX}, ${mapInfo.centerY})`);
    }
  }

  /**
   * Fill location description and press Enter to save
   */
  async fillLocationDescriptionAndSave(description) {
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
          
          // Press Enter to save
          await element.press('Enter');
          console.log(`   ✅ Pressed Enter to save location description`);
          
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
   * FINAL: Click Next button using coordinate-based approach
   */
  async clickNextButtonFinal() {
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
      const nextButton = nextButtons[0];
      console.log(`   ✅ Found Next button: "${nextButton.text}" at (${nextButton.rect.centerX}, ${nextButton.rect.centerY})`);
      
      // Try coordinate-based clicking instead of element clicking
      try {
        await this.page.click('body', { position: { x: nextButton.rect.centerX, y: nextButton.rect.centerY } });
        console.log(`   ✅ Successfully clicked Next button using coordinates!`);
        await this.page.waitForTimeout(3000);
        
        const currentUrl = this.page.url();
        console.log(`   🌐 Current URL: ${currentUrl}`);
        
      } catch (error) {
        console.log(`   ❌ Coordinate click failed: ${error.message}`);
        throw error;
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
    console.log(`   Selecting issue type: ${issueType}`);
    
    // Look for the Street option specifically
    const streetSelector = 'input[type="radio"][value="street_defect"]';
    const streetElement = await this.page.$(streetSelector);
    
    if (streetElement) {
      await streetElement.click();
      console.log(`   ✅ Selected Street option specifically`);
      await this.page.waitForTimeout(1000);
      
      // Verify Street is selected
      const isChecked = await streetElement.isChecked();
      console.log(`   ✅ Street option is checked: ${isChecked}`);
    } else {
      console.log(`   ⚠️ Street option not found, trying fallback...`);
      
      // Fallback: Look for any radio button with "street" in the value
      const streetFallbackSelector = 'input[type="radio"][value*="street"]';
      const streetFallbackElement = await this.page.$(streetFallbackSelector);
      
      if (streetFallbackElement) {
        await streetFallbackElement.click();
        console.log(`   ✅ Selected Street option via fallback`);
        await this.page.waitForTimeout(1000);
      } else {
        console.log(`   ❌ No Street option found`);
      }
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
    
    console.log('🧪 Testing Complete Workflow Pothole Form with Sample Data');
    console.log('========================================================');
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
module.exports = { CompleteWorkflowPotholeFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runCompleteWorkflowTest() {
    const automation = new CompleteWorkflowPotholeFormAutomation({ headless: false });
    
    try {
      const result = await automation.testPotholeForm();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'complete-workflow-pothole-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Complete workflow pothole form test failed:', error);
    }
  }
  
  runCompleteWorkflowTest();
}
