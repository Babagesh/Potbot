# Pipeline Output - Visualization

## New Structured Output

When you submit an image, you'll now see a clean, structured output in the backend logs:

### Example 1: Successful Detection (Fallen Tree)

```
================================================================================
🚀 STARTING PIPELINE: REPORT-7B6983A4
================================================================================
📸 Image: processed_d9b4ff39.jpg
📍 GPS: (37.7749, -122.4194)
================================================================================

🔍 Starting AI analysis...
Encoding image: uploads/processed_d9b4ff39.jpg
Resized image from original to (1024, 768)
Image size: 320.3 KB
Sending request to Groq (meta-llama/llama-4-scout-17b-16e-instruct)...
Received response from Groq
✅ Issue detected: Fallen Tree (confidence: 0.90)
✅ Analysis complete: Fallen Tree (confidence: 0.9)
✓ Valid civic issue detected: Fallen Tree

🔍 Searching for reporting form...
📍 Geocoded location: San Francisco, California United States of America
🔍 Searching Google: 'San Francisco report Fallen Tree'
📡 Using dataset ID: gd_mfz5x93lmsjjjylob
📡 Calling BrightData SERP API...
📸 Received snapshot ID: sd_mh76q81y2mqjjdv67w
⏳ Retrieving results from snapshot...
⏳ Attempt 1/30 - Still processing (202)
✅ Retrieved results (attempt 2)
📦 Response type: <class 'list'>
📦 Response keys: list with 1 items
🔍 Looking for results in response...
   Data is a list with 1 items
   Found 'organic' results with 9 items
✅ Extracted 9 links
✅ Found 9 results (2 .gov sites)
🎯 Top result: https://www.sf.gov/report-damaged-or-fallen-tree

✅ Found reporting form: https://www.sf.gov/report-damaged-or-fallen-tree

================================================================================
📋 PIPELINE RESPONSE
================================================================================
Tracking ID:    REPORT-7B6983A4
Status:         analyzed
Issue Type:     Fallen Tree
Confidence:     0.9
Reporting URL:  https://www.sf.gov/report-damaged-or-fallen-tree
Message:        Issue detected: Fallen Tree. A large tree has fallen across the sidewalk, blocking...
================================================================================

INFO:     127.0.0.1:50070 - "POST /api/submit-civic-issue HTTP/1.1" 200 OK
```

---

### Example 2: Rejected Image (Not Civic Infrastructure)

```
================================================================================
🚀 STARTING PIPELINE: REPORT-ABC12345
================================================================================
📸 Image: processed_laptop123.jpg
📍 GPS: (37.7749, -122.4194)
================================================================================

🔍 Starting AI analysis...
Encoding image: uploads/processed_laptop123.jpg
Resized image from original to (1024, 768)
Image size: 215.7 KB
Sending request to Groq (meta-llama/llama-4-scout-17b-16e-instruct)...
Received response from Groq
✅ Analysis complete: None (confidence: 0.0)
❌ Image rejected: Not civic infrastructure

================================================================================
📋 PIPELINE RESPONSE
================================================================================
Tracking ID:    REPORT-ABC12345
Status:         rejected
Issue Type:     N/A
Confidence:     N/A
Reporting URL:  N/A
Message:        Image rejected: The image provided does not contain any civic infrastructure. It ap...
================================================================================

INFO:     127.0.0.1:50070 - "POST /api/submit-civic-issue HTTP/1.1" 200 OK
```

---

### Example 3: Error - No Reporting Form Found

```
================================================================================
🚀 STARTING PIPELINE: REPORT-XYZ789
================================================================================
📸 Image: processed_graffiti456.jpg
📍 GPS: (0.0, 0.0)
================================================================================

🔍 Starting AI analysis...
✅ Analysis complete: Graffiti (confidence: 0.85)
✓ Valid civic issue detected: Graffiti

🔍 Searching for reporting form...
⚠️ Could not determine city from coordinates (0.0, 0.0)
❌ Form search failed: Could not determine city from coordinates

ERROR:    Exception in ASGI application
HTTPException: 500
Detail: Failed to find reporting form: Could not determine city from coordinates

INFO:     127.0.0.1:50070 - "POST /api/submit-civic-issue HTTP/1.1" 500 Internal Server Error
```

## Benefits

1. **Clear Structure**: Easy to see where each stage begins/ends
2. **Visual Indicators**: Emojis make it easy to scan for success/failure
3. **Pipeline Summary**: Final response box shows all key information
4. **Debug-Friendly**: All intermediate steps are still logged
5. **Status at a Glance**: Can quickly see if URL was found

## Key Sections

### 1. Pipeline Start
```
🚀 STARTING PIPELINE: [tracking_id]
📸 Image: [filename]
📍 GPS: [coordinates]
```

### 2. AI Analysis
```
🔍 Starting AI analysis...
✅ Analysis complete: [issue_type] (confidence: [score])
```

### 3. Form Search
```
🔍 Searching for reporting form...
✅ Found reporting form: [url]
```

### 4. Final Response
```
📋 PIPELINE RESPONSE
Tracking ID:    [id]
Status:         [status]
Issue Type:     [type]
Confidence:     [score]
Reporting URL:  [url]
```

This makes it much easier to monitor the pipeline in production! 🎉
