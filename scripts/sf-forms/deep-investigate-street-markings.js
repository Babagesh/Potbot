const { chromium } = require('playwright');

/**
 * Deep investigation of street markings form structure
 */
async function deepInvestigateStreetMarkings() {
  console.log('🔍 Deep Investigation of Street Markings Form\n');
  
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
    
    console.log('📄 Step 2: Analyzing page content...');
    
    // Get page title and URL
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.textContent.substring(0, 2000)
      };
    });
    
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   Body text preview: ${pageInfo.bodyText}`);
    
    // Look for ALL buttons and links on the page
    console.log('🔘 Step 3: Finding ALL buttons and links...');
    const allElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"]'))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim() || el.value || '',
          href: el.href || '',
          className: el.className,
          id: el.id,
          isVisible: el.offsetParent !== null,
          isEnabled: !el.disabled
        }))
        .filter(el => el.text && el.isVisible);
      
      return elements;
    });
    
    console.log(`   Found ${allElements.length} total clickable elements:`);
    allElements.forEach((el, i) => {
      console.log(`     ${i + 1}. <${el.tag}> "${el.text}" ${el.href ? `href="${el.href}"` : ''} class="${el.className}" id="${el.id}" enabled=${el.isEnabled}`);
    });
    
    // Look for any elements that might be the main Report button
    console.log('🔍 Step 4: Looking for main Report button...');
    const mainReportButtons = allElements.filter(el => 
      /report/i.test(el.text) && 
      !el.text.includes('different') && 
      !el.text.includes('instead')
    );
    
    console.log(`   Found ${mainReportButtons.length} main Report buttons:`);
    mainReportButtons.forEach((btn, i) => {
      console.log(`     ${i + 1}. <${btn.tag}> "${btn.text}" ${btn.href ? `href="${btn.href}"` : ''}`);
    });
    
    // Look for any Verint-related URLs
    console.log('🔍 Step 5: Looking for Verint-related URLs...');
    const verintElements = allElements.filter(el => 
      el.href && el.href.includes('verint')
    );
    
    if (verintElements.length > 0) {
      console.log(`   Found ${verintElements.length} Verint elements:`);
      verintElements.forEach((el, i) => {
        console.log(`     ${i + 1}. <${el.tag}> "${el.text}" href="${el.href}"`);
      });
    } else {
      console.log('   No Verint elements found');
    }
    
    // Check if there's a form on the page itself
    console.log('📝 Step 6: Checking for forms on the page...');
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
    
    // Check if there are any hidden or dynamically loaded elements
    console.log('🔍 Step 7: Checking for hidden elements...');
    const hiddenElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.style.display === 'none' || el.style.visibility === 'hidden' || el.hidden)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim() || '',
          href: el.href || '',
          className: el.className,
          id: el.id
        }))
        .filter(el => el.text && /report/i.test(el.text));
      
      return elements;
    });
    
    if (hiddenElements.length > 0) {
      console.log(`   Found ${hiddenElements.length} hidden Report elements:`);
      hiddenElements.forEach((el, i) => {
        console.log(`     ${i + 1}. <${el.tag}> "${el.text}" ${el.href ? `href="${el.href}"` : ''} class="${el.className}" id="${el.id}"`);
      });
    } else {
      console.log('   No hidden Report elements found');
    }
    
    // Check if there are any iframes that might contain the form
    console.log('🖼️ Step 8: Checking for iframes...');
    const iframes = await page.evaluate(() => {
      const iframeElements = document.querySelectorAll('iframe');
      return Array.from(iframeElements).map(iframe => ({
        src: iframe.src,
        id: iframe.id,
        className: iframe.className,
        width: iframe.width,
        height: iframe.height
      }));
    });
    
    console.log(`   Found ${iframes.length} iframes:`);
    iframes.forEach((iframe, i) => {
      console.log(`     ${i + 1}. <iframe> src="${iframe.src}" id="${iframe.id}" class="${iframe.className}" width="${iframe.width}" height="${iframe.height}"`);
    });
    
    // Take a screenshot for visual inspection
    console.log('📸 Step 9: Taking screenshot for visual inspection...');
    await page.screenshot({ path: 'street-markings-form-investigation.png', fullPage: true });
    console.log('   Screenshot saved as: street-markings-form-investigation.png');
    
    // Check if there might be a different URL structure
    console.log('🔍 Step 10: Checking for alternative URLs...');
    const alternativeUrls = [
      'https://www.sf.gov/report-street-markings',
      'https://www.sf.gov/report-faded-markings',
      'https://www.sf.gov/report-pavement-markings',
      'https://www.sf.gov/request-street-markings'
    ];
    
    for (const altUrl of alternativeUrls) {
      try {
        console.log(`   Testing alternative URL: ${altUrl}`);
        await page.goto(altUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const altTitle = await page.title();
        console.log(`     Title: ${altTitle}`);
        
        if (altTitle.toLowerCase().includes('street') && altTitle.toLowerCase().includes('marking')) {
          console.log('     ✅ This might be the correct URL!');
          
          // Check for Report buttons on this page
          const altButtons = await page.evaluate(() => {
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
          
          console.log(`     Found ${altButtons.length} Report buttons:`);
          altButtons.forEach((btn, i) => {
            console.log(`       ${i + 1}. <${btn.tag}> "${btn.text}" ${btn.href ? `href="${btn.href}"` : ''}`);
          });
          
          break;
        }
      } catch (error) {
        console.log(`     Error testing ${altUrl}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error during investigation: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n📊 Investigation Summary:');
  console.log('========================');
  console.log('The street markings form might:');
  console.log('1. Use a different URL structure');
  console.log('2. Have the form embedded in an iframe');
  console.log('3. Load dynamically via JavaScript');
  console.log('4. Be part of a different reporting system');
  console.log('5. Require different navigation steps');
}

// Run the investigation
deepInvestigateStreetMarkings().catch(console.error);
