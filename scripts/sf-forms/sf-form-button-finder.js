const { chromium } = require('playwright');

/**
 * Updated SF.gov form automation that handles the multi-step process
 */
class SFFormMultiStepAutomation {
  constructor(options = {}) {
    this.headless = options.headless !== false; // Default to headless
    this.timeout = options.timeout || 30000;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize browser and context
   */
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

  /**
   * Navigate to SF.gov form and find the report button
   */
  async findAndClickReportButton(formUrl) {
    console.log(`🌐 Navigating to: ${formUrl}`);
    
    try {
      await this.page.goto(formUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000); // Wait for page to fully load
      
      console.log('🔍 Looking for report button...');
      
      // Multiple strategies to find the report button
      const reportButtonSelectors = [
        // Common button text patterns
        'button:has-text("Report")',
        'a:has-text("Report")',
        'button:has-text("Start Report")',
        'a:has-text("Start Report")',
        'button:has-text("Report Issue")',
        'a:has-text("Report Issue")',
        'button:has-text("Report Problem")',
        'a:has-text("Report Problem")',
        'button:has-text("Submit Report")',
        'a:has-text("Submit Report")',
        
        // Common button classes/IDs
        '.report-button',
        '#report-button',
        '.start-report',
        '#start-report',
        '.submit-report',
        '#submit-report',
        
        // Generic button patterns
        'button[class*="report"]',
        'a[class*="report"]',
        'button[id*="report"]',
        'a[id*="report"]',
        
        // SF.gov specific patterns
        '.sf-button',
        '.city-button',
        '.service-button'
      ];
      
      let reportButton = null;
      let usedSelector = '';
      
      // Try each selector
      for (const selector of reportButtonSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            
            if (isVisible && isEnabled) {
              reportButton = element;
              usedSelector = selector;
              console.log(`✅ Found report button with selector: ${selector}`);
              break;
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!reportButton) {
        // Fallback: look for any button with report-related text
        console.log('🔍 Fallback: Searching for buttons with report-related text...');
        
        const allButtons = await this.page.$$eval('button, a', elements =>
          elements.map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim(),
            href: el.href,
            className: el.className,
            id: el.id,
            isVisible: el.offsetParent !== null
          })).filter(el => 
            el.text && 
            el.isVisible &&
            /report|submit|start|begin|create|new/i.test(el.text)
          )
        );
        
        console.log(`Found ${allButtons.length} potential buttons:`);
        allButtons.forEach((btn, i) => {
          console.log(`   ${i + 1}. <${btn.tag}> "${btn.text}" class="${btn.className}" id="${btn.id}"`);
        });
        
        if (allButtons.length > 0) {
          // Try clicking the first promising button
          const firstButton = allButtons[0];
          const buttonSelector = firstButton.tag === 'A' ? 
            `a:has-text("${firstButton.text}")` : 
            `button:has-text("${firstButton.text}")`;
          
          reportButton = await this.page.$(buttonSelector);
          usedSelector = buttonSelector;
          console.log(`🎯 Using first promising button: "${firstButton.text}"`);
        }
      }
      
      if (reportButton) {
        console.log(`🖱️ Clicking report button: ${usedSelector}`);
        
        // Scroll to button if needed
        await reportButton.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(1000);
        
        // Click the button
        await reportButton.click();
        
        // Wait for navigation or page change
        console.log('⏳ Waiting for page to load after clicking report button...');
        await this.page.waitForTimeout(3000);
        
        // Check if we navigated to a new page
        const currentUrl = this.page.url();
        console.log(`📍 Current URL after click: ${currentUrl}`);
        
        if (currentUrl !== formUrl) {
          console.log('✅ Successfully navigated to form page!');
          return {
            success: true,
            newUrl: currentUrl,
            selector: usedSelector
          };
        } else {
          // Check if the page content changed (dynamic loading)
          const pageContent = await this.page.content();
          if (pageContent.length > 1000) { // Basic check for content change
            console.log('✅ Page content updated (dynamic loading)');
            return {
              success: true,
              newUrl: currentUrl,
              selector: usedSelector,
              dynamicLoad: true
            };
          } else {
            console.log('⚠️ No navigation detected, checking for dynamic content...');
            return {
              success: false,
              error: 'No navigation or content change detected',
              selector: usedSelector
            };
          }
        }
      } else {
        console.log('❌ No report button found');
        return {
          success: false,
          error: 'Report button not found'
        };
      }
      
    } catch (error) {
      console.log(`❌ Error finding report button: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test all SF.gov form URLs to find report buttons
   */
  async testAllFormUrls() {
    const formUrls = {
      pothole: 'https://www.sf.gov/report-pothole-and-street-issues',
      sidewalk: 'https://www.sf.gov/report-curb-and-sidewalk-problems',
      graffiti: 'https://www.sf.gov/report-graffiti-issues',
      trash: 'https://www.sf.gov/report-garbage-container-issues',
      streetMarkings: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
      streetlight: 'https://www.sf.gov/report-problem-streetlight',
      fallenTree: 'https://www.sf.gov/report-damaged-or-fallen-tree'
    };
    
    console.log('🧪 Testing All SF.gov Form URLs\n');
    console.log('================================');
    
    const results = {};
    
    for (const [damageType, url] of Object.entries(formUrls)) {
      console.log(`\n🔍 Testing ${damageType.toUpperCase()}:`);
      console.log('='.repeat(50));
      
      try {
        await this.init();
        const result = await this.findAndClickReportButton(url);
        
        results[damageType] = {
          url,
          ...result,
          testedAt: new Date().toISOString()
        };
        
        console.log(`Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
        
        await this.cleanup();
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ Error testing ${damageType}: ${error.message}`);
        results[damageType] = {
          url,
          success: false,
          error: error.message,
          testedAt: new Date().toISOString()
        };
        
        await this.cleanup();
      }
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const successful = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    
    console.log(`Total tests: ${total}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${total - successful}`);
    console.log(`Success rate: ${((successful / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    Object.entries(results).forEach(([type, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${type}: ${result.success ? 'SUCCESS' : result.error}`);
    });
    
    return results;
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Export the class
module.exports = { SFFormMultiStepAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runTest() {
    const automation = new SFFormMultiStepAutomation({ headless: false });
    
    try {
      const results = await automation.testAllFormUrls();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'sf-form-button-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
  
  runTest();
}
