const { chromium } = require('playwright');

class SingleGraffitiTester {
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

  async testSingleGraffitiType() {
    console.log('🧪 Testing Single Graffiti Type (Private Property)');
    console.log('=================================================');

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
      console.log('📋 Step 4: Selecting issue type: Graffiti on Private Property...');
      await this.selectIssueTypeJavaScript('Graffiti on Private Property');

      // Click Next to get to location page
      console.log('➡️ Step 5: Clicking Next to get to location page...');
      await this.clickNextToLocationPage();

      // Complete location workflow
      console.log('📍 Step 6: Completing location workflow...');
      await this.completeLocationWorkflow();

      // Click Next to get to request details page
      console.log('➡️ Step 7: Clicking Next to get to request details page...');
      await this.clickNextToRequestDetailsPage();

      // Fill graffiti form fields
      console.log('📝 Step 8: Filling graffiti form fields...');
      await this.fillGraffitiFormFields();

      // Click Next to get to contact information page
      console.log('➡️ Step 9: Clicking Next to get to contact information page...');
      await this.clickNextToContactPage();

      // Handle contact information page
      console.log('👤 Step 10: Handling contact information page...');
      await this.handleContactInformationPage();

      // Handle final submission
      console.log('📤 Step 11: Handling final submission...');
      await this.handleFinalSubmission();

      // Extract service request number and address
      console.log('🔢 Step 12: Extracting service request number and address...');
      const serviceRequestNumber = await this.extractServiceRequestNumber();
      const address = await this.extractRequestAddress();

      console.log('✅ Complete workflow completed successfully!');
      console.log(`📋 Service Request Number: ${serviceRequestNumber}`);
      console.log(`📍 Address: ${address}`);

    } catch (error) {
      console.error('❌ Error during testing:', error.message);
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
    console.log(`   Following exact location workflow...`);
    
    // Find and fill the address field
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Step 1: Enter coordinates
    console.log(`   Step 1: Entering coordinates: 37.755196, -122.423207`);
    await addressField.fill('37.755196, -122.423207');
    await this.page.waitForTimeout(1000);
    
    // Step 2: Click magnifying glass to search
    console.log(`   Step 2: Clicking magnifying glass to search...`);
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked magnifying glass`);
    } else {
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter to search`);
    }
    
    // Step 3: Wait for map to load
    console.log(`   Step 3: Waiting for map to load...`);
    await this.page.waitForTimeout(3000);
    
    // Step 4: Click + button twice to zoom in
    console.log(`   Step 4: Clicking + button twice to zoom in...`);
    await this.clickZoomInButton();
    
    // Step 5: Wait for zoom to complete
    console.log(`   Step 5: Waiting for zoom to complete...`);
    await this.page.waitForTimeout(2000);
    
    // Step 6: Click blue marker or center of map
    console.log(`   Step 6: Clicking blue marker or center of map...`);
    await this.clickMapCenter();
    
    // Step 7: Wait for location field to be populated
    console.log(`   Step 7: Waiting for location field to be populated...`);
    await this.page.waitForTimeout(2000);
    
    // Step 8: Fill location description and press Enter
    console.log(`   Step 8: Filling location description and pressing Enter...`);
    await this.fillLocationDescriptionAndSave('Graffiti spray painted on the side of the building near the main entrance.');
  }

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
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }

  async findSearchButton() {
    const searchButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Search")',
      'button[class*="search"]',
      'div[class*="searchSubmit"]'
    ];
    
    for (const selector of searchButtonSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }

  async clickZoomInButton() {
    const zoomInSelectors = [
      'button:has-text("+")',
      'div:has-text("+")'
    ];
    
    let zoomInButton = null;
    for (const selector of zoomInSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          zoomInButton = element;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (zoomInButton) {
      await zoomInButton.click();
      await this.page.waitForTimeout(500);
      await zoomInButton.click();
      console.log(`   ✅ Clicked zoom in twice`);
    } else {
      console.log(`   ⚠️ Zoom in button not found`);
    }
  }

  async clickMapCenter() {
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
      await this.page.click('body', { position: { x: mapInfo.centerX, y: mapInfo.centerY } });
      console.log(`   ✅ Clicked map center`);
    } else {
      console.log(`   ⚠️ Map SVG not found`);
    }
  }

  async fillLocationDescriptionAndSave(description) {
    const descriptionFieldSelectors = [
      'textarea[placeholder*="description"]',
      'textarea[name*="description"]',
      'textarea'
    ];
    
    for (const selector of descriptionFieldSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.fill(description);
          await element.press('Enter');
          console.log(`   ✅ Filled location description and pressed Enter`);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    console.log(`   ⚠️ Location description field not found`);
  }

  async clickNextToRequestDetailsPage() {
    console.log('   Force clicking Next button using JavaScript...');
    const urlBefore = this.page.url();
    
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
              // All methods failed
            }
          }
        }
      }
      return false;
    });
    
    if (success) {
      console.log('   ✅ Successfully clicked Next button to get to request details page');
      await this.page.waitForTimeout(3000);
    } else {
      throw new Error('Failed to click Next button using JavaScript');
    }
  }

  async clickNextToContactPage() {
    console.log(`   Clicking Next button to proceed to contact page...`);
    
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
              // All methods failed
            }
          }
        }
      }
      return false;
    });
    
    if (success) {
      console.log(`   ✅ Successfully clicked Next button to proceed to contact page!`);
      await this.page.waitForTimeout(3000);
    } else {
      throw new Error('Failed to click Next button using JavaScript');
    }
  }

  async fillGraffitiFormFields() {
    console.log(`   Filling graffiti-specific form fields...`);
    
    // Step 1: Fill "What is your request regarding?" dropdown
    console.log(`   Step 1: Filling request regarding dropdown...`);
    await this.fillRequestRegardingDropdown();

    // Wait for form to process the first dropdown selection
    console.log(`   ⏳ Waiting for form to process first dropdown selection...`);
    await this.page.waitForTimeout(2000);

    // Step 2: Fill "Request Type" dropdown
    console.log(`   Step 2: Filling request type dropdown...`);
    await this.fillRequestTypeDropdown();

    // Step 3: Fill request description
    console.log(`   Step 3: Filling request description...`);
    await this.fillRequestDescription();

    // Step 4: Upload image
    console.log(`   Step 4: Uploading image...`);
    await this.uploadImage();

    console.log(`   ✅ Graffiti form fields completed`);
  }

  async fillRequestRegardingDropdown() {
    const dropdownSelector = 'select[name="Nature_of_request"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found request regarding dropdown: ${dropdownSelector}`);
      await this.handleSelectDropdown(dropdownElement, 'Not Offensive (no racial slurs or profanity)', 'requestRegarding');
    } else {
      console.log(`   ⚠️ Request regarding dropdown not found`);
    }
  }

  async fillRequestTypeDropdown() {
    const dropdownSelector = 'select[name="Request_type"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found request type dropdown: ${dropdownSelector}`);
      await this.handleSelectDropdown(dropdownElement, 'Building - Commercial', 'requestType');
    } else {
      console.log(`   ⚠️ Request type dropdown not found`);
    }
  }

  async handleSelectDropdown(selectElement, value, fieldType) {
    console.log(`   Handling ${fieldType} dropdown...`);
    
    // Get all options first for logging
    const options = await selectElement.evaluate(el => {
      return Array.from(el.options).map(option => ({
        value: option.value,
        text: option.textContent?.trim()
      }));
    });
    
    console.log(`   Found ${options.length} options:`);
    options.forEach((option, i) => {
      console.log(`     ${i + 1}. "${option.text}" (value: "${option.value}")`);
    });
    
    // Find matching option
    const matchingOption = options.find(option => 
      option.text === value || 
      option.value === value ||
      option.text.toLowerCase().includes(value.toLowerCase())
    );
    
    if (matchingOption) {
      try {
        console.log(`   Using Playwright selectOption for: "${matchingOption.text}" (value: "${matchingOption.value}")`);
        await selectElement.selectOption({ value: matchingOption.value });
        console.log(`   ✅ Selected option via Playwright selectOption: "${matchingOption.text}"`);
        
        // Wait a moment for the form to process the selection
        await this.page.waitForTimeout(1000);
        
        // Verify the selection was successful
        const currentValue = await selectElement.evaluate(el => el.value);
        const currentText = await selectElement.evaluate(el => {
          const selectedOption = Array.from(el.options).find(opt => opt.value === el.value);
          return selectedOption ? selectedOption.textContent?.trim() : '';
        });
        
        console.log(`   ✅ Verification - Current value: "${currentValue}", Current text: "${currentText}"`);
        
      } catch (selectError) {
        console.log(`   ❌ Playwright selectOption failed: ${selectError.message}`);
        
        // Fallback to JavaScript method
        try {
          console.log(`   Attempting JavaScript fallback...`);
          await selectElement.evaluate((element, value) => {
            element.value = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
            
            if (element.checkValidity) {
              element.checkValidity();
            }
            
            const form = element.closest('form');
            if (form && form.checkValidity) {
              form.checkValidity();
            }
          }, matchingOption.value);
          
          console.log(`   ✅ JavaScript fallback successful`);
        } catch (jsError) {
          console.log(`   ❌ JavaScript fallback failed: ${jsError.message}`);
        }
      }
    } else {
      console.log(`   ⚠️ No matching option found for: ${value}`);
    }
  }

  async fillRequestDescription() {
    const descriptionField = await this.page.$('textarea[name="Request_description"]');
    if (descriptionField) {
      await descriptionField.fill('Graffiti spray painted on the side of the building near the main entrance.');
      await descriptionField.press('Enter');
      console.log(`   ✅ Filled request description`);
    } else {
      console.log(`   ⚠️ Request description field not found`);
    }
  }

  async uploadImage() {
    const fileUploadSelector = 'input[name="File_attach[]"]';
    const fileUploadElement = await this.page.$(fileUploadSelector);
    
    if (fileUploadElement) {
      await fileUploadElement.setInputFiles('scripts/sf-forms/sample-pothole-image.jpg');
      console.log(`   ✅ Uploaded image file`);
    } else {
      console.log(`   ⚠️ File upload field not found with selector: ${fileUploadSelector}`);
    }
  }

  async handleContactInformationPage() {
    console.log('   Handling contact information page...');
    
    // Select "No, I want to remain anonymous"
    const anonymousRadio = await this.page.$('input[type="radio"][value="anonymous"]');
    if (anonymousRadio) {
      await anonymousRadio.click();
      console.log('   ✅ Selected anonymous option');
    } else {
      // Try to find by text content
      await this.page.evaluate(() => {
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const anonymousRadio = radios.find(radio => {
          const text = radio.nextElementSibling?.textContent?.trim() || '';
          return text.toLowerCase().includes('remain anonymous') || 
                 text.toLowerCase().includes('no, i want to remain anonymous');
        });
        
        if (anonymousRadio) {
          anonymousRadio.checked = true;
          anonymousRadio.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('   ✅ Selected anonymous option via JavaScript');
        }
      });
    }
    
    // Click "Report Anonymously" button
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      const reportButton = buttons.find(btn => {
        const text = btn.textContent?.trim() || btn.value || '';
        return text.toLowerCase().includes('report anonymously') || 
               text.toLowerCase().includes('submit');
      });
      
      if (reportButton) {
        reportButton.click();
        console.log('   ✅ Clicked Report Anonymously button');
      }
    });
    
    await this.page.waitForTimeout(2000);
  }

  async handleFinalSubmission() {
    console.log('   Handling final submission...');
    
    // Scroll to bottom
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await this.page.waitForTimeout(1000);
    
    // Click Submit button
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      const submitButton = buttons.find(btn => {
        const text = btn.textContent?.trim() || btn.value || '';
        return text.toLowerCase().includes('submit');
      });
      
      if (submitButton) {
        submitButton.click();
        console.log('   ✅ Clicked Submit button');
      }
    });
    
    await this.page.waitForTimeout(3000);
  }

  async extractServiceRequestNumber() {
    const pageContent = await this.page.textContent('body');
    const serviceRequestRegex = /service request number[:\s]*([A-Z0-9-]+)/i;
    const match = pageContent.match(serviceRequestRegex);
    
    if (match) {
      return match[1];
    }
    
    // Fallback patterns
    const fallbackPatterns = [
      /request number[:\s]*([A-Z0-9-]+)/i,
      /reference number[:\s]*([A-Z0-9-]+)/i,
      /case number[:\s]*([A-Z0-9-]+)/i
    ];
    
    for (const pattern of fallbackPatterns) {
      const fallbackMatch = pageContent.match(pattern);
      if (fallbackMatch) {
        return fallbackMatch[1];
      }
    }
    
    return 'Not found';
  }

  async extractRequestAddress() {
    const addressSelectors = [
      'input[name*="address"]',
      'input[name*="location"]',
      'textarea[name*="address"]',
      'textarea[name*="location"]'
    ];
    
    for (const selector of addressSelectors) {
      const element = await this.page.$(selector);
      if (element) {
        const value = await element.inputValue();
        if (value && value.trim()) {
          return value.trim();
        }
      }
    }
    
    return 'Not found';
  }
}

// Run the single test
(async () => {
  const tester = new SingleGraffitiTester();
  await tester.init();
  await tester.testSingleGraffitiType();
})();
