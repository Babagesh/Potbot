const { chromium } = require('playwright');

class DropdownInvestigation {
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

  async investigateDropdowns() {
    console.log('🔍 Investigating Dropdown Differences');
    console.log('====================================');

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

      // Investigate both dropdowns thoroughly
      console.log('🔍 Step 8: Investigating both dropdowns...');
      await this.investigateBothDropdowns();

    } catch (error) {
      console.error('❌ Error during investigation:', error.message);
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

  async investigateBothDropdowns() {
    console.log('   🔍 Investigating both dropdowns thoroughly...');
    
    // Get both dropdowns
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    const requestTypeSelect = await this.page.$('select[name="Request_type"]');
    
    if (requestRegardingSelect && requestTypeSelect) {
      console.log('\n   📋 Dropdown 1: Request Regarding (select[name="Nature_of_request"])');
      await this.investigateDropdown(requestRegardingSelect, 'Request Regarding');
      
      console.log('\n   📋 Dropdown 2: Request Type (select[name="Request_type"])');
      await this.investigateDropdown(requestTypeSelect, 'Request Type');
      
      // Compare the two dropdowns
      console.log('\n   🔍 Comparing both dropdowns...');
      await this.compareDropdowns(requestRegardingSelect, requestTypeSelect);
      
      // Test selection on both dropdowns
      console.log('\n   🧪 Testing selection on both dropdowns...');
      await this.testSelectionOnBothDropdowns(requestRegardingSelect, requestTypeSelect);
    }
  }

  async investigateDropdown(selectElement, dropdownName) {
    const dropdownInfo = await selectElement.evaluate((element) => {
      const options = Array.from(element.options);
      
      return {
        // Basic properties
        name: element.name,
        id: element.id,
        className: element.className,
        tagName: element.tagName,
        
        // Visibility and state
        isVisible: element.offsetParent !== null,
        disabled: element.disabled,
        required: element.required,
        
        // Current state
        value: element.value,
        selectedIndex: element.selectedIndex,
        
        // Style properties
        style: {
          display: getComputedStyle(element).display,
          visibility: getComputedStyle(element).visibility,
          opacity: getComputedStyle(element).opacity,
          pointerEvents: getComputedStyle(element).pointerEvents,
          position: getComputedStyle(element).position,
          zIndex: getComputedStyle(element).zIndex
        },
        
        // Options analysis
        options: options.map((option, index) => ({
          index: index,
          value: option.value,
          text: option.textContent?.trim(),
          selected: option.selected,
          disabled: option.disabled,
          style: {
            display: getComputedStyle(option).display,
            visibility: getComputedStyle(option).visibility,
            opacity: getComputedStyle(option).opacity
          }
        })),
        
        // Form context
        form: element.closest('form') ? {
          id: element.closest('form').id,
          className: element.closest('form').className,
          action: element.closest('form').action,
          method: element.closest('form').method
        } : null,
        
        // Parent elements
        parent: element.parentElement ? {
          tagName: element.parentElement.tagName,
          className: element.parentElement.className,
          id: element.parentElement.id
        } : null
      };
    });
    
    console.log(`   Basic Properties:`);
    console.log(`     Name: "${dropdownInfo.name}"`);
    console.log(`     ID: "${dropdownInfo.id}"`);
    console.log(`     Class: "${dropdownInfo.className}"`);
    console.log(`     Visible: ${dropdownInfo.isVisible}`);
    console.log(`     Disabled: ${dropdownInfo.disabled}`);
    console.log(`     Required: ${dropdownInfo.required}`);
    console.log(`     Current Value: "${dropdownInfo.value}"`);
    console.log(`     Selected Index: ${dropdownInfo.selectedIndex}`);
    
    console.log(`   Style Properties:`);
    console.log(`     Display: ${dropdownInfo.style.display}`);
    console.log(`     Visibility: ${dropdownInfo.style.visibility}`);
    console.log(`     Opacity: ${dropdownInfo.style.opacity}`);
    console.log(`     Pointer Events: ${dropdownInfo.style.pointerEvents}`);
    console.log(`     Position: ${dropdownInfo.style.position}`);
    console.log(`     Z-Index: ${dropdownInfo.style.zIndex}`);
    
    console.log(`   Options (${dropdownInfo.options.length}):`);
    dropdownInfo.options.forEach((option, i) => {
      const disabled = option.disabled ? ' (DISABLED)' : '';
      const selected = option.selected ? ' (SELECTED)' : '';
      console.log(`     ${i + 1}. "${option.text}" (value: "${option.value}")${disabled}${selected}`);
      if (option.disabled) {
        console.log(`        Style: display=${option.style.display}, visibility=${option.style.visibility}, opacity=${option.style.opacity}`);
      }
    });
    
    if (dropdownInfo.form) {
      console.log(`   Form Context:`);
      console.log(`     Form ID: "${dropdownInfo.form.id}"`);
      console.log(`     Form Class: "${dropdownInfo.form.className}"`);
      console.log(`     Form Action: "${dropdownInfo.form.action}"`);
      console.log(`     Form Method: "${dropdownInfo.form.method}"`);
    }
    
    if (dropdownInfo.parent) {
      console.log(`   Parent Element:`);
      console.log(`     Parent Tag: ${dropdownInfo.parent.tagName}`);
      console.log(`     Parent Class: "${dropdownInfo.parent.className}"`);
      console.log(`     Parent ID: "${dropdownInfo.parent.id}"`);
    }
  }

  async compareDropdowns(dropdown1, dropdown2) {
    const comparison = await this.page.evaluate((el1, el2) => {
      return {
        dropdown1: {
          name: el1.name,
          id: el1.id,
          className: el1.className,
          disabled: el1.disabled,
          required: el1.required,
          optionsCount: el1.options.length,
          enabledOptionsCount: Array.from(el1.options).filter(opt => !opt.disabled).length
        },
        dropdown2: {
          name: el2.name,
          id: el2.id,
          className: el2.className,
          disabled: el2.disabled,
          required: el2.required,
          optionsCount: el2.options.length,
          enabledOptionsCount: Array.from(el2.options).filter(opt => !opt.disabled).length
        }
      };
    }, dropdown1, dropdown2);
    
    console.log(`   Comparison:`);
    console.log(`     Dropdown 1 (${comparison.dropdown1.name}): ${comparison.dropdown1.optionsCount} options, ${comparison.dropdown1.enabledOptionsCount} enabled`);
    console.log(`     Dropdown 2 (${comparison.dropdown2.name}): ${comparison.dropdown2.optionsCount} options, ${comparison.dropdown2.enabledOptionsCount} enabled`);
    console.log(`     Both disabled: ${comparison.dropdown1.disabled && comparison.dropdown2.disabled}`);
    console.log(`     Both required: ${comparison.dropdown1.required && comparison.dropdown2.required}`);
  }

  async testSelectionOnBothDropdowns(dropdown1, dropdown2) {
    console.log(`   🧪 Testing selection on both dropdowns...`);
    
    // Test Dropdown 1 (Request Regarding) - This one works
    console.log(`\n   Testing Dropdown 1 (Request Regarding)...`);
    try {
      await dropdown1.selectOption({ value: 'not_offensive' });
      console.log(`     ✅ Dropdown 1 selection successful`);
    } catch (error) {
      console.log(`     ❌ Dropdown 1 selection failed: ${error.message}`);
    }
    
    await this.page.waitForTimeout(1000);
    
    // Test Dropdown 2 (Request Type) - This one fails
    console.log(`\n   Testing Dropdown 2 (Request Type)...`);
    try {
      await dropdown2.selectOption({ value: 'building_commercial' });
      console.log(`     ✅ Dropdown 2 selection successful`);
    } catch (error) {
      console.log(`     ❌ Dropdown 2 selection failed: ${error.message}`);
      
      // Try to understand why it failed
      console.log(`     🔍 Analyzing failure...`);
      const failureAnalysis = await dropdown2.evaluate((element) => {
        const targetOption = Array.from(element.options).find(opt => opt.value === 'building_commercial');
        return {
          targetOptionExists: !!targetOption,
          targetOptionDisabled: targetOption ? targetOption.disabled : 'N/A',
          targetOptionText: targetOption ? targetOption.textContent?.trim() : 'N/A',
          allEnabledOptions: Array.from(element.options)
            .filter(opt => !opt.disabled && opt.value)
            .map(opt => ({ value: opt.value, text: opt.textContent?.trim() }))
        };
      });
      
      console.log(`     Target option exists: ${failureAnalysis.targetOptionExists}`);
      console.log(`     Target option disabled: ${failureAnalysis.targetOptionDisabled}`);
      console.log(`     Target option text: "${failureAnalysis.targetOptionText}"`);
      console.log(`     Available enabled options:`);
      failureAnalysis.allEnabledOptions.forEach((opt, i) => {
        console.log(`       ${i + 1}. "${opt.text}" (value: "${opt.value}")`);
      });
    }
  }
}

// Run the investigation
(async () => {
  const investigator = new DropdownInvestigation();
  await investigator.init();
  await investigator.investigateDropdowns();
})();
