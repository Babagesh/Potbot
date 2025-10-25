const { chromium } = require('playwright');

/**
 * Complete SF.gov form automation that handles the full multi-step process
 */
class SFFormCompleteAutomation {
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
   * Complete workflow: Navigate to form, click Report, handle emergency disclaimer, click Next
   */
  async navigateToFormPage(formUrl) {
    console.log(`🌐 Step 1: Navigating to: ${formUrl}`);
    
    try {
      // Step 1: Navigate to initial SF.gov page
      await this.page.goto(formUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      console.log('🔍 Step 2: Looking for Report button...');
      
      // Step 2: Find and click Report button
      const reportButton = await this.findReportButton();
      if (!reportButton.found) {
        throw new Error(`Report button not found: ${reportButton.error}`);
      }
      
      console.log(`🖱️ Step 3: Clicking Report button: ${reportButton.selector}`);
      await reportButton.element.click();
      await this.page.waitForTimeout(3000);
      
      const afterReportUrl = this.page.url();
      console.log(`📍 Step 4: After Report click - URL: ${afterReportUrl}`);
      
      // Step 3: Handle emergency disclaimer page
      console.log('🚨 Step 5: Looking for emergency disclaimer and Next button...');
      
      const nextButton = await this.findNextButton();
      if (!nextButton.found) {
        throw new Error(`Next button not found: ${nextButton.error}`);
      }
      
      console.log(`🖱️ Step 6: Clicking Next button: ${nextButton.selector}`);
      await nextButton.element.click();
      await this.page.waitForTimeout(3000);
      
      const finalUrl = this.page.url();
      console.log(`📍 Step 7: Final form URL: ${finalUrl}`);
      
      return {
        success: true,
        initialUrl: formUrl,
        afterReportUrl: afterReportUrl,
        finalFormUrl: finalUrl,
        reportButtonSelector: reportButton.selector,
        nextButtonSelector: nextButton.selector
      };
      
    } catch (error) {
      console.log(`❌ Error in navigation: ${error.message}`);
      return {
        success: false,
        error: error.message,
        currentUrl: this.page.url()
      };
    }
  }

  /**
   * Find the Report button on the initial SF.gov page
   */
  async findReportButton() {
    const reportButtonSelectors = [
      'a:has-text("Report")',
      'button:has-text("Report")',
      'a:has-text("Start Report")',
      'button:has-text("Start Report")',
      'a:has-text("Report Issue")',
      'button:has-text("Report Issue")',
      'a:has-text("Report Problem")',
      'button:has-text("Report Problem")',
      'a:has-text("Submit Report")',
      'button:has-text("Submit Report")',
      '.report-button',
      '#report-button',
      '.start-report',
      '#start-report'
    ];
    
    for (const selector of reportButtonSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          if (isVisible && isEnabled) {
            return {
              found: true,
              element: element,
              selector: selector
            };
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return {
      found: false,
      error: 'No visible and enabled report button found'
    };
  }

  /**
   * Find the Next button on the emergency disclaimer page
   */
  async findNextButton() {
    const nextButtonSelectors = [
      'button:has-text("Next")',
      'a:has-text("Next")',
      'button:has-text("Continue")',
      'a:has-text("Continue")',
      'button:has-text("Proceed")',
      'a:has-text("Proceed")',
      'input[type="submit"]:has-text("Next")',
      'input[type="button"]:has-text("Next")',
      '.next-button',
      '#next-button',
      '.continue-button',
      '#continue-button',
      '.proceed-button',
      '#proceed-button'
    ];
    
    for (const selector of nextButtonSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          if (isVisible && isEnabled) {
            return {
              found: true,
              element: element,
              selector: selector
            };
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Fallback: look for any button with next-related text
    try {
      const allButtons = await this.page.$$eval('button, a, input[type="submit"], input[type="button"]', elements =>
        elements.map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim() || el.value || '',
          className: el.className,
          id: el.id,
          isVisible: el.offsetParent !== null,
          isEnabled: !el.disabled
        })).filter(el => 
          el.text && 
          el.isVisible &&
          el.isEnabled &&
          /next|continue|proceed/i.test(el.text)
        )
      );
      
      if (allButtons.length > 0) {
        const firstButton = allButtons[0];
        const buttonSelector = firstButton.tag === 'A' ? 
          `a:has-text("${firstButton.text}")` : 
          firstButton.tag === 'INPUT' ?
          `input[value="${firstButton.text}"]` :
          `button:has-text("${firstButton.text}")`;
        
        const element = await this.page.$(buttonSelector);
        if (element) {
          return {
            found: true,
            element: element,
            selector: buttonSelector
          };
        }
      }
    } catch (error) {
      // Fallback failed
    }
    
    return {
      found: false,
      error: 'No visible and enabled next button found'
    };
  }

  /**
   * Test the complete navigation workflow for all SF.gov forms
   */
  async testCompleteNavigation() {
    const formUrls = {
      pothole: 'https://www.sf.gov/report-pothole-and-street-issues',
      sidewalk: 'https://www.sf.gov/report-curb-and-sidewalk-problems',
      graffiti: 'https://www.sf.gov/report-graffiti-issues',
      trash: 'https://www.sf.gov/report-garbage-container-issues',
      streetMarkings: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
      streetlight: 'https://www.sf.gov/report-problem-streetlight',
      fallenTree: 'https://www.sf.gov/report-damaged-or-fallen-tree'
    };
    
    console.log('🧪 Testing Complete SF.gov Form Navigation\n');
    console.log('==========================================');
    
    const results = {};
    
    for (const [damageType, url] of Object.entries(formUrls)) {
      console.log(`\n🔍 Testing ${damageType.toUpperCase()}:`);
      console.log('='.repeat(50));
      
      try {
        await this.init();
        const result = await this.navigateToFormPage(url);
        
        results[damageType] = {
          url,
          ...result,
          testedAt: new Date().toISOString()
        };
        
        console.log(`Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
        if (result.success) {
          console.log(`Final form URL: ${result.finalFormUrl}`);
        }
        
        await this.cleanup();
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 3000));
        
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
    console.log('\n📊 Complete Navigation Test Results:');
    console.log('====================================');
    
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
      if (result.success) {
        console.log(`    Final URL: ${result.finalFormUrl}`);
      }
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
module.exports = { SFFormCompleteAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runCompleteTest() {
    const automation = new SFFormCompleteAutomation({ headless: false });
    
    try {
      const results = await automation.testCompleteNavigation();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'sf-complete-navigation-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Complete test failed:', error);
    }
  }
  
  runCompleteTest();
}
