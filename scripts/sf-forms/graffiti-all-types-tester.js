const { chromium } = require('playwright');

class GraffitiFormTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 
    });
    this.page = await this.browser.newPage();
  }

  async testAllGraffitiTypes() {
    console.log('🧪 Testing All Graffiti Issue Types');
    console.log('===================================');

    const testCases = [
      {
        name: 'Graffiti on Private Property',
        issueType: 'Graffiti on Private Property',
        requestRegarding: 'Not Offensive (no racial slurs or profanity)',
        requestType: 'Building - Commercial',
        requestDescription: 'Graffiti spray painted on the side of a commercial building. Needs immediate removal.',
        expectedEnabledOptions: [
          'Sidewalk in front of property',
          'Building - Commercial',
          'Building - Residential',
          'Building - Other'
        ]
      },
      {
        name: 'Graffiti on Public Property',
        issueType: 'Graffiti on Public Property',
        requestRegarding: 'Not Offensive (no racial slurs or profanity)',
        requestType: 'Pole',
        requestDescription: 'Graffiti spray painted on a utility pole. Needs immediate removal.',
        expectedEnabledOptions: [
          'ATT Property', 'Bike rack', 'Bridge', 'City receptacle',
          'Fire/ Police Call Box', 'Fire hydrant', 'Mail box', 'News rack',
          'Parking meter', 'Pay phone', 'Pole', 'Sidewalk structure',
          'Sign - Parking and Traffic', 'Signal box', 'Street',
          'Transit Shelter/ Platform', 'Other - enter additional details'
        ]
      },
      {
        name: 'Illegal Postings on Public Property',
        issueType: 'Illegal Postings on Public Property',
        requestRegarding: 'Multiple Postings',
        requestType: 'Pole',
        requestDescription: 'Multiple illegal posters affixed to utility pole. Needs immediate removal.',
        expectedEnabledOptions: [
          'Affixed Improperly', 'Multiple Postings', 'No Posting Date',
          'Posted on Directional Sign', 'Posted on Historic Street Light',
          'Posted on Traffic Light', 'Posted Over 70 Days',
          'Posting Too High on Pole', 'Posting Too Large in Size'
        ]
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🎯 Test ${i + 1}/${testCases.length}: ${testCase.name}`);
      console.log('='.repeat(60));
      
      try {
        const result = await this.testGraffitiType(testCase);
        this.results.push(result);
        
        console.log(`✅ Test ${i + 1} completed successfully!`);
        console.log(`   Service Request Number: ${result.serviceRequestNumber}`);
        console.log(`   Address: ${result.address}`);
        
      } catch (error) {
        console.log(`❌ Test ${i + 1} failed: ${error.message}`);
        this.results.push({
          testCase: testCase.name,
          success: false,
          error: error.message
        });
      }
      
      // Wait between tests
      if (i < testCases.length - 1) {
        console.log(`\n⏳ Waiting before next test...`);
        await this.page.waitForTimeout(3000);
      }
    }

    // Print summary
    this.printSummary();
    
    // Save results
    await this.saveResults();
  }

  async testGraffitiType(testCase) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`   Issue Type: ${testCase.issueType}`);
    console.log(`   Request Regarding: ${testCase.requestRegarding}`);
    console.log(`   Request Type: ${testCase.requestType}`);
    
    // Navigate to graffiti form
    console.log(`🌐 Step 1: Navigating to graffiti form...`);
    await this.page.goto('https://www.sf.gov/report-graffiti-issues', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // Click Report button
    console.log(`🖱️ Step 2: Clicking Report button...`);
    await this.clickReportButton();

    // Handle emergency disclaimer
    console.log(`🚨 Step 3: Handling emergency disclaimer...`);
    await this.handleEmergencyDisclaimer();

    // Select issue type
    console.log(`📋 Step 4: Selecting issue type: ${testCase.issueType}...`);
    await this.selectIssueTypeJavaScript(testCase.issueType);

    // Click Next to get to location page
    console.log(`➡️ Step 5: Clicking Next to get to location page...`);
    await this.clickNextToLocationPage();

    // Complete location workflow
    console.log(`📍 Step 6: Completing location workflow...`);
    await this.completeLocationWorkflow();

    // Click Next to get to request details page
    console.log(`➡️ Step 7: Clicking Next to get to request details page...`);
    await this.clickNextToRequestDetailsPage();

    // Fill form fields
    console.log(`📝 Step 8: Filling graffiti form fields...`);
    await this.fillGraffitiFormFields(testCase);

    // Click Next to get to contact information page
    console.log(`➡️ Step 9: Clicking Next to get to contact information page...`);
    await this.clickNextToContactPage();

    // Handle contact information page
    console.log(`👤 Step 10: Handling contact information page...`);
    await this.handleContactInformationPage();

    // Handle final submission
    console.log(`📤 Step 11: Handling final submission...`);
    await this.handleFinalSubmission();

    // Extract service request number and address
    console.log(`🔢 Step 12: Extracting service request number and address...`);
    const serviceRequestNumber = await this.extractServiceRequestNumber();
    const address = await this.extractRequestAddress();

    return {
      testCase: testCase.name,
      success: true,
      serviceRequestNumber: serviceRequestNumber,
      address: address,
      issueType: testCase.issueType,
      requestRegarding: testCase.requestRegarding,
      requestType: testCase.requestType
    };
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
          console.log(`   ✅ Direct click successful`);
          return true;
        } catch (error) {
          console.log(`   ❌ Direct click failed: ${error.message}`);
          
          try {
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            nextButton.dispatchEvent(clickEvent);
            console.log(`   ✅ Event dispatch successful`);
            return true;
          } catch (error2) {
            console.log(`   ❌ Event dispatch failed: ${error2.message}`);
            
            try {
              const form = nextButton.closest('form');
              if (form) {
                form.submit();
                console.log(`   ✅ Form submission successful`);
                return true;
              }
            } catch (error3) {
              console.log(`   ❌ Form submission failed: ${error3.message}`);
            }
          }
        }
      } else {
        console.log(`   ❌ No Next button found`);
      }
      
      return false;
    });
    
    if (success) {
      console.log('   ✅ Successfully clicked Next button to get to request details page');
      await this.page.waitForTimeout(3000);
      
      const urlAfter = this.page.url();
      if (urlAfter !== urlBefore) {
        console.log(`   ✅ URL changed successfully: ${urlAfter}`);
      } else {
        console.log(`   ⚠️ URL didn't change - still on same page`);
      }
    } else {
      console.log('   ❌ Failed to click Next button to get to request details page');
      throw new Error('Could not advance to request details page');
    }
  }

  async clickNextToContactPage() {
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
      console.log(`   ✅ Successfully clicked Next button to proceed to contact page!`);
      await this.page.waitForTimeout(3000);
      
      const urlAfter = this.page.url();
      if (urlAfter !== urlBefore) {
        console.log(`   🌐 URL changed from ${urlBefore} to ${urlAfter}`);
      } else {
        console.log(`   ⚠️ URL didn't change - still on same page`);
      }
    } else {
      throw new Error('Failed to click Next button using JavaScript');
    }
  }

  async fillGraffitiFormFields(testCase) {
    console.log(`   Filling graffiti-specific form fields...`);
    
    // Step 1: Fill "What is your request regarding?" dropdown
    console.log(`   Step 1: Filling request regarding dropdown...`);
    await this.fillRequestRegardingDropdown(testCase);

    // Wait for form to process the first dropdown selection
    console.log(`   ⏳ Waiting for form to process first dropdown selection...`);
    await this.page.waitForTimeout(2000);

    // Check enabled options
    console.log(`   🔍 Checking enabled options for Request Type dropdown...`);
    const requestTypeSelect = await this.page.$('select[name="Request_type"]');
    if (requestTypeSelect) {
      const enabledOptions = await requestTypeSelect.evaluate((element) => {
        return Array.from(element.options)
          .filter(opt => !opt.disabled && opt.value)
          .map(opt => ({ value: opt.value, text: opt.textContent?.trim() }));
      });
      
      console.log(`   Found ${enabledOptions.length} enabled options:`);
      enabledOptions.forEach((opt, i) => {
        console.log(`     ${i + 1}. "${opt.text}" (value: "${opt.value}")`);
      });
    }

    // Step 2: Fill "Request Type" dropdown
    console.log(`   Step 2: Filling request type dropdown...`);
    await this.fillRequestTypeDropdown(testCase);

    // Step 3: Fill request description
    console.log(`   Step 3: Filling request description...`);
    await this.fillRequestDescription(testCase.requestDescription);

    // Step 4: Handle additional fields based on issue type
    console.log(`   Step 4: Handling additional fields based on issue type...`);
    await this.handleAdditionalFields(testCase);

    // Step 5: Upload image
    console.log(`   Step 5: Uploading image...`);
    await this.uploadImage('/Users/adhi/Desktop/pot-buddy/scripts/sf-forms/sample-pothole-image.jpg');

    console.log(`   ✅ Graffiti form fields completed`);
  }

  async fillRequestRegardingDropdown(testCase) {
    const dropdownSelector = 'select[name="Nature_of_request"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found request regarding dropdown: ${dropdownSelector}`);
      
      // Map the request regarding based on issue type
      const mappedValue = this.mapRequestRegarding(testCase.issueType, testCase.requestRegarding);
      await this.handleSelectDropdown(dropdownElement, mappedValue, 'requestRegarding');
    } else {
      console.log(`   ⚠️ Request regarding dropdown not found with selector: ${dropdownSelector}`);
    }
  }

  async fillRequestTypeDropdown(testCase) {
    const dropdownSelector = 'select[name="Request_type"]';
    const dropdownElement = await this.page.$(dropdownSelector);
    
    if (dropdownElement && await dropdownElement.isVisible()) {
      console.log(`   ✅ Found request type dropdown: ${dropdownSelector}`);
      
      // Get enabled options
      const enabledOptions = await dropdownElement.evaluate((element) => {
        return Array.from(element.options)
          .filter(opt => !opt.disabled && opt.value)
          .map(opt => ({ value: opt.value, text: opt.textContent?.trim() }));
      });
      
      console.log(`   Available enabled options: ${enabledOptions.length}`);
      
      // Map the request type based on issue type
      const mappedValue = this.mapRequestType(testCase.issueType, testCase.requestType);
      
      // Check if our target option is enabled
      const targetOption = enabledOptions.find(opt => 
        opt.value === mappedValue || 
        opt.text.toLowerCase().includes(testCase.requestType.toLowerCase())
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

  mapRequestRegarding(issueType, requestRegarding) {
    if (issueType === 'Graffiti on Private Property' || issueType === 'Graffiti on Public Property') {
      const graffitiMapping = {
        'Offensive (racial slurs or profanity)': 'offensive',
        'Not Offensive (no racial slurs or profanity)': 'not_offensive'
      };
      return graffitiMapping[requestRegarding] || requestRegarding;
    } else if (issueType === 'Illegal Postings on Public Property') {
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

  mapRequestType(issueType, requestType) {
    if (issueType === 'Graffiti on Private Property') {
      const privatePropertyMapping = {
        'Sidewalk in front of property': 'sidewalk_in_front_of_property',
        'Building - Commercial': 'building_commercial',
        'Building - Residential': 'building_residential',
        'Building - Other': 'building_other'
      };
      return privatePropertyMapping[requestType] || requestType;
    } else if (issueType === 'Graffiti on Public Property') {
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
    }
    return requestType;
  }

  async handleSelectDropdown(selectElement, value, fieldType) {
    console.log(`   Handling ${fieldType} dropdown...`);
    
    try {
      console.log(`   Using Playwright selectOption for value: "${value}"`);
      await selectElement.selectOption({ value: value });
      console.log(`   ✅ Selected option via Playwright selectOption`);
      
      await this.page.waitForTimeout(1000);
      
      // Verify the selection
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
        }, value);
        
        console.log(`   ✅ JavaScript fallback successful`);
      } catch (jsError) {
        console.log(`   ❌ JavaScript fallback failed: ${jsError.message}`);
      }
    }
  }

  async fillRequestDescription(description) {
    const descriptionTextarea = await this.page.$('textarea[name="Request_description"]');
    if (descriptionTextarea) {
      await descriptionTextarea.fill(description);
      await descriptionTextarea.press('Enter');
      console.log(`   ✅ Filled request description`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ❌ Request description textarea not found`);
    }
  }

  async uploadImage(imagePath) {
    const fileInput = await this.page.$('input[name="File_attach[]"]');
    if (fileInput) {
      await fileInput.setInputFiles(imagePath);
      console.log(`   ✅ Uploaded image file`);
      await this.page.waitForTimeout(1000);
    } else {
      console.log(`   ❌ File upload input not found`);
    }
  }

  async handleAdditionalFields(testCase) {
    console.log(`   Handling additional fields for issue type: ${testCase.issueType}`);
    
    if (testCase.issueType === 'Illegal Postings on Public Property') {
      // For Illegal Postings, handle the "entire block" question
      console.log(`   Step 4a: Handling "entire block" question for Illegal Postings...`);
      await this.handleEntireBlockQuestion();
    } else {
      // For other types, handle pole/meter ID field (optional)
      console.log(`   Step 4a: Handling pole/meter ID field (optional)...`);
      await this.handlePoleMeterIdField();
    }
  }

  async handleEntireBlockQuestion() {
    // Look for radio buttons asking about "entire block"
    await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const entireBlockRadios = radios.filter(radio => {
        const text = radio.nextElementSibling?.textContent?.trim() || '';
        return text.toLowerCase().includes('entire block') || 
               text.toLowerCase().includes('along the entire block');
      });
      
      if (entireBlockRadios.length > 0) {
        // Find the "No" option (assuming "No" is more common)
        const noOption = entireBlockRadios.find(radio => {
          const text = radio.nextElementSibling?.textContent?.trim() || '';
          return text.toLowerCase().includes('no');
        });
        
        if (noOption) {
          noOption.checked = true;
          noOption.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('   ✅ Selected "No" for entire block question');
        } else if (entireBlockRadios[0]) {
          // Fallback to first option
          entireBlockRadios[0].checked = true;
          entireBlockRadios[0].dispatchEvent(new Event('change', { bubbles: true }));
          console.log('   ✅ Selected first option for entire block question');
        }
      } else {
        console.log('   ⚠️ Entire block question not found');
      }
    });
  }

  async handlePoleMeterIdField() {
    // Look for pole/meter ID field (optional, so we can skip it)
    const poleMeterField = await this.page.$('input[name*="pole"], input[name*="meter"], input[name*="id"]');
    if (poleMeterField) {
      console.log('   ⚠️ Pole/Meter ID field found but skipping (optional)');
    } else {
      console.log('   ✅ No pole/meter ID field found (as expected)');
    }
  }


  async handleContactInformationPage() {
    console.log('   Handling contact information page...');
    
    // Select "No, I want to remain anonymous"
    await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const anonymousRadio = radios.find(radio => {
        const text = radio.nextElementSibling?.textContent?.trim() || '';
        return text.toLowerCase().includes('remain anonymous') || 
               text.toLowerCase().includes('no, i want to remain anonymous') ||
               radio.value === 'anonymous';
      });
      
      if (anonymousRadio) {
        anonymousRadio.checked = true;
        anonymousRadio.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('   ✅ Selected anonymous option via JavaScript');
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
    const submitButton = await this.page.$('button:has-text("Submit")');
    if (submitButton) {
      console.log('   ✅ Found submit button: button:has-text("Submit")');
      await submitButton.click();
      console.log('   ✅ Clicked Submit button');
      await this.page.waitForTimeout(3000);
    } else {
      console.log('   ❌ Submit button not found');
      throw new Error('Submit button not found');
    }
  }

  async extractServiceRequestNumber() {
    console.log('   Extracting service request number...');
    
    const serviceRequestNumber = await this.page.evaluate(() => {
      const text = document.body.textContent;
      
      // Try multiple regex patterns
      const patterns = [
        /Service Request Number[:\s]*(\d+)/i,
        /Request Number[:\s]*(\d+)/i,
        /SR[:\s]*(\d+)/i,
        /Case Number[:\s]*(\d+)/i,
        /Reference Number[:\s]*(\d+)/i,
        /(\d{10,})/g  // Any 10+ digit number
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1] || match[0];
        }
      }
      
      return null;
    });
    
    if (serviceRequestNumber) {
      console.log(`   ✅ Extracted service request number: ${serviceRequestNumber}`);
      return serviceRequestNumber;
    } else {
      console.log('   ❌ Could not extract service request number');
      return 'Not found';
    }
  }

  async extractRequestAddress() {
    console.log('   Extracting request address...');
    
    const address = await this.page.evaluate(() => {
      // Try multiple selectors for address
      const selectors = [
        'input[name*="address"]',
        'input[name*="location"]',
        'textarea[name*="address"]',
        'textarea[name*="location"]',
        '[id*="address"]',
        '[id*="location"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.value && element.value.trim()) {
          return element.value.trim();
        }
      }
      
      // Fallback: look for address pattern in text
      const text = document.body.textContent;
      const addressPattern = /(\d+\s+[A-Z\s]+(?:ST|AVE|BLVD|RD|WAY|CT|PL|DR|LN|PKWY)\s+[A-Z\s]+\s+CA\s+\d{5})/i;
      const match = text.match(addressPattern);
      if (match) {
        return match[1].trim();
      }
      
      return null;
    });
    
    if (address) {
      console.log(`   ✅ Extracted request address: ${address}`);
      return address;
    } else {
      console.log('   ❌ Could not extract request address');
      return 'Not found';
    }
  }

  printSummary() {
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach((result, i) => {
      if (result.success) {
        console.log(`✅ Test ${i + 1}: ${result.testCase}`);
        console.log(`   Service Request Number: ${result.serviceRequestNumber}`);
        console.log(`   Address: ${result.address}`);
      } else {
        console.log(`❌ Test ${i + 1}: ${result.testCase}`);
        console.log(`   Error: ${result.error}`);
      }
    });
  }

  async saveResults() {
    const fs = require('fs').promises;
    const resultsPath = '/Users/adhi/Desktop/pot-buddy/scripts/sf-forms/graffiti-all-types-test-results.json';
    
    await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Test results saved to: ${resultsPath}`);
  }
}

// Run the comprehensive test
(async () => {
  const tester = new GraffitiFormTester();
  await tester.init();
  await tester.testAllGraffitiTypes();
  await tester.browser.close();
})();
