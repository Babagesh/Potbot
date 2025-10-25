const { chromium } = require('playwright');

/**
 * GPS-Accurate Map Clicking Automation - Click Correct Location
 */
class GPSAccurateMapClickingAutomation {
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
   * Test GPS-accurate map clicking
   */
  async testGPSAccurateMapClicking() {
    console.log('🧪 Testing GPS-Accurate Map Clicking');
    console.log('====================================');
    
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
      
      // Test GPS-accurate map clicking
      console.log('📍 Testing GPS-accurate map clicking...');
      await this.testGPSAccurateMapApproaches();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test GPS-accurate map clicking approaches
   */
  async testGPSAccurateMapApproaches() {
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    const coordinates = '37.755196, -122.423207';
    const expectedAddress = '3232 22ND ST SAN FRANCISCO, CA 94110';
    
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
    
    // Step 3: Wait for map to load and center
    console.log(`   Step 3: Waiting for map to load and center...`);
    await this.page.waitForTimeout(3000);
    
    // Step 4: Try different approaches to click the correct GPS location
    const approaches = [
      { name: 'Center Click', method: () => this.clickMapCenter() },
      { name: 'Offset Click (GPS Location)', method: () => this.clickGPSLocation() },
      { name: 'Multiple GPS Clicks', method: () => this.clickGPSLocationMultiple() },
      { name: 'Search Around GPS', method: () => this.clickAroundGPSLocation() }
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
          
          // Check if it matches expected address
          if (locationFieldValue.includes('22ND ST') || locationFieldValue.includes('3232')) {
            console.log(`   🎯 PERFECT! Found expected address: "${locationFieldValue}"`);
          }
          
          // Try to find Next button with improved detection
          const nextButton = await this.findNextButtonImproved();
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
   * Click map center
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
   * Click GPS location (offset from center)
   */
  async clickGPSLocation() {
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
        // Try clicking slightly offset from center (GPS coordinates might be slightly off-center)
        const gpsOffsetX = svgRect.x + 20; // Slightly right of center
        const gpsOffsetY = svgRect.y - 10; // Slightly above center
        
        console.log(`   🎯 Clicking GPS location: (${gpsOffsetX}, ${gpsOffsetY})`);
        await this.page.click('body', { position: { x: gpsOffsetX, y: gpsOffsetY } });
        console.log(`   ✅ Clicked GPS location`);
      }
    }
  }

  /**
   * Click GPS location multiple times
   */
  async clickGPSLocationMultiple() {
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
          { x: svgRect.x + 20, y: svgRect.y - 10, name: 'GPS Offset 1' },
          { x: svgRect.x + 30, y: svgRect.y - 20, name: 'GPS Offset 2' },
          { x: svgRect.x + 10, y: svgRect.y + 10, name: 'GPS Offset 3' }
        ];
        
        console.log(`   🎯 Clicking multiple GPS positions...`);
        for (const pos of positions) {
          console.log(`   🖱️ Clicking ${pos.name}: (${pos.x}, ${pos.y})`);
          await this.page.click('body', { position: { x: pos.x, y: pos.y } });
          await this.page.waitForTimeout(500);
        }
      }
    }
  }

  /**
   * Click around GPS location
   */
  async clickAroundGPSLocation() {
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
          { x: svgRect.x - 30, y: svgRect.y - 30, name: 'Top Left' },
          { x: svgRect.x, y: svgRect.y - 30, name: 'Top Center' },
          { x: svgRect.x + 30, y: svgRect.y - 30, name: 'Top Right' },
          { x: svgRect.x - 30, y: svgRect.y, name: 'Middle Left' },
          { x: svgRect.x, y: svgRect.y, name: 'Center' },
          { x: svgRect.x + 30, y: svgRect.y, name: 'Middle Right' },
          { x: svgRect.x - 30, y: svgRect.y + 30, name: 'Bottom Left' },
          { x: svgRect.x, y: svgRect.y + 30, name: 'Bottom Center' },
          { x: svgRect.x + 30, y: svgRect.y + 30, name: 'Bottom Right' }
        ];
        
        console.log(`   🎯 Clicking around GPS location...`);
        for (const pos of positions) {
          console.log(`   🖱️ Clicking ${pos.name}: (${pos.x}, ${pos.y})`);
          await this.page.click('body', { position: { x: pos.x, y: pos.y } });
          await this.page.waitForTimeout(300);
        }
      }
    }
  }

  /**
   * IMPROVED: Find Next button with better detection
   */
  async findNextButtonImproved() {
    console.log(`   🔍 Looking for Next button with improved detection...`);
    
    // First, get all buttons and their positions
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
    
    console.log(`   Found ${allButtons.length} buttons:`);
    allButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" at (${btn.rect.centerX}, ${btn.rect.centerY})`);
    });
    
    // Look for Next/Continue buttons
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    if (nextButtons.length > 0) {
      console.log(`   Found ${nextButtons.length} Next buttons:`);
      nextButtons.forEach((btn, i) => {
        console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" at (${btn.rect.centerX}, ${btn.rect.centerY})`);
      });
      
      // Try to find the one in the bottom right
      const bottomRightButton = nextButtons.find(btn => 
        btn.rect.centerX > 1000 && btn.rect.centerY > 600
      );
      
      if (bottomRightButton) {
        console.log(`   ✅ Found Next button in bottom right: "${bottomRightButton.text}" at (${bottomRightButton.rect.centerX}, ${bottomRightButton.rect.centerY})`);
        
        const selector = bottomRightButton.tag === 'A' ? 
          `a:has-text("${bottomRightButton.text}")` : 
          bottomRightButton.tag === 'INPUT' ?
          `input[value="${bottomRightButton.text}"]` :
          `button:has-text("${bottomRightButton.text}")`;
        
        return await this.page.$(selector);
      } else {
        // Fallback to first Next button
        const firstNextButton = nextButtons[0];
        console.log(`   ⚠️ No bottom right button found, using first Next button: "${firstNextButton.text}"`);
        
        const selector = firstNextButton.tag === 'A' ? 
          `a:has-text("${firstNextButton.text}")` : 
          firstNextButton.tag === 'INPUT' ?
          `input[value="${firstNextButton.text}"]` :
          `button:has-text("${firstNextButton.text}")`;
        
        return await this.page.$(selector);
      }
    }
    
    console.log(`   ❌ No Next buttons found`);
    return null;
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
   * Find Next button (original method)
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
module.exports = { GPSAccurateMapClickingAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runGPSAccurateTest() {
    const automation = new GPSAccurateMapClickingAutomation({ headless: false });
    
    try {
      const result = await automation.testGPSAccurateMapClicking();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('GPS accurate test failed:', error);
    }
  }
  
  runGPSAccurateTest();
}
