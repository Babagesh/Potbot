const { chromium } = require('playwright');
const path = require('path');

/**
 * Graffiti Form Automation - Complete automation for SF.gov graffiti reporting
 * Handles the complex multi-dropdown structure of the graffiti form
 */
class GraffitiFormAutomation {
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
   * Submit graffiti report with complete automation
   */
  async submitGraffitiReport(formData) {
    console.log('🎨 Starting Graffiti Form Submission');
    console.log('====================================');
    
    try {
      await this.init();
      
      // Step 1: Navigate to graffiti form
      console.log('🌐 Step 1: Navigating to graffiti form...');
      await this.page.goto('https://www.sf.gov/report-graffiti-issues', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Step 2: Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
      await this.clickReportButton();
      
      // Step 3: Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      await this.handleEmergencyDisclaimer();
      
      // Step 4: Select issue type using JavaScript (required for graffiti form)
      console.log('📋 Step 4: Selecting issue type using JavaScript...');
      await this.selectIssueTypeJavaScript(formData);
      
      // Step 5: Click Next to get to location input page
      console.log('➡️ Step 5: Clicking Next to get to location input page...');
      await this.clickNextToLocationPage();
      
      // Step 6: Complete location workflow
      console.log('📍 Step 6: Completing location workflow...');
      await this.completeLocationWorkflow(formData);
      
      // Step 7: Force click Next button to move to request details page
      console.log('➡️ Step 7: Force clicking Next button using JavaScript...');
      await this.forceNextButtonClick();
      
      // Step 8: Handle the graffiti-specific form fields
      console.log('📝 Step 8: Handling graffiti form fields...');
      await this.handleGraffitiFormFields(formData);
      
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
      const requestNumber = await this.extractServiceRequestNumber();
      const requestAddress = await this.extractRequestAddress();
      
      console.log('✅ Complete graffiti form submission completed successfully!');
      
      return {
        success: true,
        completedSteps: [
          'Navigated to graffiti form',
          'Clicked Report button',
          'Handled emergency disclaimer',
          'Selected issue type',
          'Completed location workflow',
          'Filled graffiti form fields',
          'Handled contact information page',
          'Completed final submission',
          'Extracted service request number and address'
        ],
        serviceRequestNumber: requestNumber,
        requestAddress: requestAddress,
        submittedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.log(`❌ Error in graffiti form submission: ${error.message}`);
      return {
        success: false,
        error: error.message,
        completedSteps: []
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Click Report button
   */
  async clickReportButton() {
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
    
    // Look for Verint-specific URL first (most reliable)
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
        return;
      }
    }
    
    // Fallback to generic Report button
    const reportButton = await this.page.$('button:has-text("Report"), a:has-text("Report"), input[value*="Report"]');
    if (reportButton) {
      await reportButton.click();
      console.log(`   ✅ Clicked generic Report button`);
      await this.page.waitForTimeout(5000);
    } else {
      throw new Error('Report button not found');
    }
  }

  /**
   * Handle emergency disclaimer
   */
  async handleEmergencyDisclaimer() {
    const emergencyDisclaimerButton = await this.page.$('button:has-text("I Understand"), input[value*="I Understand"]');
    if (emergencyDisclaimerButton) {
      await emergencyDisclaimerButton.click();
      console.log(`   ✅ Clicked emergency disclaimer button`);
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Select issue type based on form data
   */
  async selectIssueType(formData) {
    console.log(`   Selecting issue type: ${formData.issueType}`);
    
    // Map user-friendly names to actual values
    const issueTypeMapping = {
      'Graffiti on Private Property': 'graffiti_private',
      'Graffiti on Public Property': 'graffiti_public',
      'Illegal Postings on Public Property': 'illegal_postings'
    };
    
    const mappedValue = issueTypeMapping[formData.issueType] || formData.issueType;
    
    // Check if radio buttons are visible and need to be clicked
    const radioButtons = await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      return radios.map(radio => ({
        name: radio.name,
        value: radio.value,
        isVisible: radio.offsetParent !== null,
        isChecked: radio.checked,
        labelText: radio.nextElementSibling?.textContent?.trim() || ''
      }));
    });
    
    // Look for the appropriate radio button
    const targetRadio = radioButtons.find(radio => 
      radio.value === mappedValue || radio.labelText.includes(formData.issueType)
    );
    
    if (targetRadio && targetRadio.isVisible) {
      // Radio button is visible, click it
      const selector = `input[type="radio"][value="${targetRadio.value}"]`;
      const element = await this.page.$(selector);
      
      if (element) {
        await element.click();
        console.log(`   ✅ Clicked ${formData.issueType} radio button`);
        await this.page.waitForTimeout(1000);
        
        const isChecked = await element.isChecked();
        console.log(`   ✅ ${formData.issueType} option is checked: ${isChecked}`);
      }
    } else if (targetRadio && targetRadio.isChecked) {
      // Radio button is already checked (hidden form)
      console.log(`   ✅ ${formData.issueType} option is already selected (hidden form)`);
    } else {
      console.log(`   ⚠️ Could not find or click ${formData.issueType} radio button`);
    }
    
    // Wait for any dynamic content to load
    await this.page.waitForTimeout(2000);
  }

  /**
   * Select issue type using JavaScript (required for graffiti form)
   */
  async selectIssueTypeJavaScript(formData) {
    console.log(`   Selecting issue type using JavaScript: ${formData.issueType}`);
    
    // Map user-friendly names to actual values
    const issueTypeMapping = {
      'Graffiti on Private Property': 'graffiti_private',
      'Graffiti on Public Property': 'graffiti_public',
      'Illegal Postings on Public Property': 'illegal_postings'
    };
    
    const mappedValue = issueTypeMapping[formData.issueType] || formData.issueType;
    
    const success = await this.page.evaluate((value) => {
      // Look for the radio button with the specified value (even if hidden)
      const radioButton = document.querySelector(`input[type="radio"][value="${value}"]`);
      
      if (radioButton) {
        console.log(`   Found radio button for value: ${value}`);
        console.log(`   Radio button visible: ${radioButton.offsetParent !== null}`);
        console.log(`   Radio button checked: ${radioButton.checked}`);
        
        // For hidden radio buttons, we need to set the checked property directly
        try {
          // First try to click it (in case it's visible)
          radioButton.click();
          console.log(`   ✅ Clicked radio button`);
          return true;
        } catch (error) {
          console.log(`   ❌ Failed to click radio button: ${error.message}`);
          
          // For hidden radio buttons, set checked property and dispatch events
          try {
            radioButton.checked = true;
            
            // Dispatch multiple events to ensure the form recognizes the change
            radioButton.dispatchEvent(new Event('change', { bubbles: true }));
            radioButton.dispatchEvent(new Event('input', { bubbles: true }));
            radioButton.dispatchEvent(new Event('click', { bubbles: true }));
            
            console.log(`   ✅ Set radio button checked and dispatched events`);
            return true;
          } catch (error2) {
            console.log(`   ❌ Alternative method failed: ${error2.message}`);
            return false;
          }
        }
      } else {
        console.log(`   ❌ Radio button not found for value: ${value}`);
        
        // Debug: List all available radio buttons
        const allRadios = document.querySelectorAll('input[type="radio"]');
        console.log(`   Available radio buttons:`);
        allRadios.forEach((radio, index) => {
          console.log(`     ${index + 1}. Value: "${radio.value}", Name: "${radio.name}", Visible: ${radio.offsetParent !== null}`);
        });
        
        return false;
      }
    }, mappedValue);
    
    if (success) {
      console.log(`   ✅ Successfully selected issue type: ${formData.issueType}`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ❌ Failed to select issue type: ${formData.issueType}`);
    }
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
              return false;
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
              return false;
            }
          }
        }
      }
      return false;
    });
    
    if (success) {
      console.log(`   ✅ JavaScript click successful`);
      await this.page.waitForTimeout(3000);
      const urlAfter = this.page.url();
      if (urlAfter !== urlBefore) {
        console.log(`   ✅ SUCCESS! URL changed - moved to next page!`);
      } else {
        console.log(`   ⚠️ URL didn't change - still on same page`);
      }
    } else {
      console.log(`   ❌ JavaScript click failed`);
      throw new Error('Failed to click Next button using JavaScript');
    }
  }

  /**
   * Handle graffiti-specific form fields
   */
  async handleGraffitiFormFields(formData) {
    console.log(`   Filling graffiti-specific form fields...`);
    
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
      
      console.log(`   Found ${enabledOptions.length} enabled options in Request Type dropdown:`);
      enabledOptions.forEach((opt, i) => {
        console.log(`     ${i + 1}. "${opt.text}" (value: "${opt.value}")`);
      });
      
      // If no options are enabled, wait longer and try again
      if (enabledOptions.length === 0) {
        console.log(`   ⚠️ No enabled options found, waiting longer...`);
        await this.page.waitForTimeout(3000);
        
        const enabledOptionsAfterWait = await requestTypeSelect.evaluate((element) => {
          return Array.from(element.options)
            .filter(opt => !opt.disabled && opt.value)
            .map(opt => ({ value: opt.value, text: opt.textContent?.trim() }));
        });
        
        console.log(`   After longer wait, found ${enabledOptionsAfterWait.length} enabled options:`);
        enabledOptionsAfterWait.forEach((opt, i) => {
          console.log(`     ${i + 1}. "${opt.text}" (value: "${opt.value}")`);
        });
      }
    }
    
    // Step 2: Fill "Request Type" dropdown
    console.log(`   Step 2: Filling request type dropdown...`);
    await this.fillRequestTypeDropdown(formData);
    
    // Step 3: Fill request description
    console.log(`   Step 3: Filling request description...`);
    await this.fillRequestDescription(formData.requestDescription);
    
    // Step 4: Fill Pole/Meter/Other ID # if provided
    if (formData.poleMeterId) {
      console.log(`   Step 4: Filling Pole/Meter/Other ID #...`);
      await this.fillPoleMeterId(formData.poleMeterId);
    }
    
    // Step 5: Upload image
    console.log(`   Step 5: Uploading image...`);
    await this.uploadImage(formData.imagePath);
    
    console.log(`   ✅ Graffiti form fields completed`);
    
    // Step 6: Click Next button to proceed to contact information page
    console.log(`   Step 6: Clicking Next button to proceed to contact page...`);
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
      const mappedValue = this.mapRequestRegarding(formData.issueType, formData.requestRegarding);
      await this.handleSelectDropdown(dropdownElement, mappedValue, 'requestRegarding');
    } else {
      console.log(`   ⚠️ Request regarding dropdown not found with selector: ${dropdownSelector}`);
    }
  }

  /**
   * Map request regarding based on issue type
   */
  mapRequestRegarding(issueType, requestRegarding) {
    // For graffiti forms, the "request regarding" options change based on issue type
    if (issueType === 'Graffiti on Private Property' || issueType === 'Graffiti on Public Property') {
      // For graffiti, the options are about offensive content
      const graffitiMapping = {
        'Offensive (racial slurs or profanity)': 'offensive',
        'Not Offensive (no racial slurs or profanity)': 'not_offensive'
      };
      return graffitiMapping[requestRegarding] || requestRegarding;
    } else if (issueType === 'Illegal Postings on Public Property') {
      // For illegal postings, the options are about posting violations
      const postingMapping = {
        'Affixed Improperly': 'affixed_improperly',
        'Multiple Postings': 'multiple_postings',
        'No Posting Date': 'no_posting_date',
        'Posted on Directional Sign': 'posted_on_directional_sign',
        'Posted on Historic Street Light': 'posted_on_historic_street_light',
        'Posted on Traffic Light': 'posted_on_traffic_light',
        'Posted Over 70 Days': 'posted_over_70_days',
        'Posting Too High on Pole': 'posting_too_high_on_pole',
        'Posting Too Large in Size': 'posting_too_large_in_size'
      };
      return postingMapping[requestRegarding] || requestRegarding;
    }
    
    return requestRegarding;
  }

  /**
   * Fill "Request Type" dropdown
   * This dropdown changes based on the issue type selected
   */
  async fillRequestTypeDropdown(formData) {
    console.log(`   Filling request type: ${formData.requestType}`);
    
    const dropdownSelector = 'select[name="Request_type"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found request type dropdown: ${dropdownSelector}`);
      
      // First, get only the enabled options
      const enabledOptions = await dropdownElement.evaluate((element) => {
        return Array.from(element.options)
          .filter(opt => !opt.disabled && opt.value)
          .map(opt => ({ value: opt.value, text: opt.textContent?.trim() }));
      });
      
      console.log(`   Available enabled options: ${enabledOptions.length}`);
      enabledOptions.forEach((opt, i) => {
        console.log(`     ${i + 1}. "${opt.text}" (value: "${opt.value}")`);
      });
      
      // Map the request type based on issue type
      const mappedValue = this.mapRequestType(formData.issueType, formData.requestType);
      
      // Check if our target option is enabled
      const targetOption = enabledOptions.find(opt => 
        opt.value === mappedValue || 
        opt.text.toLowerCase().includes(formData.requestType.toLowerCase())
      );
      
      if (targetOption) {
        console.log(`   ✅ Target option is enabled: "${targetOption.text}"`);
        await this.handleSelectDropdown(dropdownElement, targetOption.value, 'requestType');
      } else {
        console.log(`   ⚠️ Target option not enabled, using first available option`);
        if (enabledOptions.length > 0) {
          const fallbackOption = enabledOptions[0];
          console.log(`   Using fallback option: "${fallbackOption.text}"`);
          await this.handleSelectDropdown(dropdownElement, fallbackOption.value, 'requestType');
        } else {
          console.log(`   ❌ No enabled options available`);
        }
      }
    } else {
      console.log(`   ⚠️ Request type dropdown not found with selector: ${dropdownSelector}`);
    }
  }

