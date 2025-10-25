const { chromium } = require('playwright');

/**
 * Find the correct graffiti form URL
 */
async function findCorrectGraffitiForm() {
  console.log('🔍 Finding the Correct Graffiti Form URL\n');
  
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
    
    console.log('🔍 Step 2: Looking for the actual Report button (not the redirect)...');
    
    // Look for all Report buttons on the page
    const allReportButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button'))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim() || '',
          href: el.href || '',
          className: el.className,
          id: el.id,
          isVisible: el.offsetParent !== null
        }))
        .filter(btn => btn.text && btn.isVisible && /report/i.test(btn.text));
      
      return buttons;
    });
    
    console.log(`   Found ${allReportButtons.length} Report buttons:`);
    allReportButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" href="${btn.href}" class="${btn.className}" id="${btn.id}"`);
    });
    
    // Look for the button that goes to the Verint system (like other forms)
    const verintButton = allReportButtons.find(btn => 
      btn.href && btn.href.includes('verintcloudservices.com')
    );
    
    if (verintButton) {
      console.log(`✅ Found Verint button: "${verintButton.text}" -> ${verintButton.href}`);
      
      console.log('🖱️ Step 3: Clicking the Verint Report button...');
      const verintButtonElement = await page.$(`a[href="${verintButton.href}"]`);
      if (verintButtonElement) {
        await verintButtonElement.click();
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
            console.log('✅ Graffiti form follows the standard workflow!');
            console.log('   Emergency disclaimer → Next button → Form');
          }
        } else {
          console.log('⚠️ No emergency disclaimer found on this page');
        }
        
      }
    } else {
      console.log('❌ No Verint button found - this might be a different form type');
      
      // Check if there are any other Report buttons that might be the correct one
      console.log('🔍 Step 3: Checking other Report buttons...');
      for (const btn of allReportButtons) {
        if (btn.href && !btn.href.includes('verintcloudservices.com')) {
          console.log(`   Testing button: "${btn.text}" -> ${btn.href}`);
          
          try {
            await page.goto(btn.href, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);
            
            const newTitle = await page.title();
            console.log(`     Page title: ${newTitle}`);
            
            // Check if this looks like a graffiti form
            if (newTitle.toLowerCase().includes('graffiti')) {
              console.log('✅ Found graffiti-specific form!');
              break;
            }
          } catch (error) {
            console.log(`     Error testing button: ${error.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Error during investigation: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n📊 Investigation Summary:');
  console.log('========================');
  console.log('The graffiti form might:');
  console.log('1. Redirect to a different form system');
  console.log('2. Have multiple Report buttons');
  console.log('3. Use a different URL structure');
  console.log('4. Require different navigation steps');
}

// Run the investigation
findCorrectGraffitiForm().catch(console.error);
