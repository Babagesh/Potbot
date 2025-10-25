const { chromium } = require('playwright');

class GraffitiDropdownDebugger {
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

  async debugDynamicDropdowns() {
    console.log('🔍 Debugging Dynamic Dropdowns in Graffiti Form');
    console.log('===============================================');

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

      // Test each issue type and see dropdown options
      const issueTypes = [
        'Graffiti on Private Property',
        'Graffiti on Public Property', 
        'Illegal Postings on Public Property'
      ];

      for (const issueType of issueTypes) {
        console.log(`\n📋 Testing Issue Type: ${issueType}`);
        console.log('='.repeat(50));
        
        await this.testIssueType(issueType);
        await this.page.waitForTimeout(2000);
      }

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

  async testIssueType(issueType) {
    const issueTypeMapping = {
      'Graffiti on Private Property': 'graffiti_private',
      'Graffiti on Public Property': 'graffiti_public',
      'Illegal Postings on Public Property': 'illegal_postings'
    };
    
    const mappedValue = issueTypeMapping[issueType];
    
    // Select the issue type
    console.log(`   Selecting: ${issueType} (${mappedValue})`);
    await this.page.evaluate((value) => {
      const radioButton = document.querySelector(`input[type="radio"][value="${value}"]`);
      if (radioButton) {
        radioButton.checked = true;
        radioButton.dispatchEvent(new Event('change', { bubbles: true }));
        radioButton.dispatchEvent(new Event('input', { bubbles: true }));
        radioButton.dispatchEvent(new Event('click', { bubbles: true }));
        console.log(`   ✅ Selected issue type: ${value}`);
      } else {
        console.log(`   ❌ Radio button not found for: ${value}`);
      }
    }, mappedValue);
    
    await this.page.waitForTimeout(1000);
    
    // Check if Next button is now visible
    const nextButtonInfo = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      const nextButtons = buttons.filter(button => 
        /next|continue|proceed/i.test(button.textContent?.trim() || button.value || '')
      );
      
      if (nextButtons.length > 0) {
        const button = nextButtons[0];
        return {
          found: true,
          text: button.textContent?.trim() || button.value || '',
          visible: button.offsetParent !== null,
          disabled: button.disabled,
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
      console.log(`   ✅ Next button found: "${nextButtonInfo.text}"`);
      console.log(`   Visible: ${nextButtonInfo.visible}`);
      console.log(`   Disabled: ${nextButtonInfo.disabled}`);
      console.log(`   Style: display=${nextButtonInfo.style.display}, visibility=${nextButtonInfo.style.visibility}, opacity=${nextButtonInfo.style.opacity}`);
      
      if (nextButtonInfo.visible && !nextButtonInfo.disabled) {
        console.log(`   🖱️ Clicking Next button...`);
        const clicked = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
          const nextButtons = buttons.filter(button => 
            /next|continue|proceed/i.test(button.textContent?.trim() || button.value || '')
          );
          
          if (nextButtons.length > 0) {
            try {
              nextButtons[0].click();
              return true;
            } catch (error) {
              console.log(`   ❌ Click failed: ${error.message}`);
              return false;
            }
          }
          return false;
        });
        
        if (clicked) {
          console.log(`   ✅ Successfully clicked Next button`);
          await this.page.waitForTimeout(3000);
          
          // Now check the dropdown options on the next page
          await this.checkDropdownOptions(issueType);
          
          // Go back to test next issue type
          await this.page.goBack();
          await this.page.waitForTimeout(2000);
        } else {
          console.log(`   ❌ Failed to click Next button`);
        }
      } else {
        console.log(`   ⚠️ Next button not clickable`);
      }
    } else {
      console.log(`   ❌ No Next button found`);
    }
  }

  async checkDropdownOptions(issueType) {
    console.log(`   📋 Checking dropdown options for: ${issueType}`);
    
    const dropdownInfo = await this.page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const results = [];
      
      selects.forEach((select, index) => {
        if (select.offsetParent !== null) { // Only visible selects
          results.push({
            index: index + 1,
            name: select.name,
            id: select.id,
            options: Array.from(select.options).map(option => ({
              value: option.value,
              text: option.textContent?.trim()
            })).filter(option => option.value && option.text) // Filter out empty options
          });
        }
      });
      
      return results;
    });
    
    console.log(`   Found ${dropdownInfo.length} visible dropdowns:`);
    dropdownInfo.forEach((dropdown, i) => {
      console.log(`     Dropdown ${i + 1}: Name="${dropdown.name}", ID="${dropdown.id}"`);
      console.log(`     Options (${dropdown.options.length}):`);
      dropdown.options.forEach((option, j) => {
        console.log(`       ${j + 1}. "${option.text}" (value: "${option.value}")`);
      });
    });
    
    // Map the expected options based on issue type
    const expectedOptions = this.getExpectedOptions(issueType);
    console.log(`   Expected options for ${issueType}:`);
    expectedOptions.forEach((option, i) => {
      console.log(`     ${i + 1}. ${option}`);
    });
  }

  getExpectedOptions(issueType) {
    switch (issueType) {
      case 'Graffiti on Private Property':
        return [
          'Sidewalk in front of property',
          'Building - Commercial', 
          'Building - Residential',
          'Building - Other'
        ];
      case 'Graffiti on Public Property':
        return [
          'ATT Property',
          'Bike Rack',
          'Bridge', 
          'City receptacle',
          'Fire/ Police Call Box',
          'Fire hydrant',
          'Mail box',
          'News rack',
          'Parking meter',
          'Pay phone',
          'Pole',
          'Sidewalk structure',
          'Signal box',
          'Street',
          'Transit Shelter/ Platform',
          'Other - enter additional details'
        ];
      case 'Illegal Postings on Public Property':
        return [
          'Affixed Improperly',
          'Multiple Postings',
          'No Posting Date',
          'Posted on Direction Sign',
          'Posted on Historic Street Light',
          'Posted on Traffic Light',
          'Posted Over 70 Days',
          'Posting Too High on Pole',
          'Posting Too Large in Size'
        ];
      default:
        return [];
    }
  }
}

// Run the debugger
(async () => {
  const debuggerInstance = new GraffitiDropdownDebugger();
  await debuggerInstance.init();
  await debuggerInstance.debugDynamicDropdowns();
})();
