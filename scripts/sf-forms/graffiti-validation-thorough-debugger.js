const { chromium } = require('playwright');

class GraffitiValidationDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 2000 
    });
    this.page = await this.browser.newPage();
  }

  async debugValidationAndProgression() {
    console.log('🔍 Debugging Graffiti Form Validation and Page Progression');
    console.log('=======================================================');

    try {
      // Navigate to graffiti form
      console.log('🌐 Step 1: Navigating to graffiti form...');
      await this.page.goto('https://www.sf.gov/report-graffiti-issues', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });

      // Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
      await this.clickReportButton();

      // Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      await this.handleEmergencyDisclaimer();

      // Select issue type
      console.log('📋 Step 4: Selecting issue type...');
      await this.selectIssueTypeJavaScript('Graffiti on Public Property');

      // Click Next to get to location page
      console.log('➡️ Step 5: Clicking Next to get to location page...');
      await this.clickNextToLocationPage();

      // Complete location workflow
      console.log('📍 Step 6: Completing location workflow...');
      await this.completeLocationWorkflow();

      // Click Next to get to request details page
      console.log('➡️ Step 7: Clicking Next to get to request details page...');
      await this.clickNextToRequestDetailsPage();

      // Debug the request details page thoroughly
      console.log('📝 Step 8: Debugging request details page...');
      await this.debugRequestDetailsPageThoroughly();

      // Try different dropdown selection approaches
      console.log('🔧 Step 9: Testing different dropdown approaches...');
      await this.testDifferentDropdownApproaches();

      // Check validation state after each attempt
      console.log('✅ Step 10: Checking validation state...');
      await this.checkValidationState();

    } catch (error) {
      console.error('❌ Error during debugging:', error.message);
    } finally {
      // Keep browser open for manual inspection
      console.log('🔍 Browser kept open for manual inspection. Close manually when done.');
      // await this.browser.close();
    }
  }

  async clickReportButton() {
    const reportButton = await this.page.$('a[href*="verintcloudservices.com"]');
    if (reportButton) {
      await reportButton.click();
      console.log('   ✅ Clicked Verint Report button');
      await this.page.waitForTimeout(2000);
    } else {
      throw new Error('Report button not found');
    }
  }

  async handleEmergencyDisclaimer() {
    await this.page.waitForTimeout(2000);
    
    const nextButton = await this.page.$('button:has-text("Next")');
    if (nextButton) {
      await nextButton.click();
      console.log('   ✅ Clicked Next on emergency disclaimer');
      await this.page.waitForTimeout(2000);
    }
  }

  async selectIssueTypeJavaScript(issueType) {
    const issueTypeMapping = {
      'Graffiti on Private Property': 'graffiti_private',
      'Graffiti on Public Property': 'graffiti_public',
      'Illegal Postings on Public Property': 'illegal_postings'
    };
    
    const mappedValue = issueTypeMapping[issueType];
    
    await this.page.evaluate((value) => {
      const radioButton = document.querySelector(`input[type="radio"][value="${value}"]`);
      if (radioButton) {
        radioButton.checked = true;
        radioButton.dispatchEvent(new Event('change', { bubbles: true }));
        radioButton.dispatchEvent(new Event('input', { bubbles: true }));
        radioButton.dispatchEvent(new Event('click', { bubbles: true }));
        console.log(`   ✅ Selected issue type: ${value}`);
      }
    }, mappedValue);
    
    await this.page.waitForTimeout(1000);
  }

  async clickNextToLocationPage() {
    const success = await this.page.evaluate(() => {
      const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .filter(el => {
          const text = el.textContent?.trim() || el.value || '';
          return /next|continue|proceed/i.test(text);
        });
      
      if (nextButtons.length > 0) {
        const nextButton = nextButtons[0];
        try {
          nextButton.click();
          return true;
        } catch (error) {
          try {
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            nextButton.dispatchEvent(clickEvent);
            return true;
          } catch (error2) {
            try {
              const form = nextButton.closest('form');
              if (form) {
                form.submit();
                return true;
              }
            } catch (error3) {
              return false;
            }
          }
        }
      }
      return false;
    });
    
    if (success) {
      console.log('   ✅ Successfully clicked Next button to get to location page');
      await this.page.waitForTimeout(2000);
    }
  }

  async completeLocationWorkflow() {
    // Enter coordinates
    const addressInput = await this.page.$('input[placeholder*="address"], input[placeholder*="place"]');
    if (addressInput) {
      await addressInput.fill('37.755196, -122.423207');
      console.log('   ✅ Entered coordinates');
    }

    // Click magnifying glass
    const searchButton = await this.page.$('button[title*="search"], button[aria-label*="search"]');
    if (searchButton) {
      await searchButton.click();
      console.log('   ✅ Clicked magnifying glass');
      await this.page.waitForTimeout(2000);
    }

    // Click zoom in twice
    const zoomInButton = await this.page.$('button[title*="zoom in"], button[aria-label*="zoom in"]');
    if (zoomInButton) {
      await zoomInButton.click();
      await this.page.waitForTimeout(1000);
      await zoomInButton.click();
      console.log('   ✅ Clicked zoom in twice');
      await this.page.waitForTimeout(2000);
    }

    // Click map center
    const mapElement = await this.page.$('[id*="map"], .map, [class*="map"]');
    if (mapElement) {
      const box = await mapElement.boundingBox();
      if (box) {
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        console.log('   ✅ Clicked map center');
        await this.page.waitForTimeout(2000);
      }
    }

    // Fill location description
    const locationDescInput = await this.page.$('textarea[name*="description"], input[name*="description"]');
    if (locationDescInput) {
      await locationDescInput.fill('Graffiti spray painted on the side of the building near the main entrance.');
      await locationDescInput.press('Enter');
      console.log('   ✅ Filled location description');
      await this.page.waitForTimeout(1000);
    }
  }

  async clickNextToRequestDetailsPage() {
    const nextButton = await this.page.$('button:has-text("Next")');
    if (nextButton) {
      await nextButton.click();
      console.log('   ✅ Clicked Next to get to request details page');
      await this.page.waitForTimeout(3000);
    }
  }

  async debugRequestDetailsPageThoroughly() {
    console.log('   🔍 Thoroughly debugging request details page...');
    
    // Check current URL
    const currentUrl = this.page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check page title
    const title = await this.page.title();
    console.log(`   Page title: ${title}`);
    
    // Check for all form elements
    const formElements = await this.page.evaluate(() => {
      const elements = [];
      
      // Check all selects
      const selects = document.querySelectorAll('select');
      selects.forEach((select, index) => {
        elements.push({
          type: 'select',
          index: index + 1,
          name: select.name,
          id: select.id,
          className: select.className,
          isVisible: select.offsetParent !== null,
          required: select.required,
          value: select.value,
          selectedIndex: select.selectedIndex,
          options: Array.from(select.options).map(option => ({
            value: option.value,
            text: option.textContent?.trim(),
            selected: option.selected
          }))
        });
      });
      
      // Check all textareas
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea, index) => {
        elements.push({
          type: 'textarea',
          index: index + 1,
          name: textarea.name,
          id: textarea.id,
          className: textarea.className,
          isVisible: textarea.offsetParent !== null,
          required: textarea.required,
          value: textarea.value
        });
      });
      
      // Check all file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input, index) => {
        elements.push({
          type: 'file',
          index: index + 1,
          name: input.name,
          id: input.id,
          className: input.className,
          isVisible: input.offsetParent !== null,
          required: input.required
        });
      });
      
      return elements;
    });
    
    console.log(`   Found ${formElements.length} form elements:`);
    formElements.forEach(element => {
      console.log(`     ${element.type} ${element.index}: Name="${element.name}", ID="${element.id}", Visible=${element.isVisible}, Required=${element.required}`);
      if (element.type === 'select') {
        console.log(`        Current value: "${element.value}", Selected index: ${element.selectedIndex}`);
        console.log(`        Options: ${element.options.length}`);
        element.options.forEach((option, i) => {
          const selected = option.selected ? ' (SELECTED)' : '';
          console.log(`          ${i + 1}. "${option.text}" (value: "${option.value}")${selected}`);
        });
      } else if (element.type === 'textarea') {
        console.log(`        Current value: "${element.value}"`);
      }
    });
    
    // Check for validation messages
    const validationMessages = await this.page.evaluate(() => {
      const messages = [];
      
      // Look for validation messages
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && (
          text.includes('Please select') ||
          text.includes('required') ||
          text.includes('invalid') ||
          text.includes('error') ||
          text.includes('must') ||
          text.includes('choose')
        )) {
          messages.push({
            tagName: el.tagName,
            text: text,
            className: el.className,
            id: el.id,
            style: {
              color: getComputedStyle(el).color,
              display: getComputedStyle(el).display,
              visibility: getComputedStyle(el).visibility,
              fontSize: getComputedStyle(el).fontSize
            }
          });
        }
      });
      
      return messages;
    });
    
    if (validationMessages.length > 0) {
      console.log(`   ⚠️ Found ${validationMessages.length} validation messages:`);
      validationMessages.forEach((msg, i) => {
        console.log(`     ${i + 1}. ${msg.tagName}: "${msg.text}" (color: ${msg.style.color}, display: ${msg.style.display})`);
      });
    } else {
      console.log(`   ✅ No validation messages found`);
    }
    
    // Check for Next button
    const nextButtonInfo = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      const nextButtons = buttons.filter(button => 
        /next|continue|proceed/i.test(button.textContent?.trim() || button.value || '')
      );
      
      if (nextButtons.length > 0) {
        const button = nextButtons[0];
        const rect = button.getBoundingClientRect();
        return {
          found: true,
          text: button.textContent?.trim() || button.value || '',
          tagName: button.tagName,
          visible: button.offsetParent !== null,
          disabled: button.disabled,
          position: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          style: {
            display: getComputedStyle(button).display,
            visibility: getComputedStyle(button).visibility,
            opacity: getComputedStyle(button).opacity
          }
        };
      }
      return { found: false };
    });
    
    if (nextButtonInfo.found) {
      console.log(`   ✅ Found Next button: "${nextButtonInfo.text}"`);
      console.log(`   Visible: ${nextButtonInfo.visible}`);
      console.log(`   Disabled: ${nextButtonInfo.disabled}`);
      console.log(`   Position: x=${nextButtonInfo.position.x}, y=${nextButtonInfo.position.y}`);
      console.log(`   Style: display=${nextButtonInfo.style.display}, visibility=${nextButtonInfo.style.visibility}, opacity=${nextButtonInfo.style.opacity}`);
    } else {
      console.log(`   ❌ No Next button found`);
    }
  }

  async testDifferentDropdownApproaches() {
    console.log('   🔧 Testing different dropdown approaches...');
    
    // Test Approach 1: Playwright's selectOption
    console.log('\n   📋 Approach 1: Playwright selectOption');
    await this.testPlaywrightSelectOption();
    
    // Test Approach 2: Manual clicking
    console.log('\n   📋 Approach 2: Manual clicking');
    await this.testManualClicking();
    
    // Test Approach 3: Focus and keyboard
    console.log('\n   📋 Approach 3: Focus and keyboard');
    await this.testFocusAndKeyboard();
  }

  async testPlaywrightSelectOption() {
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      try {
        await requestRegardingSelect.selectOption({ value: 'not_offensive' });
        console.log('     ✅ Playwright selectOption successful');
        await this.checkValidationState('After Playwright selectOption');
      } catch (error) {
        console.log(`     ❌ Playwright selectOption failed: ${error.message}`);
      }
    }
  }

  async testManualClicking() {
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      try {
        // Click the select to open it
        await requestRegardingSelect.click();
        await this.page.waitForTimeout(1000);
        
        // Try to click the option
        const option = await this.page.$('select[name="Nature_of_request"] option[value="not_offensive"]');
        if (option) {
          await option.click();
          console.log('     ✅ Manual clicking successful');
        } else {
          console.log('     ❌ Option not found for manual clicking');
        }
        
        await this.checkValidationState('After manual clicking');
      } catch (error) {
        console.log(`     ❌ Manual clicking failed: ${error.message}`);
      }
    }
  }

  async testFocusAndKeyboard() {
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      try {
        // Focus the select
        await requestRegardingSelect.focus();
        await this.page.waitForTimeout(500);
        
        // Try to select using keyboard
        await this.page.keyboard.press('ArrowDown');
        await this.page.waitForTimeout(200);
        await this.page.keyboard.press('ArrowDown');
        await this.page.waitForTimeout(200);
        await this.page.keyboard.press('Enter');
        
        console.log('     ✅ Focus and keyboard successful');
        await this.checkValidationState('After focus and keyboard');
      } catch (error) {
        console.log(`     ❌ Focus and keyboard failed: ${error.message}`);
      }
    }
  }

  async checkValidationState(context = '') {
    console.log(`   ✅ Checking validation state ${context}...`);
    
    const validationInfo = await this.page.evaluate(() => {
      // Check form validity
      const forms = document.querySelectorAll('form');
      const formValidity = Array.from(forms).map((form, index) => ({
        index: index + 1,
        valid: form.checkValidity ? form.checkValidity() : 'unknown',
        elements: Array.from(form.elements).map(el => ({
          tagName: el.tagName,
          name: el.name,
          type: el.type,
          valid: el.checkValidity ? el.checkValidity() : 'unknown',
          value: el.value,
          required: el.required
        }))
      }));
      
      // Check for validation messages
      const validationMessages = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.trim();
        return text && (
          text.includes('Please select') ||
          text.includes('required') ||
          text.includes('invalid') ||
          text.includes('error')
        );
      });
      
      return {
        formValidity,
        validationMessages: validationMessages.map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim(),
          visible: el.offsetParent !== null
        }))
      };
    });
    
    console.log(`   Form validity: ${validationInfo.formValidity.length} forms`);
    validationInfo.formValidity.forEach((form, i) => {
      console.log(`     Form ${i + 1}: Valid=${form.valid}`);
      form.elements.forEach(el => {
        if (!el.valid) {
          console.log(`       Invalid element: ${el.tagName}[name="${el.name}"] - Value="${el.value}", Required=${el.required}`);
        }
      });
    });
    
    if (validationInfo.validationMessages.length > 0) {
      console.log(`   ⚠️ Validation messages:`);
      validationInfo.validationMessages.forEach((msg, i) => {
        console.log(`     ${i + 1}. ${msg.tagName}: "${msg.text}" (visible: ${msg.visible})`);
      });
    } else {
      console.log(`   ✅ No validation messages`);
    }
  }
}

// Run the debugger
(async () => {
  const debuggerInstance = new GraffitiValidationDebugger();
  await debuggerInstance.init();
  await debuggerInstance.debugValidationAndProgression();
})();
