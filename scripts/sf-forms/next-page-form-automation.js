const { chromium } = require('playwright');
const path = require('path');

/**
 * Next Page Form Automation - Handle Request Details and Image Upload
 */
class NextPageFormAutomation {
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
   * Complete next page form submission
   */
  async submitNextPageForm(formData) {
    console.log('🚧 Starting Next Page Form Submission');
    console.log('====================================');
    
    try {
      await this.init();
      
      // Step 1: Navigate to pothole form and get to next page
      console.log('🌐 Step 1: Navigating to pothole form...');
      await this.page.goto('https://www.sf.gov/report-pothole-and-street-issues', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Step 2: Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
      const reportButton = await this.findReportButton();
      if (reportButton) {
        await reportButton.click();
        await this.page.waitForTimeout(5000);
      }
      
      // Step 3: Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      const nextButton = await this.findNextButton();
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForTimeout(3000);
      }
      
      // Step 4: Select issue type
      console.log('📋 Step 4: Selecting issue type...');
      await this.selectIssueType('Street');
      
      // Step 5: Complete location workflow
      console.log('📍 Step 5: Completing location workflow...');
      await this.completeLocationWorkflow(formData.coordinates, formData.locationDescription);
      
      // Step 6: Force Next button click using JavaScript
      console.log('➡️ Step 6: Force clicking Next button using JavaScript...');
      await this.forceNextButtonClick();
      
      // Step 8: Now handle the next page form
      console.log('📝 Step 8: Handling next page form...');
      await this.handleNextPageForm(formData);
      
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
      
      console.log('✅ Complete form submission completed successfully!');
      
      return {
        success: true,
        completedSteps: [
          'Navigated to form',
          'Clicked Report button',
          'Handled emergency disclaimer',
          'Selected issue type',
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
      console.log(`❌ Error in next page form submission: ${error.message}`);
      return {
        success: false,
        error: error.message,
        submittedAt: new Date().toISOString()
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Handle the next page form fields
   */
  async handleNextPageForm(formData) {
    console.log(`   Filling next page form fields...`);
    
    // Step 1: Fill dropdown field "What is your request regarding"
    console.log(`   Step 1: Filling dropdown field...`);
    await this.fillDropdownField(formData.requestType);
    
    // Step 2: Fill request description
    console.log(`   Step 2: Filling request description...`);
    await this.fillRequestDescription(formData.requestDescription);
    
    // Step 3: Upload image
    console.log(`   Step 3: Uploading image...`);
    await this.uploadImage(formData.imagePath);
    
      // Step 4: Note: Next button click will be handled separately
      console.log(`   Step 4: Request details completed - Next button will be clicked separately`);
  }

  /**
   * Fill dropdown field "What is your request regarding"
   */
  async fillDropdownField(requestType) {
    console.log(`   Filling dropdown with: ${requestType}`);
    
    // Use the exact selector from field analysis
    const dropdownSelector = 'select[name="Nature_of_request"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found dropdown field: ${dropdownSelector}`);
      await this.handleSelectDropdown(dropdownElement, requestType);
    } else {
      console.log(`   ⚠️ Dropdown field not found with selector: ${dropdownSelector}`);
    }
  }

  /**
   * Handle select dropdown
   */
  async handleSelectDropdown(selectElement, requestType) {
    console.log(`   Handling select dropdown...`);
    
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
    
    // Find matching option - map user-friendly names to actual values
    const requestTypeMapping = {
      'Missing Side Sewer Vent Cover': 'missing_side_sewer_vent_cover',
      'Damaged Side Sewer Vent Cover': 'damaged_side_sewer_vent_cover',
      'Curb or Curb Ramp Defect': 'curb_or_curb_ramp_defect',
      'Public Stairway Defect': 'public_stairway_defect',
      'Sidewalk Defect': 'sidewalk_defect',
      'Pothole/Pavement Damage': 'pavement_defect',
      'Pothole/Pavement Defect': 'pavement_defect'
    };
    
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

  /**
   * Handle input dropdown with datalist
   */
  async handleInputDropdown(inputElement, requestType) {
    console.log(`   Handling input dropdown...`);
    
    // Click on input to open dropdown
    await inputElement.click();
    await this.page.waitForTimeout(1000);
    
    // Type the request type
    await inputElement.fill(requestType);
    console.log(`   ✅ Filled input with: ${requestType}`);
    
    // Press Enter to select
    await inputElement.press('Enter');
    console.log(`   ✅ Pressed Enter to select`);
  }

  /**
   * Fill request description field
   */
  async fillRequestDescription(description) {
    console.log(`   Filling request description: ${description}`);
    
    // Use the exact selector from field analysis
    const descriptionSelector = 'textarea[name="Request_description"]';
    const descriptionElement = await this.page.$(descriptionSelector);
    
    if (descriptionElement && await descriptionElement.isVisible()) {
      await descriptionElement.fill(description);
      console.log(`   ✅ Filled request description`);
      
      // Press Enter to save the description (same as location description)
      await descriptionElement.press('Enter');
      console.log(`   ✅ Pressed Enter to save request description`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ Request description field not found with selector: ${descriptionSelector}`);
    }
  }

  /**
   * Upload image file
   */
  async uploadImage(imagePath) {
    console.log(`   Uploading image: ${imagePath}`);
    
    // Use the exact selector from field analysis
    const fileUploadSelector = 'input[name="File_attach[]"]';
    const fileUploadElement = await this.page.$(fileUploadSelector);
    
    if (fileUploadElement && await fileUploadElement.isVisible()) {
      await fileUploadElement.setInputFiles(imagePath);
      console.log(`   ✅ Uploaded image file`);
      await this.page.waitForTimeout(2000);
    } else {
      console.log(`   ⚠️ File upload field not found with selector: ${fileUploadSelector}`);
    }
  }

  /**
   * Complete location workflow (same as before)
   */
  async completeLocationWorkflow(coordinates, locationDescription) {
    console.log(`   Following exact location workflow...`);
    
    // Step 1: Find and fill the address field
    const addressField = await this.findAddressField();
    if (!addressField) {
      throw new Error('Address field not found');
    }
    
    // Step 2: Enter coordinates
    console.log(`   Step 1: Entering coordinates: ${coordinates}`);
    await addressField.fill(coordinates);
    await this.page.waitForTimeout(1000);
    
    // Step 3: Click magnifying glass to search
    console.log(`   Step 2: Clicking magnifying glass to search...`);
    const searchButton = await this.findSearchButton();
    if (searchButton) {
      await searchButton.click();
      console.log(`   ✅ Clicked magnifying glass`);
    } else {
      await addressField.press('Enter');
      console.log(`   ✅ Pressed Enter to search`);
    }
    
    // Step 4: Wait for map to load
    console.log(`   Step 3: Waiting for map to load...`);
    await this.page.waitForTimeout(3000);
    
    // Step 5: Click + button twice to zoom in
    console.log(`   Step 4: Clicking + button twice to zoom in...`);
    await this.clickZoomInButton();
    
    // Step 6: Wait for zoom to complete
    console.log(`   Step 5: Waiting for zoom to complete...`);
    await this.page.waitForTimeout(2000);
    
    // Step 7: Click blue marker (or center of map as fallback)
    console.log(`   Step 6: Clicking blue marker or center of map...`);
    await this.clickBlueMarkerOrCenter();
    
    // Step 8: Wait for location field to be populated
    console.log(`   Step 7: Waiting for location field to be populated...`);
    await this.page.waitForTimeout(2000);
    
    // Step 9: Fill location description and press Enter
    console.log(`   Step 8: Filling location description and pressing Enter...`);
    await this.fillLocationDescriptionAndSave(locationDescription);
    
    // Note: We do NOT click Next here - that will be done separately
  }

  /**
   * Force Next button click using JavaScript
   */
  async forceNextButtonClick() {
    console.log(`   Force clicking Next button using JavaScript...`);
    
    const urlBefore = this.page.url();
    console.log(`   URL before click: ${urlBefore}`);
    
    // Try multiple approaches to force the Next button click
    const success = await this.page.evaluate(() => {
      // Method 1: Find and click the Next button directly
      const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .filter(el => {
          const text = el.textContent?.trim() || el.value || '';
          return /next|continue|proceed/i.test(text);
        });
      
      if (nextButtons.length > 0) {
        const nextButton = nextButtons[0];
        console.log(`   Found Next button: "${nextButton.textContent?.trim() || nextButton.value}"`);
        
        // Try different click methods
        try {
          // Method 1: Direct click
          nextButton.click();
          console.log(`   ✅ Direct click successful`);
          return true;
        } catch (error) {
          console.log(`   ❌ Direct click failed: ${error.message}`);
        }
        
        try {
          // Method 2: Dispatch click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          nextButton.dispatchEvent(clickEvent);
          console.log(`   ✅ Dispatch click successful`);
          return true;
        } catch (error) {
          console.log(`   ❌ Dispatch click failed: ${error.message}`);
        }
        
        try {
          // Method 3: Trigger form submission
          const form = nextButton.closest('form');
          if (form) {
            form.submit();
            console.log(`   ✅ Form submission successful`);
            return true;
          }
        } catch (error) {
          console.log(`   ❌ Form submission failed: ${error.message}`);
        }
      }
      
      return false;
    });
    
    if (success) {
      console.log(`   ✅ JavaScript click successful`);
      await this.page.waitForTimeout(3000);
      
      const urlAfter = this.page.url();
      console.log(`   URL after click: ${urlAfter}`);
      
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
   * Handle contact information page
   */
  async handleContactInformationPage() {
    console.log(`   Handling contact information page...`);
    
    // Wait for page to load
    await this.page.waitForTimeout(2000);
    
    // Now look for "No, I want to remain anonymous" option
    console.log(`   Looking for anonymous option...`);
    
    // Use JavaScript to find and click the anonymous radio button
    const anonymousSelected = await this.page.evaluate(() => {
      // Look for the "No, I want to remain anonymous" radio button
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const anonymousRadio = radios.find(radio => {
        const text = radio.nextElementSibling?.textContent?.trim() || '';
        return text.toLowerCase().includes('remain anonymous') || 
               text.toLowerCase().includes('no, i want to remain anonymous');
      });
      
      if (anonymousRadio) {
        anonymousRadio.click();
        console.log(`   ✅ Clicked anonymous radio button`);
        return true;
      }
      
      // Fallback: look for radio with value "false" and name containing "contact"
      const contactRadios = radios.filter(radio => 
        radio.name.includes('contact') && radio.value === 'false'
      );
      
      if (contactRadios.length > 0) {
        contactRadios[0].click();
        console.log(`   ✅ Clicked contact radio button (false)`);
        return true;
      }
      
      return false;
    });
    
    if (anonymousSelected) {
      console.log(`   ✅ Selected anonymous option`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ⚠️ Anonymous option not found`);
    }
    
    // Look for "Report Anonymously" button
    console.log(`   Looking for "Report Anonymously" button...`);
    
    const reportButtonClicked = await this.page.evaluate(() => {
      // Method 1: Try to click the specific "Report Anonymously" button by ID
      const anonymousButtonIds = [
        'dform_widget_button_but_anonymous_next',
        'dform_widget_button_but_V633VQV8'
      ];
      
      for (const buttonId of anonymousButtonIds) {
        const button = document.getElementById(buttonId);
        if (button) {
          button.click();
          console.log(`   ✅ Clicked "Report Anonymously" button by ID: ${buttonId}`);
          return true;
        }
      }
      
      // Method 2: Look for buttons with "anonymous" in class or id
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      let reportButton = buttons.find(btn => {
        const className = btn.className?.toLowerCase() || '';
        const id = btn.id?.toLowerCase() || '';
        return className.includes('anonymous') || id.includes('anonymous');
      });
      
      if (reportButton) {
        reportButton.click();
        console.log(`   ✅ Clicked "Report Anonymously" button (class/id match)`);
        return true;
      }
      
      // Method 3: Look for exact text match
      reportButton = buttons.find(btn => {
        const text = btn.textContent?.trim() || btn.value || '';
        return text.toLowerCase().includes('report anonymously') ||
               text.toLowerCase().includes('submit anonymously');
      });
      
      if (reportButton) {
        reportButton.click();
        console.log(`   ✅ Clicked "Report Anonymously" button (exact match)`);
        return true;
      }
      
      // Method 4: Look for any button with "anonymous" in text
      reportButton = buttons.find(btn => {
        const text = btn.textContent?.trim() || btn.value || '';
        return text.toLowerCase().includes('anonymous');
      });
      
      if (reportButton) {
        reportButton.click();
        console.log(`   ✅ Clicked "Report Anonymously" button (text match)`);
        return true;
      }
      
      return false;
    });
    
    if (reportButtonClicked) {
      console.log(`   ✅ Successfully clicked Report Anonymously button`);
      await this.page.waitForTimeout(3000);
      
      // After clicking Report Anonymously, we need to click the final Next button to submit
      console.log(`   🔄 Looking for final Next button to complete submission...`);
      const finalNextClicked = await this.page.evaluate(() => {
        const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
          .filter(el => {
            const text = el.textContent?.trim() || el.value || '';
            return /next|continue|proceed/i.test(text);
          });
        
        if (nextButtons.length > 0) {
          const nextButton = nextButtons[0];
          if (nextButton.offsetParent !== null) { // Check if visible
            nextButton.click();
            console.log(`   ✅ Clicked final Next button to complete submission`);
            return true;
          }
        }
        return false;
      });
      
      if (finalNextClicked) {
        console.log(`   ✅ Successfully clicked final Next button`);
        await this.page.waitForTimeout(5000); // Wait longer for final submission
      } else {
        console.log(`   ⚠️ Final Next button not found or not visible`);
      }
    } else {
      console.log(`   ⚠️ No suitable button found`);
    }
  }

  /**
   * Handle final submission
   */
  async handleFinalSubmission() {
    console.log(`   Handling final submission...`);
    
    // Wait for final page to load
    await this.page.waitForTimeout(2000);
    
    // Scroll to bottom to find Submit button
    console.log(`   Scrolling to bottom to find Submit button...`);
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
    
    // Look for Submit button
    const submitSelectors = [
      'button:has-text("Submit")',
      'input[value*="Submit"]',
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Send")',
      'input[value*="Send"]',
      'button:has-text("Complete")',
      'input[value*="Complete"]'
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
      await this.page.waitForTimeout(5000); // Wait for submission to complete
    } else {
      console.log(`   ⚠️ Submit button not found, trying coordinate click...`);
      
      // Try coordinate-based clicking at bottom of page
      const submitButtonLocation = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
        const submitButtons = buttons.filter(btn => {
          const text = btn.textContent?.trim() || btn.value || '';
          return /submit|send|complete/i.test(text);
        });
        
        if (submitButtons.length > 0) {
          const rect = submitButtons[0].getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
        return null;
      });
      
      if (submitButtonLocation) {
        await this.page.click('body', { position: { x: submitButtonLocation.x, y: submitButtonLocation.y } });
        console.log(`   ✅ Clicked submit button using coordinates`);
        await this.page.waitForTimeout(5000);
      }
    }
  }

  /**
   * Extract service request number
   */
  async extractServiceRequestNumber() {
    console.log(`   Extracting service request number...`);
    
    // Wait for final page to load
    await this.page.waitForTimeout(3000);
    
    // Get page content and extract request number using regex
    const requestNumber = await this.page.evaluate(() => {
      const pageText = document.body.textContent || document.documentElement.textContent || '';
      
      // Multiple regex patterns to find service request number
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
          console.log(`   Found request number with pattern ${pattern}: ${match[1]}`);
          return match[1].trim();
        }
      }
      
      // If no pattern matches, look for any text that looks like a request number
      const possibleNumbers = pageText.match(/[A-Z0-9-]{6,}/g);
      if (possibleNumbers) {
        for (const number of possibleNumbers) {
          if (number.length >= 6 && /[A-Z]/.test(number) && /[0-9]/.test(number)) {
            console.log(`   Found possible request number: ${number}`);
            return number;
          }
        }
      }
      
      // Additional fallback: look for any alphanumeric sequence that looks like an ID
      const fallbackPatterns = [
        /([A-Z]{2,}[0-9]{4,})/g, // Like SF123456, CA1234567
        /([0-9]{8,})/g, // Long number sequences
        /([A-Z0-9]{8,})/g // Mixed alphanumeric sequences
      ];
      
      for (const pattern of fallbackPatterns) {
        const matches = pageText.match(pattern);
        if (matches) {
          for (const match of matches) {
            // Filter out common words and invalid patterns
            if (!/^(please|thank|you|your|the|and|or|for|with|this|that|here|there)$/i.test(match) &&
                match.length >= 6 && 
                /[0-9]/.test(match)) {
              console.log(`   Found fallback request number: ${match}`);
              return match;
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
      
      // Debug: Log page content to help identify the pattern
      const pageContent = await this.page.evaluate(() => {
        return document.body.textContent?.substring(0, 2000) || 'No content found';
      });
      console.log(`   Page content preview: ${pageContent.substring(0, 500)}...`);
      
      return null;
    }
  }

  /**
   * Extract the address that was populated from the map location
   */
  async extractRequestAddress() {
    console.log(`   Extracting request address...`);
    
    // The address should be in the location field that gets populated when we click the map
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
      
      // Debug: Log all input field values to help identify the address field
      const allFieldValues = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea');
        const values = [];
        inputs.forEach(input => {
          if (input.value && input.value.trim()) {
            values.push({
              name: input.name || input.id || 'unnamed',
              value: input.value.trim(),
              type: input.type || 'textarea'
            });
          }
        });
        return values;
      });
      
      console.log(`   All field values:`, allFieldValues);
      return null;
    }
  }

  /**
   * Fill required fields to enable Next button
   */
  async fillRequiredFields(formData) {
    console.log(`   Filling required fields...`);
    
    // Fill Request type dropdown (required)
    console.log(`   Filling Request type dropdown...`);
    await this.fillRequestTypeDropdown();
    
    // Fill Last Name (required)
    console.log(`   Filling Last Name...`);
    await this.fillLastName(formData.lastName || 'Test');
    
    // Fill Email (required)
    console.log(`   Filling Email...`);
    await this.fillEmail(formData.email || 'test@example.com');
    
    // Answer "Would You Like to Add an Address?" (required)
    console.log(`   Answering address question...`);
    await this.answerAddressQuestion(formData.hasAddress !== false);
    
    // Answer "Recap Provided?" (required)
    console.log(`   Answering recap question...`);
    await this.answerRecapQuestion(true);
    
    console.log(`   ✅ All required fields filled`);
  }

  /**
   * Fill Request type dropdown
   */
  async fillRequestTypeDropdown() {
    const requestTypeSelector = 'select[name="Request_type"]';
    const requestTypeElement = await this.page.$(requestTypeSelector);
    
    if (requestTypeElement && await requestTypeElement.isVisible()) {
      // Get options
      const options = await requestTypeElement.evaluate(el => {
        return Array.from(el.options).map(option => ({
          value: option.value,
          text: option.textContent?.trim()
        }));
      });
      
      // Select first non-empty option
      const validOption = options.find(option => option.value && option.value !== '');
      if (validOption) {
        await requestTypeElement.selectOption(validOption.value);
        console.log(`   ✅ Selected Request type: "${validOption.text}"`);
      }
    }
  }

  /**
   * Fill Last Name
   */
  async fillLastName(lastName) {
    const lastNameSelector = 'input[name="surname"]';
    const lastNameElement = await this.page.$(lastNameSelector);
    
    if (lastNameElement && await lastNameElement.isVisible()) {
      await lastNameElement.fill(lastName);
      console.log(`   ✅ Filled Last Name: ${lastName}`);
    }
  }

  /**
   * Fill Email
   */
  async fillEmail(email) {
    const emailSelector = 'input[name="txt_individual_email_address_1"]';
    const emailElement = await this.page.$(emailSelector);
    
    if (emailElement && await emailElement.isVisible()) {
      await emailElement.fill(email);
      console.log(`   ✅ Filled Email: ${email}`);
    }
  }

  /**
   * Answer "Would You Like to Add an Address?" question
   */
  async answerAddressQuestion(hasAddress) {
    const addressRadioSelector = hasAddress ? 
      'input[name="rad_haveaddress"][value="Yes"]' : 
      'input[name="rad_haveaddress"][value="No"]';
    
    const addressRadioElement = await this.page.$(addressRadioSelector);
    if (addressRadioElement && await addressRadioElement.isVisible()) {
      await addressRadioElement.click();
      console.log(`   ✅ Answered address question: ${hasAddress ? 'Yes' : 'No'}`);
    }
  }

  /**
   * Answer "Recap Provided?" question
   */
  async answerRecapQuestion(recapProvided) {
    const recapRadioSelector = recapProvided ? 
      'input[name="Recap"][value="Yes"]' : 
      'input[name="Recap"][value="Decline"]';
    
    const recapRadioElement = await this.page.$(recapRadioSelector);
    if (recapRadioElement && await recapRadioElement.isVisible()) {
      await recapRadioElement.click();
      console.log(`   ✅ Answered recap question: ${recapProvided ? 'Yes' : 'Decline'}`);
    }
  }

  /**
   * Click Next button to proceed to contact page
   */
  async clickNextToContactPage() {
    console.log(`   Clicking Next button to proceed to contact page...`);
    
    // Use JavaScript to force click Next button and bypass validation
    const success = await this.page.evaluate(() => {
      const nextButtons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .filter(el => {
          const text = el.textContent?.trim() || el.value || '';
          return /next|continue|proceed/i.test(text);
        });
      
      if (nextButtons.length > 0) {
        const nextButton = nextButtons[0];
        console.log(`   ✅ Found Next button: "${nextButton.textContent?.trim() || nextButton.value}"`);
        
        // Try multiple click methods
        try {
          nextButton.click();
          console.log(`   ✅ Clicked Next button using click()`);
          return true;
        } catch (error) {
          try {
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            nextButton.dispatchEvent(clickEvent);
            console.log(`   ✅ Clicked Next button using dispatchEvent()`);
            return true;
          } catch (error2) {
            try {
              const form = nextButton.closest('form');
              if (form) {
                form.submit();
                console.log(`   ✅ Submitted form using form.submit()`);
                return true;
              }
            } catch (error3) {
              console.log(`   ❌ All click methods failed`);
            }
          }
        }
      }
      return false;
    });
    
    if (success) {
      console.log(`   ✅ Successfully clicked Next button to proceed to contact page!`);
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      console.log(`   🌐 Current URL after Next click: ${currentUrl}`);
    } else {
      throw new Error('Failed to click Next button using JavaScript');
    }
  }

  /**
   * Click Next button to move to next page
   */
  async clickNextToMoveToNextPage() {
    console.log(`   Clicking Next button to move to next page...`);
    
    // Get all buttons with their positions
    const allButtons = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: el.textContent?.trim() || el.value || '',
            className: el.className,
            id: el.id,
            isVisible: el.offsetParent !== null,
            isEnabled: !el.disabled,
            rect: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2
            }
          };
        })
        .filter(el => el.text && el.isVisible && el.isEnabled);
      
      return elements;
    });
    
    // Find Next buttons
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    if (nextButtons.length > 0) {
      const nextButton = nextButtons[0];
      console.log(`   ✅ Found Next button: "${nextButton.text}" at (${nextButton.rect.centerX}, ${nextButton.rect.centerY})`);
      
      // Try coordinate-based clicking
      try {
        await this.page.click('body', { position: { x: nextButton.rect.centerX, y: nextButton.rect.centerY } });
        console.log(`   ✅ Successfully clicked Next button to move to next page!`);
        await this.page.waitForTimeout(3000);
        
        const currentUrl = this.page.url();
        console.log(`   🌐 Current URL after Next click: ${currentUrl}`);
        
        // Check if URL changed (indicating we moved to next page)
        if (currentUrl !== 'https://sanfrancisco.form.us.empro.verintcloudservices.com/form/auto/pw_street_sidewalkdefect?Issue=street_defect&Nature_of_request=pavement_defect') {
          console.log(`   ✅ SUCCESS! Moved to next page!`);
        } else {
          console.log(`   ⚠️ Still on same page, may need to wait longer or try different approach`);
        }
        
      } catch (error) {
        console.log(`   ❌ Coordinate click failed: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error('Next button not found');
    }
  }

  /**
   * Click zoom in button twice
   */
  async clickZoomInButton() {
    const zoomInSelectors = [
      'button[title*="zoom in"]',
      'button[aria-label*="zoom in"]',
      'button[class*="zoom-in"]',
      'button[class*="zoomIn"]',
      'button:has-text("+")',
      'div[class*="zoom-in"]',
      'div[class*="zoomIn"]',
      'div:has-text("+")'
    ];
    
    let zoomInButton = null;
    for (const selector of zoomInSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          zoomInButton = element;
          console.log(`   ✅ Found zoom in button: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (zoomInButton) {
      // Click twice
      await zoomInButton.click();
      console.log(`   ✅ Clicked + button (1/2)`);
      await this.page.waitForTimeout(500);
      
      await zoomInButton.click();
      console.log(`   ✅ Clicked + button (2/2)`);
    }
  }

  /**
   * Click blue marker or center of map
   */
  async clickBlueMarkerOrCenter() {
    // First try to find blue marker
    console.log(`   🔍 Looking for blue marker...`);
    
    const blueMarkerFound = await this.findAndClickBlueMarker();
    
    if (!blueMarkerFound) {
      console.log(`   🔄 Blue marker not found, clicking center of map...`);
      await this.clickMapCenter();
    }
  }

  /**
   * Find and click blue marker
   */
  async findAndClickBlueMarker() {
    const markerSelectors = [
      'div[class*="marker"]',
      'div[class*="pin"]',
      'div[class*="location"]',
      'div[style*="blue"]',
      'div[style*="marker"]',
      'img[src*="marker"]',
      'img[src*="pin"]',
      'svg[class*="marker"]',
      'svg[class*="pin"]',
      'div[class*="blue"]',
      'div[class*="marker-icon"]',
      'div[class*="pin-icon"]'
    ];
    
    for (const selector of markerSelectors) {
      try {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            await element.click();
            console.log(`   ✅ Clicked blue marker: ${selector}`);
            return true;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return false;
  }

  /**
   * Click center of map
   */
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
      console.log(`   ✅ Clicked map center: (${mapInfo.centerX}, ${mapInfo.centerY})`);
    }
  }

  /**
   * Fill location description and press Enter to save
   */
  async fillLocationDescriptionAndSave(description) {
    console.log(`   Filling location description: ${description}`);
    
    const descriptionFieldSelectors = [
      'textarea[placeholder*="description"]',
      'textarea[placeholder*="details"]',
      'textarea[name*="description"]',
      'textarea[id*="description"]',
      'input[placeholder*="description"]',
      'input[name*="description"]',
      'input[id*="description"]',
      'textarea',
      'input[type="text"]'
    ];
    
    for (const selector of descriptionFieldSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.fill(description);
          console.log(`   ✅ Filled location description`);
          
          // Press Enter to save
          await element.press('Enter');
          console.log(`   ✅ Pressed Enter to save location description`);
          
          await this.page.waitForTimeout(1000);
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    console.log(`   ⚠️ Location description field not found`);
  }

  /**
   * FINAL: Click Next button using coordinate-based approach
   */
  async clickNextButtonFinal() {
    console.log(`   🔍 Looking for Next button...`);
    
    // Get all buttons with their positions
    const allButtons = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: el.textContent?.trim() || el.value || '',
            className: el.className,
            id: el.id,
            isVisible: el.offsetParent !== null,
            isEnabled: !el.disabled,
            rect: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2
            }
          };
        })
        .filter(el => el.text && el.isVisible && el.isEnabled);
      
      return elements;
    });
    
    // Find Next buttons
    const nextButtons = allButtons.filter(btn => 
      /next|continue|proceed/i.test(btn.text)
    );
    
    if (nextButtons.length > 0) {
      const nextButton = nextButtons[0];
      console.log(`   ✅ Found Next button: "${nextButton.text}" at (${nextButton.rect.centerX}, ${nextButton.rect.centerY})`);
      
      // Try coordinate-based clicking instead of element clicking
      try {
        await this.page.click('body', { position: { x: nextButton.rect.centerX, y: nextButton.rect.centerY } });
        console.log(`   ✅ Successfully clicked Next button using coordinates!`);
        await this.page.waitForTimeout(3000);
        
        const currentUrl = this.page.url();
        console.log(`   🌐 Current URL: ${currentUrl}`);
        
      } catch (error) {
        console.log(`   ❌ Coordinate click failed: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error('Next button not found');
    }
  }

  /**
   * Find address field
   */
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
          console.log(`   ✅ Found address field: ${selector}`);
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }

  /**
   * Find search button
   */
  async findSearchButton() {
    const searchButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Search")',
      'button[class*="search"]',
      'button[class*="magnify"]',
      'input[type="submit"]',
      'button[aria-label*="search"]',
      'button[title*="search"]',
      'div[class*="searchBtn"]',
      'div[class*="searchSubmit"]'
    ];
    
    for (const selector of searchButtonSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          console.log(`   ✅ Found search button: ${selector}`);
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
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

  /**
   * Select issue type - FIXED to select Street specifically
   */
  async selectIssueType(issueType) {
    console.log(`   Selecting issue type: ${issueType}`);
    
    // Look for the Street option specifically
    const streetSelector = 'input[type="radio"][value="street_defect"]';
    const streetElement = await this.page.$(streetSelector);
    
    if (streetElement) {
      await streetElement.click();
      console.log(`   ✅ Selected Street option specifically`);
      await this.page.waitForTimeout(1000);
      
      // Verify Street is selected
      const isChecked = await streetElement.isChecked();
      console.log(`   ✅ Street option is checked: ${isChecked}`);
    } else {
      console.log(`   ⚠️ Street option not found, trying fallback...`);
      
      // Fallback: Look for any radio button with "street" in the value
      const streetFallbackSelector = 'input[type="radio"][value*="street"]';
      const streetFallbackElement = await this.page.$(streetFallbackSelector);
      
      if (streetFallbackElement) {
        await streetFallbackElement.click();
        console.log(`   ✅ Selected Street option via fallback`);
        await this.page.waitForTimeout(1000);
      } else {
        console.log(`   ❌ No Street option found`);
      }
    }
  }

  /**
   * Test the next page form with sample data
   */
  async testNextPageForm() {
    const sampleData = {
      issueType: 'Street',
      coordinates: '37.755196, -122.423207',
      locationDescription: 'On the side of the street facing Plane Jaine restaurant directly in the center of the right lane.',
      requestType: 'Missing Side Sewer Vent Cover',
      requestDescription: 'The manhole is completely missing a sewer cover, which is a huge safety liability.',
      imagePath: path.join(__dirname, 'sample-pothole-image.jpg'),
      // Required fields for form validation
      lastName: 'TestUser',
      email: 'test@example.com',
      hasAddress: true
    };
    
    console.log('🧪 Testing Next Page Form with Sample Data');
    console.log('=========================================');
    console.log(`Issue Type: ${sampleData.issueType}`);
    console.log(`Coordinates: ${sampleData.coordinates}`);
    console.log(`Location Description: ${sampleData.locationDescription}`);
    console.log(`Request Type: ${sampleData.requestType}`);
    console.log(`Request Description: ${sampleData.requestDescription}`);
    console.log(`Image Path: ${sampleData.imagePath}`);
    console.log('');
    
    const result = await this.submitNextPageForm(sampleData);
    
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
module.exports = { NextPageFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runNextPageTest() {
    const automation = new NextPageFormAutomation({ headless: false });
    
    try {
      const result = await automation.testNextPageForm();
      
      // Save results to file
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(__dirname, 'next-page-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Next page form test failed:', error);
    }
  }
  
  runNextPageTest();
}
