# End-to-End Testing Guide

## Overview

The complete pipeline now works as follows:

```
📸 User uploads image + GPS coordinates
    ↓
🤖 Groq AI analyzes image (decision tree)
    ↓
🔍 BrightData finds SF.gov form URL
    ↓
🎭 Playwright submits form to SF.gov
    ↓
✅ User receives tracking number
```

---

## Prerequisites

### 1. Install Node.js Dependencies

```bash
cd /Users/arjunnanduri/Desktop/Coding\ Projects/CalHackProject/Potbot
npm install playwright
npx playwright install
```

### 2. Environment Variables

Make sure your `.env` file has:

```bash
# Backend/.env
GROQ_API_KEY=your_groq_api_key
BRIGHTDATA_API_KEY=your_brightdata_key
```

### 3. Python Dependencies

```bash
cd backend
pip install fastapi uvicorn python-multipart pillow pillow-heif groq python-dotenv
```

---

## Testing Options

### **Option 1: Quick Test (AI + BrightData Only)**

Test just the AI decision tree and BrightData search without actually submitting to SF.gov.

#### Temporarily Disable Playwright:

Edit `backend/main.py` line 198-227 and comment out the Playwright submission:

```python
# # Submit form to SF.gov using Playwright
# print(f"\n🎭 Submitting form to SF.gov via Playwright...")
# playwright_result = await submit_to_sfgov(...)
# ...

# For testing, just return analyzed status
tracking_number = None
status = "analyzed"
message = f"Issue detected: {issue_type}. {analysis_results['Text_Description']}"
```

#### Run Test:

```bash
# Terminal 1: Start backend
cd backend
python main.py

# Terminal 2: Test with curl
curl -X POST http://localhost:8000/api/submit-civic-issue \
  -F "image=@/path/to/pothole.jpg" \
  -F "latitude=37.755196" \
  -F "longitude=-122.423207"
```

#### Expected Response:

```json
{
  "tracking_id": "REPORT-abc123",
  "status": "analyzed",
  "message": "Issue detected: Road Crack. Large pothole...",
  "issue_type": "Road Crack",
  "confidence": 0.92,
  "reporting_url": "https://www.sf.gov/report-pothole-and-street-issues",
  "location_description": "Center of right lane...",
  "form_fields": {
    "damageType": "pothole",
    "issueType": "Street",
    "requestType": "Pothole/Pavement Defect",
    "requestDescription": "Large pothole..."
  },
  "tracking_number": null
}
```

**✅ Success if:**
- `status` = "analyzed"
- `form_fields` contains correct dropdown values from decision tree
- `issue_type` matches image content

---

### **Option 2: Full E2E Test (With Playwright Submission)**

Test the complete flow including actual form submission to SF.gov.

⚠️ **WARNING:** This will create REAL service requests on SF.gov! Only use with real civic issues or test carefully.

#### Prerequisites:

1. **Playwright scripts must accept command-line JSON input**

First, verify the Playwright scripts can accept JSON data. Let me check the current script structure:

```bash
cd scripts/sf-forms
cat unified-sf-form-automation.js | grep -A 5 "process.argv"
```

If the scripts don't accept command-line arguments yet, we need to update them. The integration expects:

```javascript
// At the top of each script:
const formData = JSON.parse(process.argv[2] || '{}');
```

#### Update Playwright Scripts (if needed):

**For `unified-sf-form-automation.js`:**

Add this at the beginning of the file (after imports):

```javascript
// Accept form data from command line
let formData = {};
if (process.argv[2]) {
  try {
    formData = JSON.parse(process.argv[2]);
    console.log('Received form data:', formData);
  } catch (e) {
    console.error('Failed to parse form data:', e);
  }
}
```

Then modify the test functions to use `formData` instead of hardcoded values.

**For `graffiti-all-types-tester.js` and `fallen-tree-form-tester.js`:**