  /**
   * Map request type based on issue type
   */
  mapRequestType(issueType, requestType) {
    if (issueType === 'Graffiti on Private Property') {
      // For graffiti on private property
      const privatePropertyMapping = {
        'Sidewalk in front of property': 'sidewalk_in_front_of_property',
        'Building - Commercial': 'building_commercial',
        'Building - Residential': 'building_residential',
        'Building - Other': 'building_other'
      };
      return privatePropertyMapping[requestType] || requestType;
    } else if (issueType === 'Graffiti on Public Property') {
      // For graffiti on public property
      const publicPropertyMapping = {
        'ATT Property': 'att_property',
        'Bike Rack': 'bike_rack',
        'Bridge': 'bridge',
        'City receptacle': 'city_receptacle',
        'Fire/ Police Call Box': 'fire_police_callbox',
        'Fire hydrant': 'fire_hydrant',
        'Mail box': 'mail_box',
        'News rack': 'news_rack',
        'Parking meter': 'parking_meter',
        'Pay phone': 'pay_phone',
        'Pole': 'pole',
        'Sidewalk structure': 'sidewalk_structure',
        'Signal box': 'signal_box',
        'Street': 'street',
        'Transit Shelter/ Platform': 'transit_shelter_platform',
        'Other - enter additional details': 'other'
      };
      return publicPropertyMapping[requestType] || requestType;
    } else if (issueType === 'Illegal Postings on Public Property') {
      // For illegal postings, the request type dropdown might be different
      // This would need to be verified, but for now return as-is
      return requestType;
    }
    
    return requestType;
  }

