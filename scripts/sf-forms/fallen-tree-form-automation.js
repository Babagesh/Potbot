const { chromium } = require('playwright');

class FallenTreeFormAutomation {
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

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Submit a fallen tree report with the provided form data
   */
  async submitFallenTreeReport(formData) {
    console.log('🌳 Starting Fallen Tree Form Automation');
    console.log('==========================================');

    try {
      // Step 1: Navigate to fallen tree form
      console.log('🌐 Step 1: Navigating to fallen tree form...');
      await this.page.goto('https://www.sf.gov/report-damaged-or-fallen-tree', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });

      // Step 2: Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
      await this.clickReportButton();

      // Step 3: Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      await this.handleEmergencyDisclaimer();

      // Step 4: Select issue type (if needed)
      console.log('📋 Step 4: Selecting issue type...');
      await this.selectIssueTypeAndDetectForm(formData);

      // Step 5: Click Next to get to location page
      console.log('➡️ Step 5: Clicking Next to get to location page...');
      await this.clickNextToLocationPage();

      // Step 6: Complete location workflow
      console.log('📍 Step 6: Completing location workflow...');
      await this.completeLocationWorkflow(formData);

      // Step 7: Force click Next button to move to request details page
      console.log('➡️ Step 7: Force clicking Next button using JavaScript...');
      await this.forceNextButtonClick();

      // Step 8: Handle the fallen tree-specific form fields
      console.log('📝 Step 8: Handling fallen tree form fields...');
      await this.handleFallenTreeFormFields(formData);

      // Step 9: Click Next to get to contact information page
      console.log('➡️ Step 9: Clicking Next to get to contact information page...');
      await this.clickNextToContactPage();

      // Step 10: Handle contact information page
      console.log('👤 Step 10: Handling contact information page...');
      await this.handleContactInformationPage();

      // Step 11: Handle final submission
      console.log('📤 Step 11: Handling final submission...');
      await this.handleFinalSubmission();

      // Step 12: Extract service request number and address
      console.log('🔢 Step 12: Extracting service request number and address...');
      const serviceRequestNumber = await this.extractServiceRequestNumber();
      const address = await this.extractRequestAddress();

      console.log('✅ Fallen Tree Form Automation Completed Successfully!');
      console.log(`📋 Service Request Number: ${serviceRequestNumber}`);
      console.log(`📍 Address: ${address}`);

      return {
        success: true,
        serviceRequestNumber: serviceRequestNumber,
        address: address,
        issueType: formData.requestRegarding,
        requestType: formData.requestType
      };

    } catch (error) {
      console.error('❌ Error during fallen tree form automation:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Click the Report button on the fallen tree page
   */
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

  /**
   * Handle the emergency disclaimer page
   */
  async handleEmergencyDisclaimer() {
    await this.page.waitForTimeout(2000);
    
    const nextButton = await this.page.$('button:has-text("Next")');
    if (nextButton) {
      await nextButton.click();
      console.log('   ✅ Clicked Next on emergency disclaimer');
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Select issue type and detect form type
   */
  async selectIssueTypeAndDetectForm(formData) {
    console.log(`   Selecting issue type: ${formData.requestRegarding}`);
    
    // For fallen tree forms, the issue type might be pre-selected or need selection
    // Let's check if there are radio buttons to select
    const radioButtons = await this.page.$$('input[type="radio"]');
    
    if (radioButtons.length > 0) {
      // There are radio buttons, so we need to select one
      await this.selectIssueTypeJavaScript(formData.requestRegarding);
    } else {
      // No radio buttons, issue type might be pre-selected
      console.log('   ✅ Issue type appears to be pre-selected');
    }
  }

  /**
   * Select issue type using JavaScript (for hidden radio buttons)
   */
  async selectIssueTypeJavaScript(issueType) {
    const issueTypeMapping = {
      'Damaged Tree': 'damaged_tree',
      'Damaging Property': 'damaging_property',
      'Landscaping': 'landscaping',
      'Overgrown Tree': 'overgrown_tree',
      'Other': 'other'
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

  /**
   * Click Next button to get to location input page
   */
  async clickNextToLocationPage() {
    console.log(`   Clicking Next button to get to location input page...`);
    
    // Use JavaScript to force click Next button
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
      console.log(`   ✅ Successfully clicked Next button to get to location page!`);
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      console.log(`   🌐 Current URL after Next click: ${currentUrl}`);
    } else {
      throw new Error('Failed to click Next button using JavaScript');
    }
  }

  /**
   * Complete location workflow (same as other forms)
   */
  async completeLocationWorkflow(formData) {
    console.log(`   Following exact location workflow...`);
    
    // Find and fill the address field
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Step 1: Enter coordinates
    console.log(`   Step 1: Entering coordinates: ${formData.coordinates}`);
    await addressField.fill(formData.coordinates);
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
    await this.fillLocationDescriptionAndSave(formData.locationDescription);
  }

  /**
   * Force Next button click using JavaScript
   */
  async forceNextButtonClick() {
    console.log(`   Force clicking Next button using JavaScript...`);
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
      console.log(`   ✅ Successfully clicked Next button to get to request details page`);
      await this.page.waitForTimeout(3000);
      
      const urlAfter = this.page.url();
      if (urlAfter !== urlBefore) {
        console.log(`   🌐 URL changed from ${urlBefore} to ${urlAfter}`);
      } else {
        console.log(`   ⚠️ URL didn't change - still on same page`);
      }
    } else {
      console.log(`   ❌ JavaScript click failed`);
      throw new Error('Failed to click Next button using JavaScript');
    }
  }

  /**
   * Handle fallen tree-specific form fields
   */
  async handleFallenTreeFormFields(formData) {
    console.log(`   Filling fallen tree-specific form fields...`);
    
    // Step 1: Fill "What is your request regarding?" dropdown
    console.log(`   Step 1: Filling request regarding dropdown...`);
    await this.fillRequestRegardingDropdown(formData);
    
    // Wait for form to process the first dropdown selection and check if second dropdown options become enabled
    console.log(`   ⏳ Waiting for form to process first dropdown selection...`);
    await this.page.waitForTimeout(2000);
    
    // Check if the second dropdown options are enabled
    console.log(`   🔍 Checking if second dropdown options are enabled...`);
    const requestTypeSelect = await this.page.$('select[name="Request_type"]');
    if (requestTypeSelect) {
      const enabledOptions = await requestTypeSelect.evaluate((element) => {
        return Array.from(element.options)
          .filter(opt => !opt.disabled && opt.value)
          .map(opt => ({ value: opt.value, text: opt.textContent?.trim() }));
      });

      console.log(`   Found ${enabledOptions.length} enabled options:`);
      enabledOptions.forEach((option, i) => {
        console.log(`     ${i + 1}. "${option.text}" (value: "${option.value}")`);
      });
    }

    // Step 2: Fill "Request Type" dropdown
    console.log(`   Step 2: Filling request type dropdown...`);
    await this.fillRequestTypeDropdown(formData);
    
    // Step 3: Fill request description
    console.log(`   Step 3: Filling request description...`);
    await this.fillRequestDescription(formData);
    
    // Step 4: Upload image
    console.log(`   Step 4: Uploading image...`);
    await this.uploadImage(formData.imagePath);
    
    console.log(`   ✅ Fallen tree form fields completed`);
    
    // Step 5: Click Next button to proceed to contact information page
    console.log(`   Step 5: Clicking Next button to proceed to contact page...`);
    await this.clickNextToContactPage();
  }

  /**
   * Fill "What is your request regarding?" dropdown
   * This dropdown changes based on the issue type selected
   */
  async fillRequestRegardingDropdown(formData) {
    console.log(`   Filling request regarding: ${formData.requestRegarding}`);
    
    const dropdownSelector = 'select[name="Nature_of_request"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found request regarding dropdown: ${dropdownSelector}`);
      
      // Map the request regarding based on issue type
      const mappedValue = this.mapRequestRegarding(formData.requestRegarding);
      await this.handleSelectDropdown(dropdownElement, mappedValue, 'requestRegarding');
    } else {
      console.log(`   ⚠️ Request regarding dropdown not found with selector: ${dropdownSelector}`);
    }
  }

  /**
   * Fill "Request Type" dropdown
   * This dropdown changes based on the first dropdown selection
   */
  async fillRequestTypeDropdown(formData) {
    console.log(`   Filling request type: ${formData.requestType}`);
    
    const dropdownSelector = 'select[name="Request_type"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found request type dropdown: ${dropdownSelector}`);
      
      // Get enabled options first
      const enabledOptions = await dropdownElement.evaluate((element) => {
        return Array.from(element.options)
          .filter(opt => !opt.disabled && opt.value)
          .map(opt => ({ value: opt.value, text: opt.textContent?.trim() }));
      });
      
      console.log(`   Available enabled options: ${enabledOptions.length}`);
      
      // Map the request type based on the request regarding
      const mappedValue = this.mapRequestType(formData.requestRegarding, formData.requestType);
      
      // Check if target option is enabled
      const targetOption = enabledOptions.find(opt => 
        opt.text === formData.requestType || 
        opt.value === mappedValue ||
        opt.text.toLowerCase().includes(formData.requestType.toLowerCase())
      );
      
      if (targetOption) {
        console.log(`   ✅ Target option is enabled: "${formData.requestType}"`);
        await this.handleSelectDropdown(dropdownElement, mappedValue, 'requestType');
      } else {
        console.log(`   ⚠️ Target option not enabled, selecting first available option`);
        if (enabledOptions.length > 0) {
          await this.handleSelectDropdown(dropdownElement, enabledOptions[0].value, 'requestType');
        }
      }
    } else {
      console.log(`   ⚠️ Request type dropdown not found with selector: ${dropdownSelector}`);
    }
  }

  /**
   * Map request regarding to form values
   */
  mapRequestRegarding(requestRegarding) {
    const mapping = {
      'Damaged Tree': 'damaged_tree',
      'Damaging Property': 'damaging_property',
      'Landscaping': 'landscaping',
      'Overgrown Tree': 'overgrown_tree',
      'Other': 'other'
    };
    
    return mapping[requestRegarding] || requestRegarding.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Map request type to form values based on request regarding
   */
  mapRequestType(requestRegarding, requestType) {
    const mappings = {
      'Damaged Tree': {
        'Damaged Tree': 'damaged_tree',
        'About to fall': 'about_to_fall',
        'Vandalized Tree': 'vandalized_tree',
        'Dead tree': 'dead_tree',
        'Fallen tree': 'fallen_tree',
        'Hanging limb': 'hanging_limb',
        'Other - Enter Details': 'other'
      },
      'Damaging Property': {
        'Hitting window or building': 'hitting_window_building',
        'Lifted sidewalk - tree roots': 'lifted_sidewalk_tree_roots',
        'Property damage': 'property_damage',
        'Sewer damage - tree roots': 'sewer_damage_tree_roots',
        'Other - Enter Details': 'other'
      },
      'Landscaping': {
        'Backfill tree basin': 'backfill_tree_basin',
        'Empty tree basin': 'empty_tree_basin',
        'Lawn mowing': 'lawn_mowing',
        'Remove garden debris': 'remove_garden_debris',
        'Remove tree suckers': 'remove_tree_suckers',
        'Request water meter': 'request_water_meter',
        'Restake tree': 'restake_tree',
        'Shrubbery blocking visibility': 'shrubbery_blocking_visibility',
        'Sprinkler system issues': 'sprinkler_system_issues',
        'Vacant lot weeding': 'vacant_lot_weeding',
        'Weeding': 'weeding',
        'Other - Enter Details': 'other'
      },
      'Overgrown Tree': {
        'Blocking sidewalk': 'blocking_sidewalk',
        'Blocking signs': 'blocking_signs',
        'Blocking street lights': 'blocking_street_lights',
        'Blocking traffic signal': 'blocking_traffic_signal',
        'Near communication line': 'near_communication_line',
        'Pruning request': 'pruning_request',
        'Other - Enter Details': 'other'
      },
      'Other': {
        'N/A': 'na'
      }
    };
    
    const requestMapping = mappings[requestRegarding];
    if (requestMapping) {
      return requestMapping[requestType] || requestType.toLowerCase().replace(/\s+/g, '_');
    }
    
    return requestType.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Handle dropdown selection with robust error handling
   */
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
        
        // Use Playwright's selectOption method which should handle form validation properly
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
      // Select first non-empty option as fallback
      const firstOption = options.find(opt => opt.value && opt.text);
      if (firstOption) {
        try {
          console.log(`   Attempting fallback selection for: "${firstOption.text}"`);
          await selectElement.selectOption({ value: firstOption.value });
          console.log(`   ✅ Selected first option as fallback: "${firstOption.text}"`);
        } catch (error) {
          console.log(`   ❌ Fallback selection failed: ${error.message}`);
        }
      }
    }
  }

  /**
   * Fill request description
   */
  async fillRequestDescription(formData) {
    const descriptionField = await this.page.$('textarea[name="Request_description"]');
    if (descriptionField) {
      await descriptionField.fill(formData.requestDescription);
      await descriptionField.press('Enter');
      console.log(`   ✅ Filled request description`);
    } else {
      console.log(`   ⚠️ Request description field not found`);
    }
  }

  /**
   * Upload image file
   */
  async uploadImage(imagePath) {
    const fileUploadSelector = 'input[name="File_attach[]"]';
    const fileUploadElement = await this.page.$(fileUploadSelector);
    
    if (fileUploadElement) {
      await fileUploadElement.setInputFiles(imagePath);
      console.log(`   ✅ Uploaded image file`);
    } else {
      console.log(`   ⚠️ File upload field not found with selector: ${fileUploadSelector}`);
    }
  }

  /**
   * Click Next button to proceed to contact page
   */
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

  /**
   * Handle contact information page
   */
  async handleContactInformationPage() {
    console.log(`   Handling contact information page...`);
    
    await this.page.waitForTimeout(2000);
    
    // Debug: Check what's on the page
    console.log('   🔍 Debugging contact information page...');
    
    // Get page title and URL
    const title = await this.page.title();
    const url = this.page.url();
    console.log(`   📄 Page Title: ${title}`);
    console.log(`   🌐 Page URL: ${url}`);
    
    // Find all radio buttons
    const radioButtons = await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      return radios.map(radio => ({
        id: radio.id,
        name: radio.name,
        value: radio.value,
        checked: radio.checked,
        text: radio.nextElementSibling?.textContent?.trim() || '',
        visible: radio.offsetParent !== null
      }));
    });
    
    console.log(`   📻 Found ${radioButtons.length} radio buttons:`);
    radioButtons.forEach((radio, i) => {
      console.log(`     ${i + 1}. ID: "${radio.id}", Name: "${radio.name}", Value: "${radio.value}"`);
      console.log(`        Text: "${radio.text}", Checked: ${radio.checked}, Visible: ${radio.visible}`);
    });
    
    // Find all buttons
    const buttons = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      return buttons.map(btn => ({
        text: btn.textContent?.trim() || btn.value || '',
        type: btn.type,
        visible: btn.offsetParent !== null,
        disabled: btn.disabled
      }));
    });
    
    console.log(`   🔘 Found ${buttons.length} buttons:`);
    buttons.forEach((btn, i) => {
      console.log(`     ${i + 1}. Text: "${btn.text}", Type: "${btn.type}", Visible: ${btn.visible}, Disabled: ${btn.disabled}`);
    });
    
    // Select "No, I want to remain anonymous" - uncheck Yes first, then select No
    console.log('   🔍 Selecting anonymous option...');
    await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      
      // First uncheck the "Yes" option
      const yesRadio = radios.find(radio => 
        radio.name === 'rad_contact_info' && radio.value === 'true'
      );
      if (yesRadio) {
        yesRadio.checked = false;
        yesRadio.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('   ✅ Unchecked Yes option');
      }
      
      // Then select the "No" option
      const noRadio = radios.find(radio => 
        radio.name === 'rad_contact_info' && radio.value === 'false'
      );
      
      if (noRadio) {
        noRadio.checked = true;
        noRadio.dispatchEvent(new Event('change', { bubbles: true }));
        noRadio.dispatchEvent(new Event('click', { bubbles: true }));
        console.log('   ✅ Selected No, I want to remain anonymous');
      } else {
        console.log('   ⚠️ Anonymous radio button not found');
      }
    });
    
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
      } else {
        console.log('   ⚠️ Report Anonymously button not found');
      }
    });
    
    await this.page.waitForTimeout(2000);
    
    // Check if there's a final Next button after Report Anonymously
    const finalNextClicked = await this.page.evaluate(() => {
      const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .filter(el => {
          const text = el.textContent?.trim() || el.value || '';
          return /next|continue|proceed/i.test(text);
        });
      
      if (nextButtons.length > 0) {
        const nextButton = nextButtons[0];
        nextButton.click();
        console.log('   ✅ Clicked final Next button');
        return true;
      }
      return false;
    });
    
    if (finalNextClicked) {
      console.log(`   ✅ Successfully clicked final Next button`);
      await this.page.waitForTimeout(5000);
    }
  }

  /**
   * Handle final submission
   */
  async handleFinalSubmission() {
    console.log(`   Handling final submission...`);
    
    // Scroll to bottom
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await this.page.waitForTimeout(1000);
    
    // Look for Submit button using JavaScript
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      const submitButton = buttons.find(btn => {
        const text = btn.textContent?.trim() || btn.value || '';
        return text.toLowerCase().includes('submit');
      });
      
      if (submitButton) {
        submitButton.click();
        console.log('   ✅ Clicked Submit button via JavaScript');
        return true;
      } else {
        console.log('   ⚠️ Submit button not found');
        return false;
      }
    });
    
    await this.page.waitForTimeout(3000);
  }

  /**
   * Extract service request number from the final page
   */
  async extractServiceRequestNumber() {
    console.log('   Extracting service request number...');
    
    const pageContent = await this.page.textContent('body');
    
    // Try multiple patterns for service request number
    const patterns = [
      /service request number[:\s]*([A-Z0-9-]+)/i,
      /request number[:\s]*([A-Z0-9-]+)/i,
      /reference number[:\s]*([A-Z0-9-]+)/i,
      /case number[:\s]*([A-Z0-9-]+)/i,
      /([A-Z0-9]{10,})/g  // Generic pattern for long alphanumeric strings
    ];
    
    for (const pattern of patterns) {
      const matches = pageContent.match(pattern);
      if (matches) {
        const serviceRequestNumber = matches[1] || matches[0];
        // Filter out common words that might match the generic pattern
        if (!['Please', 'continue', 'proceed', 'submit'].includes(serviceRequestNumber)) {
          console.log(`   ✅ Extracted service request number: ${serviceRequestNumber}`);
          return serviceRequestNumber;
        }
      }
    }
    
    console.log('   ⚠️ Service request number not found');
    return 'Not found';
  }

  /**
   * Extract request address from the form
   */
  async extractRequestAddress() {
    console.log('   Extracting request address...');
    
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
          console.log(`   ✅ Extracted request address: ${value.trim()}`);
          return value.trim();
        }
      }
    }
    
    console.log('   ⚠️ Request address not found');
    return 'Not found';
  }

  // Helper methods (same as other forms)
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
    // Only fill location description if it's provided and relevant
    if (!description || description.trim() === '') {
      console.log(`   ⏭️ Skipping location description (not provided)`);
      return;
    }
    
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
}

module.exports = FallenTreeFormAutomation;
