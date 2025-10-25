const { chromium } = require('playwright');

class GraffitiValidationDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 
    });
    this.page = await this.browser.newPage();
  }

  async debugValidationIssue() {
    console.log('🔍 Debugging Graffiti Form Validation Issue');
    console.log('==========================================');

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

      // Debug the request details page and test different dropdown selection methods
      console.log('📝 Step 8: Testing dropdown selection methods...');
      await this.testDropdownSelectionMethods();

    } catch (error) {
      console.error('❌ Error during debugging:', error.message);
    } finally {
      await this.browser.close();
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

  async testDropdownSelectionMethods() {
    console.log('   🔍 Testing different dropdown selection methods...');
    
    // Method 1: Current JavaScript method
    console.log('\n   📋 Method 1: Current JavaScript method');
    await this.testMethod1();
    
    // Method 2: Playwright selectOption method
    console.log('\n   📋 Method 2: Playwright selectOption method');
    await this.testMethod2();
    
    // Method 3: Enhanced JavaScript with more events
    console.log('\n   📋 Method 3: Enhanced JavaScript with more events');
    await this.testMethod3();
    
    // Method 4: Direct DOM manipulation
    console.log('\n   📋 Method 4: Direct DOM manipulation');
    await this.testMethod4();
  }

  async testMethod1() {
    console.log('     Testing current JavaScript method...');
    
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      const result = await requestRegardingSelect.evaluate((element) => {
        element.value = 'not_offensive';
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return {
          value: element.value,
          selectedIndex: element.selectedIndex,
          selectedOptionText: element.options[element.selectedIndex]?.textContent?.trim()
        };
      });
      
      console.log(`     Result: value="${result.value}", selectedIndex=${result.selectedIndex}, text="${result.selectedOptionText}"`);
      
      // Check for validation messages
      await this.checkValidationMessages('Method 1');
    }
  }

  async testMethod2() {
    console.log('     Testing Playwright selectOption method...');
    
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      try {
        await requestRegardingSelect.selectOption({ value: 'not_offensive' });
        console.log('     ✅ Playwright selectOption successful');
        
        // Check for validation messages
        await this.checkValidationMessages('Method 2');
      } catch (error) {
        console.log(`     ❌ Playwright selectOption failed: ${error.message}`);
      }
    }
  }

  async testMethod3() {
    console.log('     Testing enhanced JavaScript with more events...');
    
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      const result = await requestRegardingSelect.evaluate((element) => {
        // Set the value
        element.value = 'not_offensive';
        
        // Dispatch multiple events
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('focus', { bubbles: true }));
        
        // Trigger validation
        if (element.checkValidity) {
          element.checkValidity();
        }
        
        return {
          value: element.value,
          selectedIndex: element.selectedIndex,
          selectedOptionText: element.options[element.selectedIndex]?.textContent?.trim(),
          validity: element.validity ? {
            valid: element.validity.valid,
            valueMissing: element.validity.valueMissing
          } : null
        };
      });
      
      console.log(`     Result: value="${result.value}", selectedIndex=${result.selectedIndex}, text="${result.selectedOptionText}"`);
      if (result.validity) {
        console.log(`     Validity: valid=${result.validity.valid}, valueMissing=${result.validity.valueMissing}`);
      }
      
      // Check for validation messages
      await this.checkValidationMessages('Method 3');
    }
  }

  async testMethod4() {
    console.log('     Testing direct DOM manipulation...');
    
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      const result = await requestRegardingSelect.evaluate((element) => {
        // Find the option
        const option = Array.from(element.options).find(opt => opt.value === 'not_offensive');
        if (option) {
          // Set selectedIndex
          element.selectedIndex = option.index;
          
          // Dispatch events
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          
          return {
            value: element.value,
            selectedIndex: element.selectedIndex,
            selectedOptionText: option.textContent?.trim()
          };
        }
        return null;
      });
      
      if (result) {
        console.log(`     Result: value="${result.value}", selectedIndex=${result.selectedIndex}, text="${result.selectedOptionText}"`);
      } else {
        console.log('     ❌ Option not found');
      }
      
      // Check for validation messages
      await this.checkValidationMessages('Method 4');
    }
  }

  async checkValidationMessages(methodName) {
    console.log(`     Checking validation messages after ${methodName}...`);
    
    const validationInfo = await this.page.evaluate(() => {
      // Look for validation messages
      const validationMessages = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.trim();
        return text && (
          text.includes('Please select') ||
          text.includes('required') ||
          text.includes('invalid') ||
          text.includes('error')
        );
      });
      
      return validationMessages.map(el => ({
        tagName: el.tagName,
        text: el.textContent?.trim(),
        className: el.className,
        style: {
          color: getComputedStyle(el).color,
          display: getComputedStyle(el).display,
          visibility: getComputedStyle(el).visibility
        }
      }));
    });
    
    if (validationInfo.length > 0) {
      console.log(`     ⚠️ Found ${validationInfo.length} validation messages:`);
      validationInfo.forEach((msg, i) => {
        console.log(`       ${i + 1}. ${msg.tagName}: "${msg.text}" (color: ${msg.style.color})`);
      });
    } else {
      console.log(`     ✅ No validation messages found`);
    }
  }
}

// Run the debugger
(async () => {
  const debuggerInstance = new GraffitiValidationDebugger();
  await debuggerInstance.init();
  await debuggerInstance.debugValidationIssue();
})();
