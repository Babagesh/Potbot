const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// SF.gov form URLs for different damage types
const SF_FORM_URLS = {
  pothole: 'https://www.sf.gov/report-pothole-and-street-issues',
  sidewalk: 'https://www.sf.gov/report-curb-and-sidewalk-problems',
  graffiti: 'https://www.sf.gov/report-graffiti-issues',
  trash: 'https://www.sf.gov/report-garbage-container-issues',
  streetMarkings: 'https://www.sf.gov/report-faded-street-and-pavement-markings',
  streetlight: 'https://www.sf.gov/report-problem-streetlight',
  fallenTree: 'https://www.sf.gov/report-damaged-or-fallen-tree'
};

/**
 * Scrapes SF.gov forms to understand their structure and field mappings
 */
async function scrapeSFForms() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const formData = {};

  for (const [damageType, url] of Object.entries(SF_FORM_URLS)) {
    console.log(`Scraping form for ${damageType}: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000); // Wait for page to fully load

      // Extract form fields
      const formFields = await page.evaluate(() => {
        const fields = [];
        
        // Find all input fields
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
          const field = {
            type: input.tagName.toLowerCase(),
            name: input.name || input.id || '',
            placeholder: input.placeholder || '',
            label: '',
            required: input.required || false,
            options: []
          };

          // Try to find associated label
          if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
              field.label = label.textContent.trim();
            }
          }

          // For select elements, get options
          if (input.tagName.toLowerCase() === 'select') {
            const options = input.querySelectorAll('option');
            options.forEach(option => {
              if (option.value) {
                field.options.push({
                  value: option.value,
                  text: option.textContent.trim()
                });
              }
            });
          }

          // Only include fields with names/ids
          if (field.name) {
            fields.push(field);
          }
        });

        return fields;
      });

      formData[damageType] = {
        url,
        fields: formFields,
        scrapedAt: new Date().toISOString()
      };

      console.log(`Found ${formFields.length} fields for ${damageType}`);
      
    } catch (error) {
      console.error(`Error scraping ${damageType}:`, error);
      formData[damageType] = {
        url,
        error: error.message,
        scrapedAt: new Date().toISOString()
      };
    }

    // Wait between requests to be respectful
    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Save scraped data
  const outputPath = path.join(__dirname, 'sf-forms-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(formData, null, 2));
  
  console.log(`Form data saved to: ${outputPath}`);
  console.log('Summary:');
  Object.entries(formData).forEach(([type, data]) => {
    if (data.fields) {
      console.log(`  ${type}: ${data.fields.length} fields`);
    } else {
      console.log(`  ${type}: Error - ${data.error}`);
    }
  });

  return formData;
}

/**
 * Analyzes scraped form data to create field mappings
 */
function analyzeFormData(formData) {
  const analysis = {
    commonFields: {},
    uniqueFields: {},
    fieldMappings: {}
  };

  // Find common fields across all forms
  const allFieldNames = new Set();
  Object.values(formData).forEach(form => {
    if (form.fields) {
      form.fields.forEach(field => {
        allFieldNames.add(field.name);
      });
    }
  });

  // Analyze each form
  Object.entries(formData).forEach(([damageType, form]) => {
    if (form.fields) {
      analysis.uniqueFields[damageType] = [];
      analysis.fieldMappings[damageType] = {};

      form.fields.forEach(field => {
        // Check if this field appears in other forms
        const appearsInOtherForms = Object.entries(formData).some(([otherType, otherForm]) => {
          return otherType !== damageType && 
                 otherForm.fields && 
                 otherForm.fields.some(f => f.name === field.name);
        });

        if (appearsInOtherForms) {
          if (!analysis.commonFields[field.name]) {
            analysis.commonFields[field.name] = {
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              required: field.required,
              forms: []
            };
          }
          analysis.commonFields[field.name].forms.push(damageType);
        } else {
          analysis.uniqueFields[damageType].push(field);
        }

        // Create field mapping
        analysis.fieldMappings[damageType][field.name] = {
          selector: `[name="${field.name}"], [id="${field.name}"]`,
          type: field.type,
          label: field.label,
          required: field.required,
          options: field.options
        };
      });
    }
  });

  return analysis;
}

// Run the scraper if this file is executed directly
if (require.main === module) {
  scrapeSFForms()
    .then(formData => {
      const analysis = analyzeFormData(formData);
      const analysisPath = path.join(__dirname, 'sf-forms-analysis.json');
      fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
      console.log(`Analysis saved to: ${analysisPath}`);
    })
    .catch(console.error);
}

module.exports = { scrapeSFForms, analyzeFormData, SF_FORM_URLS };