Same pattern - add command-line argument parsing.

#### Run Full E2E Test:

```bash
# Terminal 1: Start backend
cd backend
python main.py

# Terminal 2: Start frontend (if using)
cd frontend
npm start

# Option A: Test via frontend
# 1. Open http://localhost:3000
# 2. Upload a pothole image
# 3. Enter GPS coordinates
# 4. Click submit

# Option B: Test via curl
curl -X POST http://localhost:8000/api/submit-civic-issue \
  -F "image=@/Users/arjunnanduri/Desktop/test-pothole.jpg" \
  -F "latitude=37.755196" \
  -F "longitude=-122.423207"
```

#### Expected Response:

```json
{
  "tracking_id": "REPORT-abc123",
  "status": "submitted",  // ← Changed from "analyzed"
  "message": "Issue submitted successfully! Tracking number: 101002860550",
  "issue_type": "Road Crack",
  "confidence": 0.92,
  "reporting_url": "https://www.sf.gov/report-pothole-and-street-issues",
  "location_description": "Center of right lane...",
  "form_fields": {
    "damageType": "pothole",
    "issueType": "Street",
    "requestType": "Pothole/Pavement Defect",
    "requestDescription": "Large pothole..."
  },
  "tracking_number": "101002860550"  // ← Real tracking number!
}
```

**✅ Success if:**
- `status` = "submitted"
- `tracking_number` is a 12-digit number
- You can verify the request on SF.gov using the tracking number

---

## Debugging Issues

### **Issue: "Scripts directory not found"**

**Cause:** Playwright integration can't find `scripts/sf-forms/`

**Fix:**
```bash
# Verify directory exists
ls -la scripts/sf-forms/

# If not, check your project structure
pwd
```

### **Issue: "Playwright script not found"**

**Cause:** Script files missing or wrong names

**Fix:**
```bash
# Verify scripts exist
ls -la scripts/sf-forms/unified-sf-form-automation.js
ls -la scripts/sf-forms/graffiti-all-types-tester.js
ls -la scripts/sf-forms/fallen-tree-form-tester.js
```

### **Issue: "node: command not found"**

**Cause:** Node.js not installed

**Fix:**
```bash
# Install Node.js
brew install node  # macOS
# or download from nodejs.org
```

### **Issue: "Playwright script failed"**

**Cause:** Script execution error

**Debug:**
```bash
# Run script manually to see error
cd scripts/sf-forms
node unified-sf-form-automation.js '{"damageType":"pothole","issueType":"Street"}'
```

**Common fixes:**
- Install Playwright: `npx playwright install`
- Check script syntax
- Verify script accepts command-line arguments

### **Issue: "Could not extract tracking number"**

**Cause:** Script output format doesn't match regex patterns

**Debug:**

Check what the script actually outputs:

```bash
cd scripts/sf-forms
node unified-sf-form-automation.js '{...}' > output.txt 2>&1
cat output.txt
```

Then update the regex patterns in `playwright_integration.py:extract_tracking_number()` to match the actual output format.

### **Issue: "Script timeout after 120s"**

**Cause:** Form submission taking too long

**Fix:**

Increase timeout in `main.py`:

```python
playwright_result = await submit_to_sfgov(
    category=issue_type,
    form_fields=analysis_results.get('formFields', {}),
    latitude=latitude,
    longitude=longitude,
    location_description=analysis_results.get('locationDescription', ''),
    request_description=analysis_results.get('Text_Description', ''),
    image_path=file_path,
    timeout=300  # ← Increase to 5 minutes
)
```

---

## Test Cases

### **Test Case 1: Road Pothole**

**Image:** Large pothole in street
**GPS:** `37.755196, -122.423207`

**Expected AI Output:**
```json
{
  "category": "Road Crack",
  "formFields": {
    "damageType": "pothole",
    "issueType": "Street",
    "requestType": "Pothole/Pavement Defect"
  }
}
```

