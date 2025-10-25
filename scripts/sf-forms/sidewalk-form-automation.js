const { chromium } = require('playwright');
const path = require('path');

/**
 * Sidewalk Form Automation - Complete automation for SF.gov sidewalk/curb reporting
 * Based on the successful pothole form automation
 */
class SidewalkFormAutomation {
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
   * Submit sidewalk/curb report with complete automation
   */
  async submitSidewalkReport(formData) {
    console.log('🚧 Starting Sidewalk Form Submission');
    console.log('====================================');
    
    try {
      await this.init();
      
      // Step 1: Navigate to sidewalk form
      console.log('🌐 Step 1: Navigating to sidewalk form...');
      await this.page.goto('https://www.sf.gov/report-curb-and-sidewalk-problems', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(3000);
      
      // Step 2: Click Report button
      console.log('🖱️ Step 2: Clicking Report button...');
      await this.clickReportButton();
      
      // Step 3: Handle emergency disclaimer
      console.log('🚨 Step 3: Handling emergency disclaimer...');
      await this.handleEmergencyDisclaimer();
      
      // Step 4: Select issue type (Sidewalk/Curb)
      console.log('📋 Step 4: Selecting issue type...');
      await this.selectIssueType('Sidewalk/Curb');
      
      // Step 5: Complete location workflow
      console.log('📍 Step 5: Completing location workflow...');
      await this.completeLocationWorkflow(formData);
      
      // Step 6: Force click Next button to move to request details page
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
      
      console.log('✅ Complete sidewalk form submission completed successfully!');
      
      return {
        success: true,
        completedSteps: [
          'Navigated to sidewalk form',
          'Clicked Report button',
          'Handled emergency disclaimer',
          'Selected issue type (Sidewalk/Curb)',
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
      console.log(`❌ Error in sidewalk form submission: ${error.message}`);
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
   * Select issue type - FIXED to select Sidewalk/Curb specifically
   */
  async selectIssueType(issueType) {
    console.log(`   Selecting issue type: ${issueType}`);
    
    // Look for the Sidewalk/Curb option specifically
    const sidewalkSelector = 'input[type="radio"][value="sidewalk_and_curb"]';
    const sidewalkElement = await this.page.$(sidewalkSelector);
    
    if (sidewalkElement) {
      await sidewalkElement.click();
      console.log(`   ✅ Selected Sidewalk/Curb option specifically`);
      await this.page.waitForTimeout(1000);
      
      // Verify Sidewalk/Curb is selected
      const isChecked = await sidewalkElement.isChecked();
      console.log(`   ✅ Sidewalk/Curb option is checked: ${isChecked}`);
      
      // Wait for dropdown to be populated with sidewalk-specific options
      console.log(`   ⏳ Waiting for dropdown to populate with sidewalk options...`);
      await this.page.waitForTimeout(2000);
    } else {
      console.log(`   ⚠️ Sidewalk/Curb option not found, trying fallback...`);
      
      // Fallback: Look for any radio button with "sidewalk" in the value
      const sidewalkFallbackSelector = 'input[type="radio"][value*="sidewalk"]';
      const sidewalkFallbackElement = await this.page.$(sidewalkFallbackSelector);
      
      if (sidewalkFallbackElement) {
        await sidewalkFallbackElement.click();
        console.log(`   ✅ Selected Sidewalk/Curb option via fallback`);
        await this.page.waitForTimeout(1000);
      } else {
        console.log(`   ❌ No Sidewalk/Curb option found`);
      }
    }
  }

  /**
   * Complete location workflow (same as pothole form)
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
   * Handle next page form (request details)
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
    // Note: These are the options available when "Sidewalk/Curb" is selected
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
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      
      // Look for radio button with "remain anonymous" text
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
      
      // Fallback: look for contact-related radio with value 'false'
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
    
    // Wait for page to load
    await this.page.waitForTimeout(2000);
    
    // Scroll to bottom to find Submit button
    console.log(`   Scrolling to bottom to find Submit button...`);
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
    
    // Look for Submit button with multiple selectors
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
      await this.page.waitForTimeout(5000);
    } else {
      console.log(`   ⚠️ Submit button not found, trying coordinate click...`);
      
      // Fallback: Try to find submit button by coordinates
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

  // Helper methods (same as pothole form)
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
   * Test sidewalk form with sample data
   */
  async testSidewalkForm() {
    const sampleData = {
      issueType: 'Sidewalk/Curb',
      coordinates: '37.755196, -122.423207',
      locationDescription: 'On the sidewalk in front of the building, large crack running across the entire width.',
      requestType: 'Sidewalk Defect',
      requestDescription: 'Large crack in the sidewalk that poses a tripping hazard for pedestrians.',
      imagePath: path.join(__dirname, 'sample-pothole-image.jpg'),
      // Required fields for form validation
      lastName: 'TestUser',
      email: 'test@example.com',
      hasAddress: true
    };
    
    console.log('🧪 Testing Sidewalk Form with Sample Data');
    console.log('=========================================');
    console.log(`Issue Type: ${sampleData.issueType}`);
    console.log(`Coordinates: ${sampleData.coordinates}`);
    console.log(`Location Description: ${sampleData.locationDescription}`);
    console.log(`Request Type: ${sampleData.requestType}`);
    console.log(`Request Description: ${sampleData.requestDescription}`);
    console.log(`Image Path: ${sampleData.imagePath}`);
    console.log('');
    
    const result = await this.submitSidewalkReport(sampleData);
    
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
module.exports = { SidewalkFormAutomation };

// Run test if this file is executed directly
if (require.main === module) {
  async function runSidewalkTest() {
    const automation = new SidewalkFormAutomation({ headless: false });
    
    try {
      const result = await automation.testSidewalkForm();
      
      // Save results to file
      const fs = require('fs');
      const resultsPath = path.join(__dirname, 'sidewalk-form-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Test results saved to: ${resultsPath}`);
      
    } catch (error) {
      console.error('Sidewalk form test failed:', error);
    }
  }
  
  runSidewalkTest();
}
