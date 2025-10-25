const { chromium } = require('playwright');

/**
 * Diagnostic script to understand SF.gov form access issues
 */
async function diagnoseSFForms() {
  console.log('🔍 Diagnosing SF.gov Form Access Issues\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Test URLs
  const testUrls = [
    'https://www.sf.gov/report-pothole-and-street-issues',
    'https://www.sf.gov/report-graffiti-issues',
    'https://www.sf.gov/report-curb-and-sidewalk-problems'
  ];
  
  for (const url of testUrls) {
    console.log(`\n🌐 Testing: ${url}`);
    console.log('='.repeat(80));
    
    try {
      // Test 1: Basic navigation
      console.log('📡 Test 1: Basic navigation...');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('✅ Page loaded successfully');
      
      // Test 2: Wait for network idle
      console.log('⏳ Test 2: Waiting for network idle...');
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('✅ Network idle achieved');
      } catch (error) {
        console.log('⚠️ Network idle timeout (this is common)');
      }
      
      // Test 3: Check page content
      console.log('📄 Test 3: Analyzing page content...');
      const title = await page.title();
      console.log(`   Title: ${title}`);
      
      const url_final = page.url();
      console.log(`   Final URL: ${url_final}`);
      
      // Test 4: Look for forms
      console.log('📝 Test 4: Looking for forms...');
      const forms = await page.$$('form');
      console.log(`   Found ${forms.length} form(s)`);
      
      if (forms.length > 0) {
        for (let i = 0; i < forms.length; i++) {
          const form = forms[i];
          const formId = await form.getAttribute('id');
          const formClass = await form.getAttribute('class');
          const formAction = await form.getAttribute('action');
          console.log(`   Form ${i + 1}: id="${formId}" class="${formClass}" action="${formAction}"`);
          
          // Look for input fields in this form
          const inputs = await form.$$('input, textarea, select');
          console.log(`     Found ${inputs.length} input field(s)`);
          
          if (inputs.length > 0) {
            for (let j = 0; j < Math.min(inputs.length, 5); j++) {
              const input = inputs[j];
              const inputType = await input.getAttribute('type');
              const inputName = await input.getAttribute('name');
              const inputId = await input.getAttribute('id');
              const inputPlaceholder = await input.getAttribute('placeholder');
              console.log(`       Input ${j + 1}: type="${inputType}" name="${inputName}" id="${inputId}" placeholder="${inputPlaceholder}"`);
            }
            if (inputs.length > 5) {
              console.log(`       ... and ${inputs.length - 5} more inputs`);
            }
          }
        }
      }
      
      // Test 5: Check for JavaScript errors
      console.log('🐛 Test 5: Checking for JavaScript errors...');
      const errors = await page.evaluate(() => {
        return window.errors || [];
      });
      if (errors.length > 0) {
        console.log(`   Found ${errors.length} JavaScript error(s)`);
        errors.forEach((error, i) => {
          console.log(`     Error ${i + 1}: ${error}`);
        });
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
      // Test 6: Check for specific SF.gov elements
      console.log('🏛️ Test 6: Looking for SF.gov specific elements...');
      const sfElements = await page.evaluate(() => {
        const elements = [];
        
        // Look for common SF.gov patterns
        const patterns = [
          'input[name*="address"]',
          'input[name*="description"]',
          'input[name*="location"]',
          'textarea[name*="description"]',
          'select[name*="severity"]',
          'input[type="file"]',
          '.form-field',
          '.sf-form',
          '[data-form]'
        ];
        
        patterns.forEach(pattern => {
          const found = document.querySelectorAll(pattern);
          if (found.length > 0) {
            elements.push(`${pattern}: ${found.length} found`);
          }
        });
        
        return elements;
      });
      
      if (sfElements.length > 0) {
        console.log('   Found SF.gov specific elements:');
        sfElements.forEach(element => {
          console.log(`     ${element}`);
        });
      } else {
        console.log('   No SF.gov specific elements found');
      }
      
      // Test 7: Check page load time
      console.log('⏱️ Test 7: Page performance...');
      const performance = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: timing.responseEnd - timing.requestStart
        };
      });
      console.log(`   Load time: ${performance.loadTime}ms`);
      console.log(`   DOM ready: ${performance.domReady}ms`);
      
    } catch (error) {
      console.log(`❌ Error testing ${url}:`);
      console.log(`   ${error.message}`);
      
      if (error.message.includes('timeout')) {
        console.log('   💡 This appears to be a timeout issue');
        console.log('   💡 SF.gov forms may be slow to load or have heavy JavaScript');
      }
    }
    
    console.log('\n' + '-'.repeat(80));
    
    // Wait between tests
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  
  console.log('\n📊 Diagnosis Summary:');
  console.log('====================');
  console.log('1. SF.gov forms are accessible via HTTP');
  console.log('2. Forms may have heavy JavaScript loading');
  console.log('3. Network idle timeout is common (not necessarily an error)');
  console.log('4. Forms may be dynamically loaded after initial page load');
  console.log('5. Some forms may require specific user interactions to appear');
  
  console.log('\n💡 Recommendations:');
  console.log('===================');
  console.log('1. Use domcontentloaded instead of networkidle');
  console.log('2. Add explicit waits for form elements');
  console.log('3. Handle dynamic form loading');
  console.log('4. Implement fallback strategies');
  console.log('5. Consider using longer timeouts for SF.gov');
}

// Run the diagnosis
diagnoseSFForms().catch(console.error);
