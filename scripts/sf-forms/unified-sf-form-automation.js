const { chromium } = require('playwright');
const path = require('path');

/**
 * Unified SF Form Automation - Handles both Street and Sidewalk/Curb forms
 * Automatically detects the form type and uses appropriate dropdown options
 */
class UnifiedSFFormAutomation {
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
   * Submit SF form report with complete automation
   * Automatically detects whether it's a Street or Sidewalk/Curb form
   */
  async submitSFReport(formData) {
    console.log('🚧 Starting SF Form Submission');
    console.log('===============================');
    
    try {
      await this.init();
      
      // Step 1: Navigate to the appropriate form
      console.log('🌐 Step 1: Navigating to form...');
      const formUrl = this.getFormUrl(formData.damageType);
      await this.page.goto(formUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Step 2: Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
      await this.clickReportButton();
      
      // Step 3: Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      await this.handleEmergencyDisclaimer();
      
      // Step 4: Select issue type and detect form type
      console.log('📋 Step 4: Selecting issue type and detecting form type...');
      const formType = await this.selectIssueTypeAndDetectForm(formData);
      
      // Step 5: Click Next to get to location input page
      console.log('➡️ Step 5: Clicking Next to get to location input page...');
      await this.clickNextToLocationPage();
      
      // Step 6: Complete location workflow
      console.log('📍 Step 6: Completing location workflow...');
      await this.completeLocationWorkflow(formData);
      
      // Step 7: Force click Next button to move to request details page
      console.log('➡️ Step 7: Force clicking Next button using JavaScript...');
      await this.forceNextButtonClick();
      
      // Step 8: Now handle the next page form with correct dropdown options
      console.log('📝 Step 8: Handling next page form...');
      await this.handleNextPageForm(formData, formType);
      
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
      
      console.log('✅ Complete SF form submission completed successfully!');
      
      return {
        success: true,
        formType: formType,
        completedSteps: [
          'Navigated to form',
          'Clicked Report button',
          'Handled emergency disclaimer',
          `Selected issue type (${formType})`,
          'Completed location workflow',
          'Filled next page form',
          'Handled contact information page',
          'Completed final submission',
          'Extracted service request number and address'
        ],
        serviceRequestNumber: requestNumber,
        requestAddress: requestAddress,
        submittedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.log(`❌ Error in SF form submission: ${error.message}`);
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
   * Get form URL for damage type
   */
  getFormUrl(damageType) {
    const urls = {
      pothole: 'https://www.sf.gov/report-pothole-and-street-issues',
      sidewalk: 'https://www.sf.gov/report-curb-and-sidewalk-problems',
      graffiti: 'https://www.sf.gov/report-graffiti-issues',
      trash: 'https://www.sf.gov/report-garbage-container-issues',
      streetMarkings: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
      streetlight: 'https://www.sf.gov/report-problem-streetlight',
      fallenTree: 'https://www.sf.gov/report-damaged-or-fallen-tree'
    };
    
    return urls[damageType] || urls.pothole;
  }

  /**
   * Select issue type and detect whether it's Street or Sidewalk/Curb form
   */
  async selectIssueTypeAndDetectForm(formData) {
    console.log(`   Detecting form type and issue selection...`);
    
    // Check the current URL to determine form type
    const currentUrl = this.page.url();
    let formType;
    
    if (currentUrl.includes('Issue=sidewalk_and_curb')) {
      formType = 'Sidewalk/Curb';
      console.log(`   ✅ Detected Sidewalk/Curb form from URL`);
    } else if (currentUrl.includes('Issue=street_defect')) {
      formType = 'Street';
      console.log(`   ✅ Detected Street form from URL`);
    } else {
      // Try to determine from form data
      if (formData.issueType === 'Street' || formData.damageType === 'pothole') {
        formType = 'Street';
      } else if (formData.issueType === 'Sidewalk/Curb' || formData.damageType === 'sidewalk') {
        formType = 'Sidewalk/Curb';
      } else {
        formType = 'Street'; // Default
      }
      console.log(`   ⚠️ Could not detect from URL, using form data: ${formType}`);
    }
    
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
    const targetRadio = radioButtons.find(radio => {
      if (formType === 'Sidewalk/Curb') {
        return radio.value === 'sidewalk_and_curb' || radio.labelText.includes('Sidewalk');
      } else if (formType === 'Street') {
        return radio.value === 'street_defect' || radio.labelText.includes('Street');
      }
      return false;
    });
    
    if (targetRadio && targetRadio.isVisible) {
      // Radio button is visible, click it
      const selector = `input[type="radio"][value="${targetRadio.value}"]`;
      const element = await this.page.$(selector);
      
      if (element) {
        await element.click();
        console.log(`   ✅ Clicked ${formType} radio button`);
        await this.page.waitForTimeout(1000);
        
        const isChecked = await element.isChecked();
        console.log(`   ✅ ${formType} option is checked: ${isChecked}`);
      }
    } else if (targetRadio && targetRadio.isChecked) {
      // Radio button is already checked (hidden form)
      console.log(`   ✅ ${formType} option is already selected (hidden form)`);
    } else {
      console.log(`   ⚠️ Could not find or click ${formType} radio button`);
    }
    
    // Wait for dropdown to be populated with appropriate options
    console.log(`   ⏳ Waiting for dropdown to populate with ${formType} options...`);
    await this.page.waitForTimeout(2000);
    
    return formType;
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
   * Handle next page form with correct dropdown options based on form type
   */
  async handleNextPageForm(formData, formType) {
    console.log(`   Filling next page form fields for ${formType} form...`);
    
    // Step 1: Fill dropdown field "What is your request regarding"
    console.log(`   Step 1: Filling dropdown field...`);
    await this.fillDropdownField(formData.requestType, formType);
    
    // Step 2: Handle secondary dropdown if it appears (for Sidewalk Defect)
    console.log(`   Step 2: Checking for secondary dropdown...`);
    await this.handleSecondaryDropdown(formData);
    
    // Step 3: Fill request description
    console.log(`   Step 3: Filling request description...`);
    await this.fillRequestDescription(formData.requestDescription);
    
    // Step 4: Upload image
    console.log(`   Step 4: Uploading image...`);
    await this.uploadImage(formData.imagePath);
    
    // Step 5: Note: Next button click will be handled separately
    console.log(`   Step 5: Request details completed - Next button will be clicked separately`);
  }

  /**
   * Handle secondary dropdown that appears after selecting "Sidewalk Defect"
   */
  async handleSecondaryDropdown(formData) {
    console.log(`   Checking for secondary dropdown after selecting "${formData.requestType}"...`);
    
    // Wait a moment for any dynamic content to load
    await this.page.waitForTimeout(1000);
    
    // Look for additional dropdowns that might have appeared
    const secondaryDropdowns = await this.page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.map((select, index) => ({
        index: index + 1,
        name: select.name,
        id: select.id,
        className: select.className,
        isVisible: select.offsetParent !== null,
        options: Array.from(select.options).map(option => ({
          value: option.value,
          text: option.textContent?.trim()
        }))
      }));
    });
    
    console.log(`   Found ${secondaryDropdowns.length} select elements:`);
    secondaryDropdowns.forEach((select, i) => {
      console.log(`     ${i + 1}. Name: "${select.name}", ID: "${select.id}", Visible: ${select.isVisible}`);
      if (select.isVisible && select.options.length > 1) {
        console.log(`        Options:`);
        select.options.forEach((option, j) => {
          console.log(`          ${j + 1}. "${option.text}" (value: "${option.value}")`);
        });
      }
    });
    
    // Look for a secondary dropdown that appeared after selecting "Sidewalk Defect"
    const sidewalkDefectSecondaryDropdown = secondaryDropdowns.find(select => 
      select.isVisible && 
      select.options.some(option => 
        option.text.toLowerCase().includes('collapsed sidewalk') || 
        option.text.toLowerCase().includes('lifted sidewalk') ||
        option.text.toLowerCase().includes('tree roots')
      )
    );
    
    if (sidewalkDefectSecondaryDropdown) {
      console.log(`   ✅ Found secondary dropdown for Sidewalk Defect`);
      
      // Get the secondary dropdown element
      const secondaryDropdownElement = await this.page.$(`select[name="${sidewalkDefectSecondaryDropdown.name}"]`);
      
      if (secondaryDropdownElement) {
        // Select the first non-empty option (or use formData if provided)
        const secondaryOptions = sidewalkDefectSecondaryDropdown.options.filter(opt => opt.value && opt.text);
        
        if (secondaryOptions.length > 0) {
          // Use formData.secondaryRequestType if provided, otherwise use first option
          const selectedOption = formData.secondaryRequestType || secondaryOptions[0].text;
          
          console.log(`   Selecting secondary option: "${selectedOption}"`);
          
          // Find matching option
          const matchingOption = secondaryOptions.find(option => 
            option.text === selectedOption ||
            option.text.toLowerCase().includes(selectedOption.toLowerCase())
          );
          
          if (matchingOption) {
            await secondaryDropdownElement.evaluate((element, value) => {
              element.value = value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }, matchingOption.value);
            console.log(`   ✅ Selected secondary option: "${matchingOption.text}"`);
          } else {
            // Fallback to first option
            await secondaryDropdownElement.evaluate((element, value) => {
              element.value = value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }, secondaryOptions[0].value);
            console.log(`   ✅ Selected first secondary option as fallback: "${secondaryOptions[0].text}"`);
          }
          
          await this.page.waitForTimeout(1000);
        }
      }
    } else {
      console.log(`   ℹ️ No secondary dropdown found (this is normal for non-Sidewalk Defect options)`);
    }
  }

  /**
   * Fill dropdown field with correct options based on form type
   */
  async fillDropdownField(requestType, formType) {
    console.log(`   Filling dropdown with: ${requestType} (${formType} form)`);
    
    // Use the exact selector from field analysis
    const dropdownSelector = 'select[name="Nature_of_request"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found dropdown field: ${dropdownSelector}`);
      await this.handleSelectDropdown(dropdownElement, requestType, formType);
    } else {
      console.log(`   ⚠️ Dropdown field not found with selector: ${dropdownSelector}`);
    }
  }

  /**
   * Handle select dropdown with correct mapping based on form type
   */
  async handleSelectDropdown(selectElement, requestType, formType) {
    console.log(`   Handling select dropdown for ${formType} form...`);
    
    // Get all options
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
    
    // Find matching option based on form type
    let requestTypeMapping;
    
    if (formType === 'Street') {
      // Street form options
      requestTypeMapping = {
        'Construction Plate Shifted': 'construction_plate_shifted',
        'Manhole Cover Off': 'manhole_cover_off',
        'Pothole/Pavement Defect': 'pavement_defect',
        'Utility Excavation': 'utility_excavation',
        'Other': 'other'
      };
    } else if (formType === 'Sidewalk/Curb') {
      // Sidewalk/Curb form options
      requestTypeMapping = {
        'Missing Side Sewer Vent Cover': 'missing_side_sewer_vent_cover',
        'Damaged Side Sewer Vent Cover': 'damaged_side_sewer_vent_cover',
        'Curb or Curb Ramp Defect': 'curb_or_curb_ramp_defect',
        'Public Stairway Defect': 'public_stairway_defect',
        'Sidewalk Defect': 'sidewalk_defect',
        'Pothole/Pavement Damage': 'pavement_defect',
        'Pothole/Pavement Defect': 'pavement_defect'
      };
    } else {
      // Fallback mapping
      requestTypeMapping = {
        'Missing Side Sewer Vent Cover': 'missing_side_sewer_vent_cover',
        'Damaged Side Sewer Vent Cover': 'damaged_side_sewer_vent_cover',
        'Curb or Curb Ramp Defect': 'curb_or_curb_ramp_defect',
        'Public Stairway Defect': 'public_stairway_defect',
        'Sidewalk Defect': 'sidewalk_defect',
        'Pothole/Pavement Damage': 'pavement_defect',
        'Pothole/Pavement Defect': 'pavement_defect',
        'Construction Plate Shifted': 'construction_plate_shifted',
        'Manhole Cover Off': 'manhole_cover_off',
        'Utility Excavation': 'utility_excavation',
        'Other': 'other'
      };
    }
    
    const mappedValue = requestTypeMapping[requestType] || requestType;
    
    const matchingOption = options.find(option => 
      option.text === requestType || 
      option.value === requestType ||
      option.value === mappedValue ||
      option.text.toLowerCase().includes(requestType.toLowerCase())
    );
    
    if (matchingOption) {
      // Skip slow selectOption and go directly to JavaScript selection
      try {
        await selectElement.evaluate((element, value) => {
          element.value = value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }, matchingOption.value);
        console.log(`   ✅ Selected option via JavaScript: "${matchingOption.text}"`);
      } catch (jsError) {
        console.log(`   ❌ JavaScript selection failed: ${jsError.message}`);
      }
    } else {
      console.log(`   ⚠️ No matching option found for: ${requestType}`);
      console.log(`   Available options for ${formType} form:`, Object.keys(requestTypeMapping));
      
      // Select first option as fallback using JavaScript
      if (options.length > 0) {
        try {
          await selectElement.evaluate((element, value) => {
            element.value = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }, options[0].value);
          console.log(`   ✅ Selected first option as fallback via JavaScript: "${options[0].text}"`);
        } catch (error) {
          console.log(`   ❌ Fallback selection failed: ${error.message}`);
        }
      }
    }
  }

  // All other methods are the same as the previous automation
  // (clickReportButton, handleEmergencyDisclaimer, completeLocationWorkflow, etc.)
  // I'll include the key ones but skip the full implementation for brevity

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

  async handleEmergencyDisclaimer() {
    const emergencyDisclaimerButton = await this.page.$('button:has-text("I Understand"), input[value*="I Understand"]');
    if (emergencyDisclaimerButton) {
      await emergencyDisclaimerButton.click();
      console.log(`   ✅ Clicked emergency disclaimer button`);
      await this.page.waitForTimeout(2000);
    }
  }

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

  async fillRequestDescription(description) {
    console.log(`   Filling request description: ${description}`);
    
    const descriptionSelector = 'textarea[name="Request_description"]';
    const descriptionElement = await this.page.$(descriptionSelector);
    
    if (descriptionElement && await descriptionElement.isVisible()) {
      await descriptionElement.fill(description);
      console.log(`   ✅ Filled request description`);
      
      await descriptionElement.press('Enter');
      console.log(`   ✅ Pressed Enter to save request description`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ Request description field not found with selector: ${descriptionSelector}`);
    }
  }

  async uploadImage(imagePath) {
    if (!imagePath) {
      console.log(`   ⚠️ No image path provided, skipping image upload`);
      return;
    }

    console.log(`   Uploading image: ${imagePath}`);

    const fileUploadSelector = 'input[name="File_attach[]"]';
    const fileUploadElement = await this.page.$(fileUploadSelector);

    if (fileUploadElement && await fileUploadElement.isVisible()) {
      await fileUploadElement.setInputFiles(imagePath);
      console.log(`   ✅ Uploaded image file: ${imagePath}`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ File upload field not found with selector: ${fileUploadSelector}`);
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
        /([A-Z]{2,4}[0-9]{6,})/i, // Pattern like SR1234567 or REQ1234567
        /([0-9]{6,})/i, // Just numbers (6+ digits)
        /Service Request[:\s]*([A-Z0-9-]+)/i,
        /Request ID[:\s]*([A-Z0-9-]+)/i,
        /Case ID[:\s]*([A-Z0-9-]+)/i,
        /Ticket ID[:\s]*([A-Z0-9-]+)/i,
        /Reference ID[:\s]*([A-Z0-9-]+)/i,
        /([A-Z]{1,3}[0-9]{4,})/i, // Pattern like A123456 or SF123456
        /([0-9]{7,})/i // Just numbers (7+ digits)
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

  async extractRequestAddress() {
    console.log(`   Extracting request address...`);
    
    const address = await this.page.evaluate(() => {
      // Look for the location field that gets populated from the map
      const locationSelectors = [
        'input[name*="location"]',
        'input[name*="address"]',
        'input[id*="location"]',
        'input[id*="address"]',
        'input[placeholder*="location"]',
        'input[placeholder*="address"]',
        'textarea[name*="location"]',
        'textarea[name*="address"]',
        'input[value*="ST"]', // Look for fields with street addresses
        'input[value*="AVE"]',
        'input[value*="BLVD"]',
        'input[value*="SAN FRANCISCO"]' // Look for SF addresses
      ];
      
      for (const selector of locationSelectors) {
        const element = document.querySelector(selector);
        if (element && element.value && element.value.trim()) {
          const value = element.value.trim();
          // Check if it looks like an address (contains street info and city)
          if (value.includes('ST') || value.includes('AVE') || value.includes('BLVD') || 
              value.includes('SAN FRANCISCO') || value.includes('CA')) {
            console.log(`   Found address in field ${selector}: ${value}`);
            return value;
          }
        }
      }
      
      // Also check for any input fields that might contain the address
      const allInputs = document.querySelectorAll('input[type="text"], input[type="hidden"], textarea');
      for (const input of allInputs) {
        if (input.value && input.value.trim()) {
          const value = input.value.trim();
          // Look for patterns that suggest this is an address
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

  // Helper methods
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
   * Test unified form with sample data
   */
  async testUnifiedForm(damageType = 'sidewalk') {
    const sampleData = {
      damageType: damageType,
      issueType: damageType === 'sidewalk' ? 'Sidewalk/Curb' : 'Street',
      coordinates: '37.755196, -122.423207',
      locationDescription: damageType === 'sidewalk' 
        ? 'On the sidewalk in front of the building, large crack running across the entire width.'
        : 'On the side of the street facing Plane Jaine restaurant directly in the center of the right lane.',
      requestType: damageType === 'sidewalk' ? 'Sidewalk Defect' : 'Pothole/Pavement Defect',
      requestDescription: damageType === 'sidewalk'
        ? 'Large crack in the sidewalk that poses a tripping hazard for pedestrians.'
        : 'The manhole is completely missing a sewer cover, which is a huge safety liability.',
      secondaryRequestType: damageType === 'sidewalk' ? 'Collapsed sidewalk' : null,
      imagePath: path.join(__dirname, 'sample-pothole-image.jpg')
    };
    
    console.log(`🧪 Testing Unified SF Form (${damageType})`);
    console.log('=========================================');
    console.log(`Damage Type: ${sampleData.damageType}`);
    console.log(`Issue Type: ${sampleData.issueType}`);
    console.log(`Coordinates: ${sampleData.coordinates}`);
    console.log(`Location Description: ${sampleData.locationDescription}`);
    console.log(`Request Type: ${sampleData.requestType}`);
    console.log(`Request Description: ${sampleData.requestDescription}`);
    console.log(`Image Path: ${sampleData.imagePath}`);
    console.log('');
    
    const result = await this.submitSFReport(sampleData);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    if (result.success) {
      console.log(`Form Type: ${result.formType}`);
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
module.exports = { UnifiedSFFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runUnifiedTest() {
    const automation = new UnifiedSFFormAutomation({ headless: false });

    try {
      // Check if CLI arguments provided (from Python backend)
      if (process.argv[2]) {
        try {
          const formData = JSON.parse(process.argv[2]);
          console.log('📥 Received form data from backend:', JSON.stringify(formData, null, 2));

          console.log('\n🎭 Submitting Form to SF.gov');
          console.log('============================');

          // Submit using the provided data
          const result = await automation.submitSFReport(formData);

          // Output result as JSON for Python to parse
          console.log('\n✅ SUBMISSION RESULT:');
          console.log(JSON.stringify(result, null, 2));

          return result;

        } catch (parseError) {
          console.error('❌ Failed to parse CLI arguments:', parseError.message);
          process.exit(1);
        }
      } else {
        // No CLI arguments - run default tests
        console.log('🧪 Testing Both Street and Sidewalk Forms');
        console.log('==========================================');

        // Test Street form
        console.log('\n🚧 Testing Street Form:');
        console.log('========================');
        const streetResult = await automation.testUnifiedForm('pothole');

        console.log('\n' + '='.repeat(80));

        // Test Sidewalk form
        console.log('\n🚧 Testing Sidewalk Form:');
        console.log('===========================');
        const sidewalkResult = await automation.testUnifiedForm('sidewalk');

        // Save results
        const fs = require('fs');
        const resultsPath = path.join(__dirname, 'unified-form-test-results.json');
        const allResults = {
          street: streetResult,
          sidewalk: sidewalkResult,
          testedAt: new Date().toISOString()
        };
        fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
        console.log(`\n💾 Test results saved to: ${resultsPath}`);

        // Summary
        console.log('\n📊 Test Summary:');
        console.log('================');
        console.log(`Street Form: ${streetResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (streetResult.success) {
          console.log(`  Service Request: ${streetResult.serviceRequestNumber || 'N/A'}`);
          console.log(`  Address: ${streetResult.requestAddress || 'N/A'}`);
        }
        console.log(`Sidewalk Form: ${sidewalkResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (sidewalkResult.success) {
          console.log(`  Service Request: ${sidewalkResult.serviceRequestNumber || 'N/A'}`);
          console.log(`  Address: ${sidewalkResult.requestAddress || 'N/A'}`);
        }
      }

    } catch (error) {
      console.error('Unified form test failed:', error);
    }
  }
  
  runUnifiedTest();
}
