const { chromium } = require('playwright');

/**
 * Sidewalk Form Structure Debugger - Investigate the sidewalk form structure
 */
class SidewalkFormDebugger {
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
   * Debug sidewalk form structure
   */
  async debugSidewalkForm() {
    console.log('🔍 Debugging Sidewalk Form Structure');
    console.log('====================================');
    
    try {
      await this.init();
      
      // Navigate to sidewalk form
      console.log('🌐 Navigating to sidewalk form...');
      await this.page.goto('https://www.sf.gov/report-curb-and-sidewalk-problems', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Click Report button
      console.log('🖱️ Clicking Report button...');
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
      
      // Look for Verint-specific URL first
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
      
      // Handle emergency disclaimer
      console.log('🚨 Handling emergency disclaimer...');
      const emergencyDisclaimerButton = await this.page.$('button:has-text("I Understand"), input[value*="I Understand"]');
      if (emergencyDisclaimerButton) {
        await emergencyDisclaimerButton.click();
        console.log(`   ✅ Clicked emergency disclaimer button`);
        await this.page.waitForTimeout(2000);
      }
      
      // Now analyze the form structure
      console.log('🔍 Analyzing form structure...');
      await this.analyzeFormStructure();
      
      return { success: true };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Analyze form structure
   */
  async analyzeFormStructure() {
    console.log(`\n📋 Form Structure Analysis:`);
    console.log(`============================`);
    
    const formInfo = await this.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasForm: !!document.querySelector('form'),
        formCount: document.querySelectorAll('form').length,
        bodyText: document.body.textContent?.substring(0, 1000) || 'No content'
      };
    });
    
    console.log(`   Title: ${formInfo.title}`);
    console.log(`   URL: ${formInfo.url}`);
    console.log(`   Has Form: ${formInfo.hasForm}`);
    console.log(`   Form Count: ${formInfo.formCount}`);
    console.log(`   Body Text Preview: ${formInfo.bodyText.substring(0, 500)}...`);
    
    // Look for all radio buttons
    console.log(`\n🔘 Radio Button Analysis:`);
    console.log(`=========================`);
    
    const radioButtons = await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      return radios.map((radio, index) => ({
        index: index + 1,
        name: radio.name,
        value: radio.value,
        id: radio.id,
        className: radio.className,
        isVisible: radio.offsetParent !== null,
        isEnabled: !radio.disabled,
        isChecked: radio.checked,
        labelText: radio.nextElementSibling?.textContent?.trim() || '',
        boundingRect: radio.getBoundingClientRect()
      }));
    });
    
    console.log(`   Found ${radioButtons.length} radio buttons:`);
    radioButtons.forEach((radio, i) => {
      console.log(`     ${i + 1}. Name: "${radio.name}", Value: "${radio.value}"`);
      console.log(`        ID: ${radio.id}`);
      console.log(`        Class: ${radio.className}`);
      console.log(`        Visible: ${radio.isVisible}, Enabled: ${radio.isEnabled}, Checked: ${radio.isChecked}`);
      console.log(`        Label: "${radio.labelText}"`);
      console.log(`        Position: (${radio.boundingRect.x}, ${radio.boundingRect.y})`);
      console.log('');
    });
    
    // Look for any buttons
    console.log(`\n🔘 Button Analysis:`);
    console.log(`===================`);
    
    const allButtons = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      return buttons
        .map((btn, index) => ({
          index: index + 1,
          tag: btn.tagName,
          text: btn.textContent?.trim() || btn.value || '',
          className: btn.className,
          id: btn.id,
          name: btn.name,
          type: btn.type,
          isVisible: btn.offsetParent !== null,
          isEnabled: !btn.disabled,
          boundingRect: btn.getBoundingClientRect()
        }))
        .filter(btn => btn.text); // Only show buttons with text
    });
    
    console.log(`   Found ${allButtons.length} buttons with text:`);
    allButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}"`);
      console.log(`        Class: ${btn.className}`);
      console.log(`        ID: ${btn.id}`);
      console.log(`        Name: ${btn.name}`);
      console.log(`        Type: ${btn.type}`);
      console.log(`        Visible: ${btn.isVisible}, Enabled: ${btn.isEnabled}`);
      console.log(`        Position: (${btn.boundingRect.x}, ${btn.boundingRect.y})`);
      console.log('');
    });
    
    // Look for any input fields
    console.log(`\n📝 Input Field Analysis:`);
    console.log(`========================`);
    
    const inputFields = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs
        .map((input, index) => ({
          index: index + 1,
          tag: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder,
          value: input.value,
          isVisible: input.offsetParent !== null,
          isEnabled: !input.disabled,
          boundingRect: input.getBoundingClientRect()
        }))
        .filter(input => input.isVisible); // Only show visible inputs
    });
    
    console.log(`   Found ${inputFields.length} visible input fields:`);
    inputFields.forEach((input, i) => {
      console.log(`     ${i + 1}. <${input.tag}> Type: ${input.type}`);
      console.log(`        Name: ${input.name}`);
      console.log(`        ID: ${input.id}`);
      console.log(`        Class: ${input.className}`);
      console.log(`        Placeholder: ${input.placeholder}`);
      console.log(`        Value: ${input.value}`);
      console.log(`        Enabled: ${input.isEnabled}`);
      console.log(`        Position: (${input.boundingRect.x}, ${input.boundingRect.y})`);
      console.log('');
    });
  }
}

// Export the class
module.exports = { SidewalkFormDebugger };

// Run test if this file is executed directly
if (require.main === module) {
  async function runSidewalkDebug() {
    const debuggerInstance = new SidewalkFormDebugger({ headless: false });
    
    try {
      const result = await debuggerInstance.debugSidewalkForm();
      
      console.log('\n📊 Debug Results:');
      console.log('=================');
      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      if (!result.success) {
        console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Sidewalk form debug failed:', error);
    }
  }
  
  runSidewalkDebug();
}
