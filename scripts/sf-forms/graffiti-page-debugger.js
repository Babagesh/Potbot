const { chromium } = require('playwright');

class GraffitiPageDebugger {
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

  async debugGraffitiForm() {
    console.log('🔍 Debugging Graffiti Form Page Progression');
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

      // Debug the request details page
      console.log('📝 Step 8: Debugging request details page...');
      await this.debugRequestDetailsPage();

      // Fill form fields
      console.log('📝 Step 9: Filling form fields...');
      await this.fillFormFields();

      // Debug Next button on request details page
      console.log('➡️ Step 10: Debugging Next button on request details page...');
      await this.debugNextButtonOnRequestDetailsPage();

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
    const nextButton = await this.page.$('button:has-text("Next")');
    if (nextButton) {
      await nextButton.click();
      console.log('   ✅ Clicked Next to get to location page');
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

  async debugRequestDetailsPage() {
    console.log('   🔍 Debugging request details page...');
    
    // Check current URL
    const currentUrl = this.page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check page title
    const title = await this.page.title();
    console.log(`   Page title: ${title}`);
    
    // Check for form fields
    const formFields = await this.page.evaluate(() => {
      const fields = [];
      
      // Check dropdowns
      const selects = document.querySelectorAll('select');
      selects.forEach((select, index) => {
        fields.push({
          type: 'select',
          index: index + 1,
          name: select.name,
          id: select.id,
          className: select.className,
          isVisible: select.offsetParent !== null,
          options: Array.from(select.options).map(option => ({
            value: option.value,
            text: option.textContent?.trim()
          }))
        });
      });
      
      // Check textareas
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea, index) => {
        fields.push({
          type: 'textarea',
          index: index + 1,
          name: textarea.name,
          id: textarea.id,
          className: textarea.className,
          isVisible: textarea.offsetParent !== null,
          placeholder: textarea.placeholder
        });
      });
      
      // Check file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input, index) => {
        fields.push({
          type: 'file',
          index: index + 1,
          name: input.name,
          id: input.id,
          className: input.className,
          isVisible: input.offsetParent !== null
        });
      });
      
      return fields;
    });
    
    console.log(`   Found ${formFields.length} form fields:`);
    formFields.forEach(field => {
      console.log(`     ${field.type} ${field.index}: Name="${field.name}", ID="${field.id}", Visible=${field.isVisible}`);
      if (field.type === 'select' && field.options) {
        console.log(`        Options: ${field.options.length}`);
        field.options.forEach((option, i) => {
          console.log(`          ${i + 1}. "${option.text}" (value: "${option.value}")`);
        });
      }
    });
    
    // Check for Next button
    const nextButtons = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      return buttons.map((button, index) => ({
        index: index + 1,
        text: button.textContent?.trim() || button.value || '',
        tagName: button.tagName,
        className: button.className,
        id: button.id,
        isVisible: button.offsetParent !== null,
        disabled: button.disabled
      })).filter(button => 
        /next|continue|proceed|submit/i.test(button.text)
      );
    });
    
    console.log(`   Found ${nextButtons.length} Next/Submit buttons:`);
    nextButtons.forEach(button => {
      console.log(`     ${button.index}. "${button.text}" (${button.tagName}) - Visible: ${button.isVisible}, Disabled: ${button.disabled}`);
    });
  }

  async fillFormFields() {
    // Fill request regarding dropdown
    const requestRegardingSelect = await this.page.$('select[name="Nature_of_request"]');
    if (requestRegardingSelect) {
      await requestRegardingSelect.evaluate((element) => {
        element.value = 'not_offensive';
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
      console.log('   ✅ Selected "Not Offensive"');
      await this.page.waitForTimeout(1000);
    }

    // Fill request type dropdown
    const requestTypeSelect = await this.page.$('select[name="Request_type"]');
    if (requestTypeSelect) {
      await requestTypeSelect.evaluate((element) => {
        element.value = 'building_commercial';
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
      console.log('   ✅ Selected "Building - Commercial"');
      await this.page.waitForTimeout(1000);
    }

    // Fill request description
    const requestDescTextarea = await this.page.$('textarea[name="Request_description"]');
    if (requestDescTextarea) {
      await requestDescTextarea.fill('Large graffiti tag covering the side of the commercial building. Needs immediate removal.');
      await requestDescTextarea.press('Enter');
      console.log('   ✅ Filled request description');
      await this.page.waitForTimeout(1000);
    }

    // Upload image
    const fileInput = await this.page.$('input[name="File_attach[]"]');
    if (fileInput) {
      await fileInput.setInputFiles('/Users/adhi/Desktop/pot-buddy/scripts/sf-forms/sample-pothole-image.jpg');
      console.log('   ✅ Uploaded image');
      await this.page.waitForTimeout(1000);
    }
  }

  async debugNextButtonOnRequestDetailsPage() {
    console.log('   🔍 Debugging Next button on request details page...');
    
    // Check if Next button is visible and clickable
    const nextButtonInfo = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
      const nextButtons = buttons.filter(button => 
        /next|continue|proceed/i.test(button.textContent?.trim() || button.value || '')
      );
      
      if (nextButtons.length > 0) {
        const button = nextButtons[0];
        const rect = button.getBoundingClientRect();
        return {
          found: true,
          text: button.textContent?.trim() || button.value || '',
          tagName: button.tagName,
          visible: button.offsetParent !== null,
          disabled: button.disabled,
          position: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
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
      console.log(`   ✅ Found Next button: "${nextButtonInfo.text}"`);
      console.log(`   Visible: ${nextButtonInfo.visible}`);
      console.log(`   Disabled: ${nextButtonInfo.disabled}`);
      console.log(`   Position: x=${nextButtonInfo.position.x}, y=${nextButtonInfo.position.y}`);
      console.log(`   Style: display=${nextButtonInfo.style.display}, visibility=${nextButtonInfo.style.visibility}, opacity=${nextButtonInfo.style.opacity}`);
      
      // Try to click the Next button
      console.log('   🖱️ Attempting to click Next button...');
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
        console.log('   ✅ Successfully clicked Next button');
        await this.page.waitForTimeout(3000);
        
        // Check if URL changed
        const newUrl = this.page.url();
        console.log(`   New URL: ${newUrl}`);
      } else {
        console.log('   ❌ Failed to click Next button');
      }
    } else {
      console.log('   ❌ No Next button found');
    }
  }
}

// Run the debugger
(async () => {
  const debuggerInstance = new GraffitiPageDebugger();
  await debuggerInstance.init();
  await debuggerInstance.debugGraffitiForm();
})();
