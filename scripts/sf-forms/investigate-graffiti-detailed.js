const { chromium } = require('playwright');

/**
 * Detailed investigation of the graffiti form to find the emergency disclaimer
 */
async function investigateGraffitiForm() {
  console.log('🔍 Detailed Investigation of Graffiti Form\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 Step 1: Navigating to graffiti form...');
    await page.goto('https://www.sf.gov/report-graffiti-issues', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('🔍 Step 2: Looking for Report button...');
    const reportButton = await page.$('a:has-text("Report")');
    if (reportButton) {
      console.log('🖱️ Step 3: Clicking Report button');
      await reportButton.click();
      
      // Wait longer for the page to load completely
      console.log('⏳ Step 4: Waiting for page to load completely...');
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`📍 Step 5: Current URL: ${currentUrl}`);
      
      // Check page title
      const title = await page.title();
      console.log(`📄 Step 6: Page title: ${title}`);
      
      // Look for emergency text more thoroughly
      console.log('🚨 Step 7: Searching for emergency disclaimer text...');
      const emergencyText = await page.evaluate(() => {
        const bodyText = document.body.textContent.toLowerCase();
        const emergencyKeywords = [
          'emergency',
          '911',
          'call 911',
          'police',
          'fire department',
          'immediate danger',
          'life threatening',
          'call the police',
          'call police',
          'emergency services'
        ];
        
        const foundKeywords = emergencyKeywords.filter(keyword => 
          bodyText.includes(keyword)
        );
        
        return {
          foundKeywords,
          hasEmergencyText: foundKeywords.length > 0,
          bodyTextLength: bodyText.length,
          bodyTextPreview: bodyText.substring(0, 500)
        };
      });
      
      console.log(`   Emergency keywords found: ${emergencyText.foundKeywords.join(', ')}`);
      console.log(`   Has emergency text: ${emergencyText.hasEmergencyText}`);
      console.log(`   Body text length: ${emergencyText.bodyTextLength} characters`);
      console.log(`   Body text preview: ${emergencyText.bodyTextPreview}`);
      
      // Look for all buttons on the page
      console.log('🔘 Step 8: Analyzing all buttons on the page...');
      const allButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
          .map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim() || el.value || '',
            href: el.href || '',
            className: el.className,
            id: el.id,
            isVisible: el.offsetParent !== null,
            isEnabled: !el.disabled,
            position: {
              x: el.offsetLeft,
              y: el.offsetTop,
              width: el.offsetWidth,
              height: el.offsetHeight
            }
          }))
          .filter(btn => btn.text && btn.isVisible);
        
        return buttons;
      });
      
      console.log(`   Found ${allButtons.length} visible buttons:`);
      allButtons.forEach((btn, i) => {
        console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" ${btn.href ? `href="${btn.href}"` : ''} class="${btn.className}" id="${btn.id}" enabled=${btn.isEnabled}`);
      });
      
      // Look specifically for Next/Continue buttons
      console.log('🔍 Step 9: Looking specifically for Next/Continue buttons...');
      const nextButtons = allButtons.filter(btn => 
        /next|continue|proceed/i.test(btn.text)
      );
      
      if (nextButtons.length > 0) {
        console.log(`   Found ${nextButtons.length} Next/Continue buttons:`);
        nextButtons.forEach((btn, i) => {
          console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" class="${btn.className}" id="${btn.id}"`);
        });
        
        // Try clicking the first Next button
        console.log('🖱️ Step 10: Attempting to click Next button...');
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
            
            const newUrl = page.url();
            console.log(`📍 Step 11: URL after Next click: ${newUrl}`);
            
            if (newUrl !== currentUrl) {
              console.log('✅ Successfully navigated to next page!');
            } else {
              console.log('⚠️ No navigation detected after Next click');
            }
          }
        } catch (error) {
          console.log(`❌ Error clicking Next button: ${error.message}`);
        }
      } else {
        console.log('   No Next/Continue buttons found');
      }
      
      // Check if there are any forms on the page
      console.log('📝 Step 12: Checking for forms...');
      const forms = await page.evaluate(() => {
        const formElements = document.querySelectorAll('form');
        return Array.from(formElements).map(form => ({
          id: form.id,
          className: form.className,
          action: form.action,
          method: form.method,
          fieldCount: form.querySelectorAll('input, textarea, select').length
        }));
      });
      
      console.log(`   Found ${forms.length} forms:`);
      forms.forEach((form, i) => {
        console.log(`     ${i + 1}. <form> id="${form.id}" class="${form.className}" action="${form.action}" method="${form.method}" fields=${form.fieldCount}`);
      });
      
      // Take a screenshot for visual inspection
      console.log('📸 Step 13: Taking screenshot for visual inspection...');
      await page.screenshot({ path: 'graffiti-form-investigation.png', fullPage: true });
      console.log('   Screenshot saved as: graffiti-form-investigation.png');
      
    } else {
      console.log('❌ Report button not found');
    }
    
  } catch (error) {
    console.log(`❌ Error during investigation: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n📊 Investigation Complete');
  console.log('========================');
  console.log('If you see an emergency disclaimer manually but not in automation:');
  console.log('1. Check if there are timing issues');
  console.log('2. Verify if JavaScript needs more time to load');
  console.log('3. Check if there are dynamic elements that load after initial page load');
  console.log('4. Verify if the page structure changes based on user agent or other factors');
}

// Run the investigation
investigateGraffitiForm().catch(console.error);