**Expected Script:** `unified-sf-form-automation.js`

---

### **Test Case 2: Sidewalk Crack**

**Image:** Cracked sidewalk
**GPS:** `37.755196, -122.423207`

**Expected AI Output:**
```json
{
  "category": "Sidewalk Crack",
  "formFields": {
    "damageType": "sidewalk",
    "issueType": "Sidewalk/Curb",
    "requestType": "Sidewalk Defect",
    "secondaryRequestType": "Cracked sidewalk"
  }
}
```

**Expected Script:** `unified-sf-form-automation.js`

---

### **Test Case 3: Graffiti on Building**

**Image:** Graffiti on commercial building
**GPS:** `37.755196, -122.423207`

**Expected AI Output:**
```json
{
  "category": "Graffiti",
  "formFields": {
    "issueType": "Graffiti on Private Property",
    "requestRegarding": "Not Offensive (no racial slurs or profanity)",
    "requestType": "Building - Commercial"
  }
}
```

**Expected Script:** `graffiti-all-types-tester.js`

---

### **Test Case 4: Fallen Tree**

**Image:** Tree fallen across sidewalk
**GPS:** `37.755196, -122.423207`

**Expected AI Output:**
```json
{
  "category": "Fallen Tree",
  "formFields": {
    "requestRegarding": "Damaged Tree",
    "requestType": "Fallen tree"
  }
}
```

**Expected Script:** `fallen-tree-form-tester.js`

---

## Verification Checklist

After each test, verify:

- [ ] ✅ **AI Analysis** - Correct category detected
- [ ] ✅ **Form Fields** - Correct dropdown values selected from decision tree
- [ ] ✅ **BrightData Search** - Correct SF.gov form URL returned
- [ ] ✅ **Script Selection** - Correct Playwright script called
- [ ] ✅ **Data Preparation** - All required fields present in Playwright input
- [ ] ✅ **Script Execution** - No errors during execution
- [ ] ✅ **Tracking Number** - Valid 12-digit number extracted
- [ ] ✅ **Response Status** - Status = "submitted" (or "analyzed" for quick test)
- [ ] ✅ **SF.gov Verification** - Can look up request on SF.gov using tracking number

---

## Next Steps After Testing

Once E2E testing is successful:

1. **Add Error Handling** - Handle edge cases (timeout, network errors, etc.)
2. **Add Retry Logic** - Retry failed submissions
3. **Add Logging** - Log all submissions for debugging
4. **Add Social Media Integration** - Post to Twitter/Facebook
5. **Add User Notifications** - Email/SMS with tracking number
6. **Deploy to Production** - Set up production environment

---

## Production Considerations

### **1. Rate Limiting**

SF.gov may rate-limit submissions. Add delays between requests:

```python
import asyncio
await asyncio.sleep(5)  # 5 second delay between submissions
```

### **2. Headless Mode**

For production, run Playwright in headless mode. Update Playwright scripts:

```javascript
const browser = await chromium.launch({
  headless: true  // ← No browser window
});
```

### **3. Error Monitoring**

Add monitoring for failed submissions:
- Track success rate
- Alert on failures
- Log all errors

### **4. Testing Environment**

Use a test/staging environment before production to avoid creating fake service requests.

---

## Contact Information Handling

The Playwright scripts may need contact information. Options:

**Option 1: Use placeholder info for testing**
```python
contact_info = {
  "name": "Test User",
  "email": "test@potbuddy.com",
  "phone": "555-0100"
}
```

**Option 2: Collect from user**

Update frontend to collect:
- User name (optional)
- User email (optional)
- User phone (optional)

Then pass to Playwright scripts.

---

**Good luck with testing!** 🚀

If you encounter any issues, check the logs and error messages. Most issues are related to:
1. Missing Node.js dependencies
2. Playwright scripts not accepting command-line arguments
3. Incorrect file paths
4. Missing environment variables
