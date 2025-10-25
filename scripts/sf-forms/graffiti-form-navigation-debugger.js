const { chromium } = require('playwright');

/**
 * Graffiti Form Navigation Debugger - Test the correct sequence for graffiti form
 */
class GraffitiFormNavigationDebugger {
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
   * Test graffiti form navigation sequence
   */
  async testGraffitiNavigation() {
    console.log('🎨 Testing Graffiti Form Navigation Sequence');
    console.log('===========================================');
    
    try {
      await this.init();
      
      // Step 1: Navigate to graffiti form
      console.log('🌐 Step 1: Navigating to graffiti form...');
      await this.page.goto('https://www.sf.gov/report-graffiti-issues', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Step 2: Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
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
        const reportButton = await this.page.$(selector);
        if (reportButton) {
          await reportButton.click();
          console.log(`   ✅ Clicked Verint Report button`);
          await this.page.waitForTimeout(5000);
        }
      }
      
      // Step 3: Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      const emergencyDisclaimerButton = await this.page.$('button:has-text("I Understand"), input[value*="I Understand"]');
      if (emergencyDisclaimerButton) {
        await emergencyDisclaimerButton.click();
        console.log(`   ✅ Clicked emergency disclaimer button`);
        await this.page.waitForTimeout(2000);
      }
      
      // Step 4: Analyze current page state
      console.log('🔍 Step 4: Analyzing current page state...');
      await this.analyzeCurrentPageState();
      
      // Step 5: Try to select issue type using JavaScript
      console.log('📋 Step 5: Trying to select issue type using JavaScript...');
      await this.trySelectIssueTypeJavaScript();
      
      // Step 6: Analyze page state after issue type selection
      console.log('🔍 Step 6: Analyzing page state after issue type selection...');
      await this.analyzeCurrentPageState();
      
      // Step 7: Click Next button
      console.log('➡️ Step 7: Clicking Next button...');
      await this.clickNextButton();
      
      // Step 8: Analyze page state after Next click
      console.log('🔍 Step 8: Analyzing page state after Next click...');
      await this.analyzeCurrentPageState();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Analyze current page state
   */
  async analyzeCurrentPageState() {
    console.log(`\n📋 Current Page State Analysis:`);
    console.log(`=================================`);
    
    const pageInfo = await this.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasForm: !!document.querySelector('form'),
        formCount: document.querySelectorAll('form').length,
        bodyText: document.body.textContent?.substring(0, 500) || 'No content'
      };
    });
    
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   Has Form: ${pageInfo.hasForm}`);
    console.log(`   Form Count: ${pageInfo.formCount}`);
    console.log(`   Body Text Preview: ${pageInfo.bodyText.substring(0, 300)}...`);
    
    // Check visible radio buttons
    const visibleRadios = await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      return radios
        .filter(radio => radio.offsetParent !== null)
        .map(radio => ({
          name: radio.name,
          value: radio.value,
          id: radio.id,
          isChecked: radio.checked,
          labelText: radio.nextElementSibling?.textContent?.trim() || ''
        }));
    });
    
    console.log(`   Visible Radio Buttons: ${visibleRadios.length}`);
    visibleRadios.forEach((radio, i) => {
      console.log(`     ${i + 1}. "${radio.labelText}" (${radio.value}) - Checked: ${radio.isChecked}`);
    });
    
    // Check visible dropdowns
    const visibleDropdowns = await this.page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects
        .filter(select => select.offsetParent !== null)
        .map(select => ({
          name: select.name,
          id: select.id,
          options: Array.from(select.options).map(option => ({
            value: option.value,
            text: option.textContent?.trim()
          }))
        }));
    });
    
    console.log(`   Visible Dropdowns: ${visibleDropdowns.length}`);
    visibleDropdowns.forEach((dropdown, i) => {
      console.log(`     ${i + 1}. "${dropdown.name}" (${dropdown.id})`);
      if (dropdown.options.length > 1) {
        console.log(`        Options:`);
        dropdown.options.forEach((option, j) => {
          console.log(`          ${j + 1}. "${option.text}" (${option.value})`);
        });
      }
    });
    
    // Check visible input fields
    const visibleInputs = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      return inputs
        .filter(input => input.offsetParent !== null)
        .map(input => ({
          tag: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          value: input.value
        }));
    });
    
    console.log(`   Visible Input Fields: ${visibleInputs.length}`);
    visibleInputs.forEach((input, i) => {
      console.log(`     ${i + 1}. <${input.tag}> ${input.type} - Name: "${input.name}", ID: "${input.id}"`);
      console.log(`        Placeholder: "${input.placeholder}", Value: "${input.value}"`);
    });
    
    // Check visible buttons
    const visibleButtons = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      return buttons
        .filter(btn => btn.offsetParent !== null && (btn.textContent?.trim() || btn.value))
        .map(btn => ({
          tag: btn.tagName,
          text: btn.textContent?.trim() || btn.value || '',
          id: btn.id,
          className: btn.className
        }));
    });
    
    console.log(`   Visible Buttons: ${visibleButtons.length}`);
    visibleButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" - ID: "${btn.id}"`);
    });
  }

  /**
   * Try to select issue type using JavaScript
   */
  async trySelectIssueTypeJavaScript() {
    console.log(`   Attempting to select "Graffiti on Public Property" using JavaScript...`);
    
    const success = await this.page.evaluate(() => {
      // Look for the graffiti_public radio button
      const graffitiPublicRadio = document.querySelector('input[type="radio"][value="graffiti_public"]');
      
      if (graffitiPublicRadio) {
        console.log(`   Found graffiti_public radio button`);
        
        // Try to click it
        try {
          graffitiPublicRadio.click();
          console.log(`   ✅ Clicked graffiti_public radio button`);
          return true;
        } catch (error) {
          console.log(`   ❌ Failed to click graffiti_public radio button: ${error.message}`);
          
          // Try alternative methods
          try {
            graffitiPublicRadio.checked = true;
            graffitiPublicRadio.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`   ✅ Set graffiti_public radio button checked and dispatched change event`);
            return true;
          } catch (error2) {
            console.log(`   ❌ Alternative method failed: ${error2.message}`);
            return false;
          }
        }
      } else {
        console.log(`   ❌ graffiti_public radio button not found`);
        return false;
      }
    });
    
    if (success) {
      console.log(`   ✅ Successfully selected issue type using JavaScript`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ❌ Failed to select issue type using JavaScript`);
    }
  }

  /**
   * Click Next button
   */
  async clickNextButton() {
    console.log(`   Looking for Next button...`);
    
    const success = await this.page.evaluate(() => {
      const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .filter(el => {
          const text = el.textContent?.trim() || el.value || '';
          return /next|continue|proceed/i.test(text);
        });
      
      console.log(`   Found ${nextButtons.length} Next buttons`);
      
      if (nextButtons.length > 0) {
        const nextButton = nextButtons[0];
        console.log(`   Next button text: "${nextButton.textContent?.trim() || nextButton.value}"`);
        console.log(`   Next button visible: ${nextButton.offsetParent !== null}`);
        
        if (nextButton.offsetParent !== null) {
          try {
            nextButton.click();
            console.log(`   ✅ Clicked Next button`);
            return true;
          } catch (error) {
            console.log(`   ❌ Failed to click Next button: ${error.message}`);
            return false;
          }
        } else {
          console.log(`   ❌ Next button not visible`);
          return false;
        }
      } else {
        console.log(`   ❌ No Next buttons found`);
        return false;
      }
    });
    
    if (success) {
      console.log(`   ✅ Successfully clicked Next button`);
      await this.page.waitForTimeout(3000);
    } else {
      console.log(`   ❌ Failed to click Next button`);
    }
  }
}

// Export the class
module.exports = { GraffitiFormNavigationDebugger };

// Run test if this file is executed directly
if (require.main === module) {
  async function runGraffitiNavigationTest() {
    const debuggerInstance = new GraffitiFormNavigationDebugger({ headless: false });
    
    try {
      const result = await debuggerInstance.testGraffitiNavigation();
      
      console.log('\n📊 Navigation Test Results:');
      console.log('============================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Graffiti navigation test failed:', error);
    }
  }
  
  runGraffitiNavigationTest();
}