  /**
   * Handle select dropdown using Playwright's selectOption method
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
    
    // Find matching option based on field type
    let mapping;
    
    if (fieldType === 'requestRegarding') {
      // Map for "What is your request regarding?"
      mapping = {
        'Offensive (racial slurs or profanity)': 'offensive',
        'Not Offensive (no racial slurs or profanity)': 'not_offensive'
      };
    } else if (fieldType === 'requestType') {
      // Map for "Request Type"
      mapping = {
        'Sidewalk in front of property': 'sidewalk_front_property',
        'Building - Commercial': 'building_commercial',
        'Building - Residential': 'building_residential',
        'Building - Other': 'building_other'
      };
    }
    
    const mappedValue = mapping ? mapping[value] : value;
    
    const matchingOption = options.find(option => 
      option.text === value || 
      option.value === value ||
      option.value === mappedValue ||
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
   * Fill request description field
   */
  async fillRequestDescription(description) {
    console.log(`   Filling request description: ${description}`);
    
    const descriptionSelector = 'textarea[name="Request_description"]';
    const descriptionElement = await this.page.$(descriptionSelector);
    
    if (descriptionElement && await descriptionElement.isVisible()) {
      await descriptionElement.fill(description);
      console.log(`   ✅ Filled request description`);
      
      // Press Enter to save the description
      await descriptionElement.press('Enter');
      console.log(`   ✅ Pressed Enter to save request description`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ Request description field not found with selector: ${descriptionSelector}`);
    }
  }

  /**
   * Fill Pole/Meter/Other ID # field
   */
  async fillPoleMeterId(poleMeterId) {
    console.log(`   Filling Pole/Meter/Other ID #: ${poleMeterId}`);
    
    // Look for various possible selectors for this field
    const selectors = [
      'input[name*="pole"]',
      'input[name*="meter"]',
      'input[name*="id"]',
      'input[placeholder*="ID"]',
      'input[placeholder*="pole"]',
      'input[placeholder*="meter"]'
    ];
    
    let fieldFound = false;
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.fill(poleMeterId);
          console.log(`   ✅ Filled Pole/Meter/Other ID # using selector: ${selector}`);
          fieldFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!fieldFound) {
      console.log(`   ⚠️ Pole/Meter/Other ID # field not found`);
    }
  }

  /**
   * Upload image file
   */
  async uploadImage(imagePath) {
    console.log(`   Uploading image: ${imagePath}`);
    
    const fileUploadSelector = 'input[name="File_attach[]"]';
    const fileUploadElement = await this.page.$(fileUploadSelector);
    
    if (fileUploadElement && await fileUploadElement.isVisible()) {
      await fileUploadElement.setInputFiles(imagePath);
      console.log(`   ✅ Uploaded image file`);
      await this.page.waitForTimeout(1000);
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
              return false;
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
    
    const anonymousSelected = await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      
      const anonymousRadio = radios.find(radio => {
        const text = radio.nextElementSibling?.textContent?.trim() || '';
        return text.toLowerCase().includes('remain anonymous') || 
               text.toLowerCase().includes('no, i want to remain anonymous');
      });
      
      if (anonymousRadio) {
        anonymousRadio.click();
        return true;
      }
      
      const contactRadios = radios.filter(radio => 
        radio.name.includes('contact') && radio.value === 'false'
      );
      
      if (contactRadios.length > 0) {
        contactRadios[0].click();
        return true;
      }
      
      return false;
    });
    
    if (anonymousSelected) {
      await this.page.waitForTimeout(1000);
    }
    
    const reportButtonClicked = await this.page.evaluate(() => {
      const anonymousButtonIds = [
        'dform_widget_button_but_anonymous_next',
        'dform_widget_button_but_V633VQV8'
      ];
      
      for (const buttonId of anonymousButtonIds) {
        const button = document.getElementById(buttonId);
        if (button) {
          button.click();
          return true;
        }
      }
      
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      let reportButton = buttons.find(btn => {
        const className = btn.className?.toLowerCase() || '';
        const id = btn.id?.toLowerCase() || '';
        return className.includes('anonymous') || id.includes('anonymous');
      });
      
      if (reportButton) {
        reportButton.click();
        return true;
      }
      
      reportButton = buttons.find(btn => {
        const text = btn.textContent?.trim() || btn.value || '';
        return text.toLowerCase().includes('report anonymously') ||
               text.toLowerCase().includes('submit anonymously');
      });
      
      if (reportButton) {
        reportButton.click();
        return true;
      }
      
      return false;
    });
    
    if (reportButtonClicked) {
      console.log(`   ✅ Successfully clicked Report Anonymously button`);
      await this.page.waitForTimeout(3000);
      
      const finalNextClicked = await this.page.evaluate(() => {
        const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
          .filter(el => {
            const text = el.textContent?.trim() || el.value || '';
            return /next|continue|proceed/i.test(text);
          });
        
        if (nextButtons.length > 0) {
          const nextButton = nextButtons[0];
          if (nextButton.offsetParent !== null) {
            nextButton.click();
            return true;
          }
        }
        return false;
      });
      
      if (finalNextClicked) {
        console.log(`   ✅ Successfully clicked final Next button`);
        await this.page.waitForTimeout(5000);
      }
    }
  }

