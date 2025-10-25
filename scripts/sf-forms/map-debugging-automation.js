const { chromium } = require('playwright');

/**
 * Map Debugging Automation - Understand What's Happening
 */
class MapDebuggingAutomation {
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
   * Debug map interaction
   */
  async debugMapInteraction() {
    console.log('🧪 Debugging Map Interaction');
    console.log('============================');
    
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
      
      // Debug map interaction
      console.log('📍 Debugging map interaction...');
      await this.debugMapStepByStep();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Debug map step by step
   */
  async debugMapStepByStep() {
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    const coordinates = '37.755196, -122.423207';
    
    // Step 1: Enter coordinates
    console.log(`\n   Step 1: Entering coordinates: ${coordinates}`);
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
    
    // Step 3: Wait and debug map state
    console.log(`   Step 3: Waiting for map to load...`);
    await this.page.waitForTimeout(3000);
    
    // Debug map state
    console.log(`   Step 4: Debugging map state...`);
    await this.debugMapState();
    
    // Step 5: Try different clicking approaches
    console.log(`   Step 5: Trying different clicking approaches...`);
    await this.tryDifferentClickingApproaches();
    
    // Step 6: Check if Next button is visible
    console.log(`   Step 6: Checking Next button visibility...`);
    await this.checkNextButtonVisibility();
  }

  /**
   * Debug map state
   */
  async debugMapState() {
    // Check if SVG map exists
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      console.log(`   ✅ SVG map found`);
      
      // Get map dimensions and position
      const mapInfo = await this.page.evaluate(() => {
        const svg = document.querySelector('#dform_widget_le_gis_citizen_gc');
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2
        };
      });
      
      console.log(`   📏 Map info:`, mapInfo);
      
      // Check for any markers or clickable elements
      const mapElements = await this.page.evaluate(() => {
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
      
      console.log(`   🔍 Found ${mapElements.length} elements in map:`);
      mapElements.slice(0, 10).forEach((el, i) => {
        console.log(`     ${i + 1}. <${el.tag}> class="${el.className}" id="${el.id}"`);
      });
      
    } else {
      console.log(`   ❌ SVG map not found`);
    }
  }

  /**
   * Try different clicking approaches
   */
  async tryDifferentClickingApproaches() {
    const addressField = await this.findAddressField();
    
    // Approach 1: Direct SVG click
    console.log(`\n   Approach 1: Direct SVG click`);
    const svgMap = await this.page.$('#dform_widget_le_gis_citizen_gc');
    if (svgMap) {
      try {
        await svgMap.click();
        console.log(`   ✅ Clicked SVG directly`);
        await this.page.waitForTimeout(1000);
        
        const value = await addressField.inputValue();
        console.log(`   📍 Location field value: "${value}"`);
      } catch (error) {
        console.log(`   ❌ SVG click failed: ${error.message}`);
      }
    }
    
    // Approach 2: Click with coordinates
    console.log(`\n   Approach 2: Click with coordinates`);
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
      try {
        await this.page.click('body', { position: { x: mapInfo.centerX, y: mapInfo.centerY } });
        console.log(`   ✅ Clicked map center: (${mapInfo.centerX}, ${mapInfo.centerY})`);
        await this.page.waitForTimeout(1000);
        
        const value = await addressField.inputValue();
        console.log(`   📍 Location field value: "${value}"`);
      } catch (error) {
        console.log(`   ❌ Coordinate click failed: ${error.message}`);
      }
    }
    
    // Approach 3: Try clicking on different elements
    console.log(`\n   Approach 3: Click on different elements`);
    const clickableElements = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const isInMapArea = rect.top > 200 && rect.top < 600 && rect.left > 200 && rect.left < 1000;
          const isVisible = el.offsetParent !== null;
          return isInMapArea && isVisible && (el.tagName === 'DIV' || el.tagName === 'IMG' || el.tagName === 'SVG');
        })
        .map(el => ({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          rect: el.getBoundingClientRect()
        }));
      
      return elements;
    });
    
    console.log(`   Found ${clickableElements.length} clickable elements in map area`);
    
    for (let i = 0; i < Math.min(clickableElements.length, 5); i++) {
      const el = clickableElements[i];
      try {
        const selector = el.id ? `#${el.id}` : 
                        el.className ? `.${el.className.split(' ')[0]}` : 
                        `${el.tag.toLowerCase()}`;
        
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          console.log(`   ✅ Clicked element ${i + 1}: ${selector}`);
          await this.page.waitForTimeout(500);
          
          const value = await addressField.inputValue();
          console.log(`   📍 Location field value: "${value}"`);
          
          if (value && value !== '37.755196, -122.423207') {
            console.log(`   🎯 SUCCESS! Location field populated: "${value}"`);
            return;
          }
        }
      } catch (error) {
        console.log(`   ❌ Element ${i + 1} click failed: ${error.message}`);
      }
    }
  }

  /**
   * Check Next button visibility
   */
  async checkNextButtonVisibility() {
    console.log(`\n   Checking Next button visibility...`);
    
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
    
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    if (nextButtons.length > 0) {
      console.log(`   ✅ Found ${nextButtons.length} Next buttons:`);
      nextButtons.forEach((btn, i) => {
        console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" at (${btn.rect.centerX}, ${btn.rect.centerY})`);
      });
    } else {
      console.log(`   ❌ No Next buttons found`);
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
module.exports = { MapDebuggingAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runMapDebugTest() {
    const automation = new MapDebuggingAutomation({ headless: false });
    
    try {
      const result = await automation.debugMapInteraction();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Map debug test failed:', error);
    }
  }
  
  runMapDebugTest();
}
