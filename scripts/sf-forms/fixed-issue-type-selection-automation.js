const { chromium } = require('playwright');

/**
 * Fixed Issue Type Selection - Ensure Street is Selected and Stays Selected
 */
class FixedIssueTypeSelectionAutomation {
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
   * Test fixed issue type selection
   */
  async testFixedIssueTypeSelection() {
    console.log('🧪 Testing Fixed Issue Type Selection');
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
      
      // Test fixed issue type selection
      console.log('📋 Testing fixed issue type selection...');
      await this.testIssueTypeSelectionFixed();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test fixed issue type selection
   */
  async testIssueTypeSelectionFixed() {
    console.log(`   Testing issue type selection for: Street`);
    
    // Step 1: Get all radio buttons and their details
    console.log(`   Step 1: Analyzing all radio buttons...`);
    const radioButtonsInfo = await this.page.evaluate(() => {
      const radioButtons = Array.from(document.querySelectorAll('input[type="radio"]'));
      return radioButtons.map((radio, index) => ({
        index: index,
        value: radio.value,
        name: radio.name,
        id: radio.id,
        checked: radio.checked,
        text: radio.nextElementSibling?.textContent?.trim() || '',
        label: document.querySelector(`label[for="${radio.id}"]`)?.textContent?.trim() || ''
      }));
    });
    
    console.log(`   Found ${radioButtonsInfo.length} radio buttons:`);
    radioButtonsInfo.forEach((radio, i) => {
      console.log(`     ${i + 1}. Value: "${radio.value}" | Text: "${radio.text}" | Label: "${radio.label}" | Checked: ${radio.checked}`);
    });
    
    // Step 2: Find the Street option specifically
    console.log(`   Step 2: Looking for Street option...`);
    const streetOption = radioButtonsInfo.find(radio => 
      radio.value.toLowerCase().includes('street') ||
      radio.text.toLowerCase().includes('street') ||
      radio.label.toLowerCase().includes('street')
    );
    
    if (streetOption) {
      console.log(`   ✅ Found Street option: Value="${streetOption.value}" Text="${streetOption.text}" Label="${streetOption.label}"`);
      
      // Step 3: Click the Street option specifically
      console.log(`   Step 3: Clicking Street option...`);
      const streetSelector = streetOption.id ? `#${streetOption.id}` : 
                            `input[type="radio"][value="${streetOption.value}"]`;
      
      const streetElement = await this.page.$(streetSelector);
      if (streetElement) {
        await streetElement.click();
        console.log(`   ✅ Clicked Street option`);
        await this.page.waitForTimeout(1000);
        
        // Step 4: Verify Street is selected
        console.log(`   Step 4: Verifying Street is selected...`);
        const isChecked = await streetElement.isChecked();
        console.log(`   ✅ Street option is checked: ${isChecked}`);
        
        if (isChecked) {
          console.log(`   ✅ SUCCESS! Street option is properly selected`);
        } else {
          console.log(`   ❌ FAILED! Street option is not checked`);
        }
        
        // Step 5: Wait and check again to ensure it stays selected
        console.log(`   Step 5: Waiting and checking again...`);
        await this.page.waitForTimeout(2000);
        
        const isStillChecked = await streetElement.isChecked();
        console.log(`   ✅ Street option still checked after wait: ${isStillChecked}`);
        
        if (isStillChecked) {
          console.log(`   ✅ SUCCESS! Street option remains selected`);
        } else {
          console.log(`   ❌ FAILED! Street option was deselected`);
        }
        
      } else {
        console.log(`   ❌ Could not find Street element with selector: ${streetSelector}`);
      }
    } else {
      console.log(`   ❌ No Street option found in radio buttons`);
      
      // Fallback: Try clicking the first radio button and see what happens
      console.log(`   🔄 Fallback: Trying first radio button...`);
      const firstRadio = await this.page.$('input[type="radio"]');
      if (firstRadio) {
        await firstRadio.click();
        console.log(`   ✅ Clicked first radio button`);
        await this.page.waitForTimeout(1000);
        
        const isChecked = await firstRadio.isChecked();
        console.log(`   📍 First radio button is checked: ${isChecked}`);
      }
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
}

// Export the class
module.exports = { FixedIssueTypeSelectionAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runFixedIssueTypeTest() {
    const automation = new FixedIssueTypeSelectionAutomation({ headless: false });
    
    try {
      const result = await automation.testFixedIssueTypeSelection();
      
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Fixed issue type test failed:', error);
    }
  }
  
  runFixedIssueTypeTest();
}
