# Pot Buddy SF.gov Automation Scripts

This directory contains Playwright automation scripts for automatically filling out and submitting San Francisco city repair request forms.

## 📁 Files Overview

- `form-scraper.js` - Scrapes SF.gov forms to understand their structure and field mappings
- `sf-form-automation.js` - Core automation class for filling out and submitting forms
- `pot-buddy-orchestrator.js` - Main orchestrator that handles the complete workflow
- `test.js` - Test script for validating the automation
- `README.md` - This documentation file

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From the project root
npm install playwright @playwright/test exif-parser
npx playwright install
```

### 2. Run Form Scraping

First, scrape the SF.gov forms to understand their structure:

```bash
node scripts/sf-forms/form-scraper.js
```

This will create:
- `sf-forms-data.json` - Raw scraped form data
- `sf-forms-analysis.json` - Analyzed field mappings

### 3. Test the Automation

Run the test suite to validate the automation:

```bash
# Run all tests
node scripts/sf-forms/test.js

# Run form scraping only
node scripts/sf-forms/test.js scrape

# Test specific damage type
node scripts/sf-forms/test.js test pothole
```

## 🏗️ Architecture

### DamageReport Class

Represents a damage report with all necessary information:

```javascript
const report = new DamageReport({
  damageType: 'pothole',
  description: 'Large pothole causing vehicle damage',
  latitude: 37.7749,
  longitude: -122.4194,
  imagePath: '/path/to/image.jpg',
  severity: 'high',
  reporterName: 'John Doe',
  reporterEmail: 'john@example.com',
  reporterPhone: '555-123-4567'
});
```

### SFFormAutomation Class

Handles the browser automation for form submission:

```javascript
const automation = new SFFormAutomation({
  headless: false,  // Set to true for production
  timeout: 30000
});

const result = await automation.submitDamageReport(report);
```

### PotBuddyOrchestrator Class

Main orchestrator that handles the complete workflow:

```javascript
const orchestrator = new PotBuddyOrchestrator();

const result = await orchestrator.processDamageReport(cvAnalysis);
```

## 📋 Supported Damage Types

The automation supports all 7 SF.gov reporting categories:

1. **Pothole** - `https://www.sf.gov/report-pothole-and-street-issues`
2. **Sidewalk Crack** - `https://www.sf.gov/report-curb-and-sidewalk-problems`
3. **Graffiti** - `https://www.sf.gov/report-graffiti-issues`
4. **Overflowing Trash** - `https://www.sf.gov/report-garbage-container-issues`
5. **Faded Street Markings** - `https://www.sf.gov/report-faded-street-and-pavement-markings`
6. **Broken Street Light** - `https://www.sf.gov/report-problem-streetlight`
7. **Fallen Tree** - `https://www.sf.gov/report-damaged-or-fallen-tree`

## 🔧 Configuration

### Field Mappings

The automation uses intelligent field mapping to handle different form structures:

```javascript
const fieldMappings = {
  // Common fields
  'address': () => this.fillAddressField(damageReport),
  'description': () => this.fillDescriptionField(damageReport.description),
  'name': () => this.fillTextField('name', damageReport.reporterName),
  
  // Damage-specific fields
  'severity': () => this.fillSeverityField(damageReport.severity),
  'location': () => this.fillLocationField(damageReport)
};
```

### Automation Settings

```javascript
const config = {
  automation: {
    headless: false,        // Browser visibility
    timeout: 30000,         // Page load timeout
    retryAttempts: 3,       // Retry failed submissions
    delayBetweenAttempts: 2000  // Delay between retries
  }
};
```

## 🧪 Testing

### Test Suite

The test suite validates:

1. **Form Scraping** - Ensures all SF.gov forms can be scraped
2. **Damage Type Testing** - Tests each damage type submission
3. **Error Handling** - Validates error handling for invalid data
4. **Statistics** - Shows submission success rates

### Running Tests

```bash
# Full test suite
node test.js

# Specific tests
node test.js scrape                    # Form scraping only
node test.js test pothole              # Test pothole submission
node test.js test sidewalk             # Test sidewalk submission
```

## 📊 Output Files

The automation creates several output files:

- `sf-forms-data.json` - Raw scraped form data
- `sf-forms-analysis.json` - Analyzed field mappings
- `submission-history.json` - History of all submissions
- Screenshots and logs during testing

## 🔄 Integration with CV Pipeline

### Input Format

The automation expects CV analysis data in this format:

```javascript
const cvAnalysis = {
  damageType: 'pothole',
  description: 'Large pothole approximately 2 feet in diameter',
  latitude: 37.7749,
  longitude: -122.4194,
  imagePath: '/path/to/image.jpg',
  size: '2 feet in diameter',
  depth: '6 inches deep',
  severity: 'high',
  confidence: 0.95
};
```

### Processing Flow

1. **CV Analysis** → DamageReport object
2. **Form Selection** → Appropriate SF.gov form URL
3. **Field Mapping** → Intelligent field filling
4. **Image Upload** → Attach evidence photo
5. **Form Submission** → Submit to city
6. **Social Media** → Create awareness posts
7. **History Storage** → Save submission record

## 🚨 Error Handling

The automation includes comprehensive error handling:

- **Validation** - Validates all required fields
- **Retry Logic** - Retries failed submissions
- **Timeout Handling** - Handles slow page loads
- **Field Detection** - Gracefully handles missing fields
- **Network Issues** - Handles connection problems

## 🔒 Security Considerations

- **Rate Limiting** - Built-in delays between requests
- **User Agent** - Uses realistic browser user agent
- **Respectful Scraping** - Follows robots.txt guidelines
- **Error Logging** - Comprehensive error tracking

## 🚀 Production Deployment

### Environment Variables

```bash
# Production settings
HEADLESS=true
TIMEOUT=60000
RETRY_ATTEMPTS=5
```

### Monitoring

- Submission success rates
- Error tracking and logging
- Performance metrics
- Form structure changes

## 📈 Future Enhancements

1. **Multi-City Support** - Extend to other cities
2. **Dynamic Form Detection** - Auto-detect form changes
3. **Machine Learning** - Improve field mapping accuracy
4. **Real-time Monitoring** - Live submission tracking
5. **API Integration** - Direct API submission where available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the test suite output
- Review error logs
- Validate form structure changes
- Test with sample data

---

**Note**: This automation is designed for legitimate infrastructure reporting. Always ensure compliance with city guidelines and terms of service.
