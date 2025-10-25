const { chromium } = require('playwright');

/**
 * Investigate specific SF.gov forms that don't follow the standard pattern
 */
async function investigateSpecialCases() {
  console.log('🔍 Investigating Special Case SF.gov Forms\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Test cases that failed
  const specialCases = [
    {
      name: 'graffiti',
      initialUrl: 'https://www.sf.gov/report-graffiti-issues',
      redirectUrl: 'https://www.sf.gov/report-issue-parking-or-traffic-sign'
    },
    {
      name: 'streetMarkings',
      initialUrl: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
      redirectUrl: 'https://www.sf.gov/request-new-street-markings'
    }
  ];
  
  for (const testCase of specialCases) {
    console.log(`\n🔍 Investigating ${testCase.name.toUpperCase()}:`);
    console.log('='.repeat(60));
    
    try {
      // Navigate to initial page
      console.log(`🌐 Step 1: Navigating to: ${testCase.initialUrl}`);
      await page.goto(testCase.initialUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      // Click Report button
      console.log('🔍 Step 2: Looking for Report button...');
      const reportButton = await page.$('a:has-text("Report")');
      if (reportButton) {
        console.log('🖱️ Step 3: Clicking Report button');
        await reportButton.click();
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`📍 Step 4: Current URL: ${currentUrl}`);
        
        // Analyze the page content
        console.log('📄 Step 5: Analyzing page content...');
        
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            hasForm: document.querySelector('form') !== null,
            formCount: document.querySelectorAll('form').length,
            hasEmergencyText: /emergency|911|call.*police|call.*fire/i.test(document.body.textContent),
            hasNextButton: document.querySelector('button:has-text("Next"), a:has-text("Next"), input[value*="Next"]') !== null,
            hasContinueButton: document.querySelector('button:has-text("Continue"), a:has-text("Continue"), input[value*="Continue"]') !== null,
            hasSubmitButton: document.querySelector('button:has-text("Submit"), a:has-text("Submit"), input[value*="Submit"]') !== null,
            allButtons: Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]')).map(el => ({
              tag: el.tagName,
              text: el.textContent?.trim() || el.value || '',
              className: el.className,
              id: el.id,
              isVisible: el.offsetParent !== null
            })).filter(btn => btn.text && btn.isVisible)
          };
        });
        
        console.log(`   Title: ${pageInfo.title}`);
        console.log(`   URL: ${pageInfo.url}`);
        console.log(`   Has form: ${pageInfo.hasForm}`);
        console.log(`   Form count: ${pageInfo.formCount}`);
        console.log(`   Has emergency text: ${pageInfo.hasEmergencyText}`);
        console.log(`   Has Next button: ${pageInfo.hasNextButton}`);
        console.log(`   Has Continue button: ${pageInfo.hasContinueButton}`);
        console.log(`   Has Submit button: ${pageInfo.hasSubmitButton}`);
        
        console.log(`   Found ${pageInfo.allButtons.length} buttons:`);
        pageInfo.allButtons.slice(0, 10).forEach((btn, i) => {
          console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" class="${btn.className}" id="${btn.id}"`);
        });
        
        // Check if this is a different type of form
        if (pageInfo.hasForm && !pageInfo.hasEmergencyText) {
          console.log('💡 This appears to be a direct form (no emergency disclaimer)');
          
          // Look for form fields
          const formFields = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input, textarea, select');
            return Array.from(inputs).map(input => ({
              type: input.type || input.tagName.toLowerCase(),
              name: input.name || '',
              id: input.id || '',
              placeholder: input.placeholder || '',
              required: input.required || false
            })).filter(field => field.name || field.id);
          });
          
          console.log(`   Found ${formFields.length} form fields:`);
          formFields.slice(0, 10).forEach((field, i) => {
            console.log(`     ${i + 1}. ${field.type} name="${field.name}" id="${field.id}" placeholder="${field.placeholder}" required=${field.required}`);
          });
        }
        
      } else {
        console.log('❌ Report button not found');
      }
      
    } catch (error) {
      console.log(`❌ Error investigating ${testCase.name}: ${error.message}`);
    }
    
    console.log('\n' + '-'.repeat(60));
    
    // Wait between tests
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  
  console.log('\n📊 Investigation Summary:');
  console.log('=========================');
  console.log('1. Some SF.gov forms redirect to different systems');
  console.log('2. Not all forms have the emergency disclaimer page');
  console.log('3. Some forms may be direct-entry forms');
  console.log('4. Different forms may have different workflows');
  
  console.log('\n💡 Recommendations:');
  console.log('===================');
  console.log('1. Handle different form types separately');
  console.log('2. Check for emergency disclaimer before looking for Next button');
  console.log('3. Implement fallback strategies for different form structures');
  console.log('4. Create form-specific navigation logic');
}

// Run the investigation
investigateSpecialCases().catch(console.error);