  /**
   * Handle final submission
   */
  async handleFinalSubmission() {
    console.log(`   Handling final submission...`);
    
    await this.page.waitForTimeout(2000);
    
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
    
    const submitSelectors = [
      'button:has-text("Submit")',
      'input[value*="Submit"]',
      'button[type="submit"]',
      'input[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          submitButton = element;
          console.log(`   ✅ Found submit button: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (submitButton) {
      await submitButton.click();
      console.log(`   ✅ Clicked Submit button`);
      await this.page.waitForTimeout(5000);
    }
  }

  /**
   * Extract service request number
   */
  async extractServiceRequestNumber() {
    console.log(`   Extracting service request number...`);
    
    await this.page.waitForTimeout(3000);
    
    const requestNumber = await this.page.evaluate(() => {
      const pageText = document.body.textContent || document.documentElement.textContent || '';
      
      const patterns = [
        /Your Service Request Number is:\s*([A-Z0-9-]+)/i,
        /Service Request Number:\s*([A-Z0-9-]+)/i,
        /Request Number:\s*([A-Z0-9-]+)/i,
        /Reference Number:\s*([A-Z0-9-]+)/i,
        /Case Number:\s*([A-Z0-9-]+)/i,
        /Ticket Number:\s*([A-Z0-9-]+)/i,
        /SR[:\s]*([A-Z0-9-]+)/i,
        /Request[:\s]*([A-Z0-9-]+)/i,
        /Case[:\s]*([A-Z0-9-]+)/i,
        /Reference[:\s]*([A-Z0-9-]+)/i,
        /([A-Z]{2,4}[0-9]{6,})/i,
        /([0-9]{6,})/i,
        /Service Request[:\s]*([A-Z0-9-]+)/i,
        /Request ID[:\s]*([A-Z0-9-]+)/i,
        /Case ID[:\s]*([A-Z0-9-]+)/i,
        /Ticket ID[:\s]*([A-Z0-9-]+)/i,
        /Reference ID[:\s]*([A-Z0-9-]+)/i,
        /([A-Z]{1,3}[0-9]{4,})/i,
        /([0-9]{7,})/i
      ];
      
      for (const pattern of patterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          const result = match[1].trim();
          // Filter out common words that aren't request numbers
          if (!/^(please|thank|you|your|the|and|or|for|with|this|that|here|there)$/i.test(result)) {
            return result;
          }
        }
      }
      
      // If no pattern matches, look for any text that looks like a request number
      const possibleNumbers = pageText.match(/[A-Z0-9-]{6,}/g);
      if (possibleNumbers) {
        for (const number of possibleNumbers) {
          if (number.length >= 6 && /[A-Z]/.test(number) && /[0-9]/.test(number)) {
            // Filter out common words
            if (!/^(please|thank|you|your|the|and|or|for|with|this|that|here|there)$/i.test(number)) {
              return number;
            }
          }
        }
      }
      
      return null;
    });
    
    if (requestNumber) {
      console.log(`   ✅ Extracted service request number: ${requestNumber}`);
      return requestNumber;
    } else {
      console.log(`   ⚠️ Could not extract service request number`);
      return null;
    }
  }

  /**
   * Extract the address that was populated from the map location
   */
  async extractRequestAddress() {
    console.log(`   Extracting request address...`);
    
    const address = await this.page.evaluate(() => {
      const locationSelectors = [
        'input[name*="location"]',
        'input[name*="address"]',
        'input[id*="location"]',
        'input[id*="address"]',
        'input[placeholder*="location"]',
        'input[placeholder*="address"]',
        'textarea[name*="location"]',
        'textarea[name*="address"]',
        'input[value*="ST"]',
        'input[value*="AVE"]',
        'input[value*="BLVD"]',
        'input[value*="SAN FRANCISCO"]'
      ];
      
      for (const selector of locationSelectors) {
        const element = document.querySelector(selector);
        if (element && element.value && element.value.trim()) {
          const value = element.value.trim();
          if (value.includes('ST') || value.includes('AVE') || value.includes('BLVD') || 
              value.includes('SAN FRANCISCO') || value.includes('CA')) {
            console.log(`   Found address in field ${selector}: ${value}`);
            return value;
          }
        }
      }
      
      const allInputs = document.querySelectorAll('input[type="text"], input[type="hidden"], textarea');
      for (const input of allInputs) {
        if (input.value && input.value.trim()) {
          const value = input.value.trim();
          if (value.match(/\d+\s+\w+\s+(ST|AVE|BLVD|RD|DR|WAY|CT|PL)/i) && 
              value.includes('SAN FRANCISCO')) {
            console.log(`   Found address in field ${input.name || input.id || 'unnamed'}: ${value}`);
            return value;
          }
        }
      }
      
      return null;
    });
    
    if (address) {
      console.log(`   ✅ Extracted request address: ${address}`);
      return address;
    } else {
      console.log(`   ⚠️ Could not extract request address`);
      return null;
    }
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
          await this.page.waitForTimeout(1000);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
  }

  /**
   * Test graffiti form with sample data
   */
  async testGraffitiForm() {
    const sampleData = {
      issueType: 'Graffiti on Public Property',
      coordinates: '37.755196, -122.423207',
      locationDescription: 'Graffiti spray painted on the side of the building near the main entrance.',
      requestRegarding: 'Not Offensive (no racial slurs or profanity)',
      requestType: 'Building - Commercial',
      requestDescription: 'Large graffiti tag covering the side of the commercial building. Needs immediate removal.',
      poleMeterId: 'SF-12345', // Optional field
      imagePath: path.join(__dirname, 'sample-pothole-image.jpg')
    };
    
    console.log('🧪 Testing Graffiti Form with Sample Data');
    console.log('=========================================');
    console.log(`Issue Type: ${sampleData.issueType}`);
    console.log(`Coordinates: ${sampleData.coordinates}`);
    console.log(`Location Description: ${sampleData.locationDescription}`);
    console.log(`Request Regarding: ${sampleData.requestRegarding}`);
    console.log(`Request Type: ${sampleData.requestType}`);
    console.log(`Request Description: ${sampleData.requestDescription}`);
    console.log(`Pole/Meter ID: ${sampleData.poleMeterId}`);
    console.log(`Image Path: ${sampleData.imagePath}`);
    console.log('');
    
    const result = await this.submitGraffitiReport(sampleData);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    if (result.success) {
      console.log('Completed Steps:');
      result.completedSteps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
      if (result.serviceRequestNumber) {
        console.log(`\n🎉 Service Request Number: ${result.serviceRequestNumber}`);
      }
      if (result.requestAddress) {
        console.log(`📍 Request Address: ${result.requestAddress}`);
      }
    } else {
      console.log(`Error: ${result.error}`);
    }
    
    return result;
  }
}

// Export the class
module.exports = { GraffitiFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runGraffitiTest() {
    const automation = new GraffitiFormAutomation({ headless: false });
    
    try {
      const result = await automation.testGraffitiForm();
      
      // Save results to file
      const fs = require('fs');
      const resultsPath = path.join(__dirname, 'graffiti-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Graffiti form test failed:', error);
    }
  }
  
  runGraffitiTest();
}
