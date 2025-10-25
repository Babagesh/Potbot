const { chromium } = require('playwright');

/**
 * Test the street markings "Request" button to see if it has emergency disclaimer
 */
async function testStreetMarkingsRequestButton() {
  console.log('🔍 Testing Street Markings Request Button\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 Step 1: Navigating to street markings form...');
    await page.goto('https://www.sf.gov/report-faded-street-and-pavement-markings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('🔍 Step 2: Looking for the "Request" button...');
    const requestButton = await page.$('a:has-text("Request")');
    
    if (requestButton) {
      console.log('✅ Found Request button');
      
      // Get the href to see where it goes
      const href = await requestButton.getAttribute('href');
      console.log(`📍 Request button href: ${href}`);
      
      console.log('🖱️ Step 3: Clicking Request button...');
      await requestButton.click();
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`📍 Step 4: Current URL: ${currentUrl}`);
      
      const title = await page.title();
      console.log(`📄 Step 5: Page title: ${title}`);
      
      // Check for emergency disclaimer
      console.log('🚨 Step 6: Checking for emergency disclaimer...');
      const emergencyText = await page.evaluate(() => {
        const bodyText = document.body.textContent.toLowerCase();
        const emergencyKeywords = [
          'emergency',
          '911',
          'call 911',
          'police',
          'fire department',
          'immediate danger',
          'life threatening'
        ];
        
        const foundKeywords = emergencyKeywords.filter(keyword => 
          bodyText.includes(keyword)
        );
        
        return {
          foundKeywords,
          hasEmergencyText: foundKeywords.length > 0,
          bodyTextPreview: bodyText.substring(0, 1000)
        };
      });
      
      console.log(`   Emergency keywords found: ${emergencyText.foundKeywords.join(', ')}`);
      console.log(`   Has emergency text: ${emergencyText.hasEmergencyText}`);
      
      if (emergencyText.hasEmergencyText) {
        console.log('✅ Found emergency disclaimer!');
        console.log(`   Text preview: ${emergencyText.bodyTextPreview}`);
        
        // Look for Next button
        console.log('🔍 Step 7: Looking for Next button...');
        const nextButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
            .map(el => ({
              tag: el.tagName,
              text: el.textContent?.trim() || el.value || '',
              className: el.className,
              id: el.id,
              isVisible: el.offsetParent !== null,
              isEnabled: !el.disabled
            }))
            .filter(btn => btn.text && btn.isVisible && btn.isEnabled && /next|continue|proceed/i.test(btn.text));
          
          return buttons;
        });
        
        console.log(`   Found ${nextButtons.length} Next/Continue buttons:`);
        nextButtons.forEach((btn, i) => {
          console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" class="${btn.className}" id="${btn.id}"`);
        });
        
        if (nextButtons.length > 0) {
          console.log('✅ Street markings form follows the standard workflow!');
          console.log('   Emergency disclaimer → Next button → Form');
          
          // Try clicking the Next button to see the actual form
          console.log('🖱️ Step 8: Clicking Next button to see the form...');
          const firstNextButton = nextButtons[0];
          const nextButtonSelector = firstNextButton.tag === 'A' ? 
            `a:has-text("${firstNextButton.text}")` : 
            firstNextButton.tag === 'INPUT' ?
            `input[value="${firstNextButton.text}"]` :
            `button:has-text("${firstNextButton.text}")`;
          
          try {
            const nextButtonElement = await page.$(nextButtonSelector);
            if (nextButtonElement) {
              await nextButtonElement.click();
              await page.waitForTimeout(3000);
              
              const formUrl = page.url();
              console.log(`📍 Step 9: Form URL after Next click: ${formUrl}`);
              
              const formTitle = await page.title();
              console.log(`📄 Step 10: Form page title: ${formTitle}`);
              
              // Check for form fields
              console.log('📝 Step 11: Checking for form fields...');
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
              
              if (formFields.length > 0) {
                console.log('✅ Street markings form is ready for data entry!');
              }
            }
          } catch (error) {
            console.log(`❌ Error clicking Next button: ${error.message}`);
          }
        }
      } else {
        console.log('⚠️ No emergency disclaimer found on this page');
        
        // Check if this is a direct form
        console.log('📝 Step 7: Checking if this is a direct form...');
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
        
        if (formFields.length > 0) {
          console.log('✅ This appears to be a direct form (no emergency disclaimer needed)');
        }
      }
      
    } else {
      console.log('❌ Request button not found');
    }
    
  } catch (error) {
    console.log(`❌ Error during test: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n📊 Test Summary:');
  console.log('===============');
  console.log('Street markings form uses "Request" button instead of "Report"');
  console.log('This button should lead to the same Verint system with emergency disclaimer');
}

// Run the test
testStreetMarkingsRequestButton().catch(console.error);
