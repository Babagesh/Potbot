const { chromium } = require('playwright');

/**
 * Deep investigation of SF.gov form structure
 */
async function deepInvestigateSFForms() {
  console.log('🔍 Deep Investigation of SF.gov Form Structure\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Test the pothole form URL
  const url = 'https://www.sf.gov/report-pothole-and-street-issues';
  console.log(`🌐 Investigating: ${url}\n`);
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait longer for dynamic content
    
    console.log('📄 Page Analysis:');
    console.log('================');
    
    // Get page content
    const content = await page.content();
    console.log(`Page size: ${content.length} characters`);
    
    // Look for specific text patterns
    const textPatterns = [
      'report',
      'pothole',
      'street',
      'form',
      'submit',
      'address',
      'description',
      'location',
      'contact',
      'email',
      'phone'
    ];
    
    console.log('\n🔍 Text Pattern Analysis:');
    textPatterns.forEach(pattern => {
      const matches = content.toLowerCase().match(new RegExp(pattern, 'g'));
      if (matches) {
        console.log(`   "${pattern}": ${matches.length} occurrences`);
      }
    });
    
    // Look for links that might lead to actual forms
    console.log('\n🔗 Link Analysis:');
    const links = await page.$$eval('a', links => 
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        hasFormKeywords: /report|form|submit|pothole|street|issue/i.test(link.textContent)
      })).filter(link => link.text && link.text.length > 0)
    );
    
    const relevantLinks = links.filter(link => link.hasFormKeywords);
    console.log(`Found ${links.length} total links, ${relevantLinks.length} potentially relevant`);
    
    relevantLinks.slice(0, 10).forEach((link, i) => {
      console.log(`   ${i + 1}. "${link.text}" -> ${link.href}`);
    });
    
    // Look for buttons that might trigger forms
    console.log('\n🔘 Button Analysis:');
    const buttons = await page.$$eval('button, input[type="button"], input[type="submit"]', buttons =>
      buttons.map(btn => ({
        text: btn.textContent?.trim() || btn.value || '',
        type: btn.type || 'button',
        className: btn.className,
        id: btn.id
      })).filter(btn => btn.text.length > 0)
    );
    
    console.log(`Found ${buttons.length} buttons`);
    buttons.slice(0, 10).forEach((btn, i) => {
      console.log(`   ${i + 1}. "${btn.text}" (${btn.type}) class="${btn.className}" id="${btn.id}"`);
    });
    
    // Look for iframes that might contain forms
    console.log('\n🖼️ Iframe Analysis:');
    const iframes = await page.$$eval('iframe', iframes =>
      iframes.map(iframe => ({
        src: iframe.src,
        id: iframe.id,
        className: iframe.className
      }))
    );
    
    console.log(`Found ${iframes.length} iframes`);
    iframes.forEach((iframe, i) => {
      console.log(`   ${i + 1}. src="${iframe.src}" id="${iframe.id}" class="${iframe.className}"`);
    });
    
    // Check for dynamic content loading
    console.log('\n⚡ Dynamic Content Analysis:');
    const dynamicElements = await page.evaluate(() => {
      const elements = [];
      
      // Look for elements with data attributes that might indicate dynamic loading
      const dataElements = document.querySelectorAll('[data-*]');
      dataElements.forEach(el => {
        const dataAttrs = Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => `${attr.name}="${attr.value}"`);
        
        if (dataAttrs.length > 0) {
          elements.push({
            tag: el.tagName,
            dataAttrs: dataAttrs,
            text: el.textContent?.trim().substring(0, 50) || ''
          });
        }
      });
      
      return elements.slice(0, 10); // Limit to first 10
    });
    
    console.log(`Found ${dynamicElements.length} elements with data attributes`);
    dynamicElements.forEach((el, i) => {
      console.log(`   ${i + 1}. <${el.tag}> ${el.dataAttrs.join(' ')} "${el.text}"`);
    });
    
    // Look for JavaScript that might load forms
    console.log('\n📜 JavaScript Analysis:');
    const scripts = await page.$$eval('script', scripts =>
      scripts.map(script => ({
        src: script.src,
        hasContent: script.textContent.length > 0,
        contentPreview: script.textContent.substring(0, 100)
      }))
    );
    
    const externalScripts = scripts.filter(s => s.src);
    const inlineScripts = scripts.filter(s => s.hasContent && !s.src);
    
    console.log(`Found ${externalScripts.length} external scripts, ${inlineScripts.length} inline scripts`);
    
    // Look for specific SF.gov form patterns
    console.log('\n🏛️ SF.gov Specific Patterns:');
    const sfPatterns = await page.evaluate(() => {
      const patterns = {};
      
      // Look for common SF.gov form patterns
      const selectors = [
        '.sf-form',
        '.city-form',
        '.report-form',
        '[data-form-type]',
        '[data-service]',
        '.service-form',
        '.reporting-form'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          patterns[selector] = elements.length;
        }
      });
      
      return patterns;
    });
    
    if (Object.keys(sfPatterns).length > 0) {
      console.log('Found SF.gov specific patterns:');
      Object.entries(sfPatterns).forEach(([pattern, count]) => {
        console.log(`   ${pattern}: ${count} elements`);
      });
    } else {
      console.log('No SF.gov specific patterns found');
    }
    
    // Check if there's a "Start Report" or similar button
    console.log('\n🚀 Looking for Report Initiation:');
    const reportButtons = await page.$$eval('*', elements =>
      elements.filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return /start|begin|report|submit|create|new/i.test(text) && 
               el.tagName === 'BUTTON' || el.tagName === 'A' || el.type === 'submit';
      }).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        href: el.href,
        type: el.type
      }))
    );
    
    console.log(`Found ${reportButtons.length} potential report initiation elements`);
    reportButtons.slice(0, 5).forEach((btn, i) => {
      console.log(`   ${i + 1}. <${btn.tag}> "${btn.text}" ${btn.href ? `-> ${btn.href}` : ''}`);
    });
    
  } catch (error) {
    console.log(`❌ Error during investigation: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n📊 Investigation Summary:');
  console.log('========================');
  console.log('1. SF.gov pages load successfully');
  console.log('2. Pages contain mostly informational content');
  console.log('3. Actual reporting forms may be:');
  console.log('   - Behind authentication/login');
  console.log('   - In separate iframes');
  console.log('   - Loaded dynamically via JavaScript');
  console.log('   - Require specific user interactions to appear');
  console.log('   - Located on different URLs');
  
  console.log('\n💡 Next Steps:');
  console.log('==============');
  console.log('1. Check if forms require user authentication');
  console.log('2. Look for "Start Report" or similar buttons');
  console.log('3. Investigate if forms are in separate iframes');
  console.log('4. Check if forms load after user interactions');
  console.log('5. Verify if the URLs are correct for actual forms');
}

// Run the investigation
deepInvestigateSFForms().catch(console.error);
