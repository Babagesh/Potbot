# Error Handling - Reporting URL Required

## Summary

The pipeline now **requires** a valid reporting URL from BrightData before proceeding. If the form search fails or doesn't return a URL, the endpoint throws an HTTP 500 error.

This is critical because Playwright needs a URL for automated form submission.

## Changes Made

### 1. Strict Validation ([main.py:167-181](main.py#L167-L181))

After BrightData search completes, we validate the results:

```python
# Validate that we got a reporting URL (required for form submission)
if not form_search_result['success']:
    error_msg = form_search_result.get('error', 'Unknown error')
    print(f"❌ Form search failed: {error_msg}")
    raise HTTPException(
        status_code=500,
        detail=f"Failed to find reporting form: {error_msg}"
    )

if not form_search_result.get('top_link') or not form_search_result['top_link'].get('url'):
    print(f"❌ No reporting URL found for {issue_type}")
    raise HTTPException(
        status_code=500,
        detail=f"No reporting form URL found for {issue_type}. Cannot proceed with form submission."
    )

reporting_url = form_search_result['top_link']['url']
print(f"✓ Found reporting form: {reporting_url}")
```

### 2. Exception Handling ([main.py:198-200](main.py#L198-L200))

HTTPExceptions are re-raised to properly return error responses:

```python
except HTTPException:
    # Re-raise HTTPExceptions (form search failures, validation errors)
    raise
except Exception as e:
    # Other errors get caught here
    ...
```

## Error Scenarios

### ❌ Scenario 1: BrightData API Failure

**Trigger**: BrightData API timeout or error

**Response**:
```json
{
  "detail": "Failed to find reporting form: BrightData results not ready after 90 seconds"
}
```

**HTTP Status**: 500

---

### ❌ Scenario 2: No Reporting URL Found

**Trigger**: BrightData returns empty results or no .gov links

**Response**:
```json
{
  "detail": "No reporting form URL found for Graffiti. Cannot proceed with form submission."
}
```

**HTTP Status**: 500

---

### ❌ Scenario 3: Invalid Coordinates

**Trigger**: GPS coordinates don't map to a valid city

**Response**:
```json
{
  "detail": "Failed to find reporting form: Could not determine city from coordinates"
}
```

**HTTP Status**: 500

---

### ✅ Scenario 4: Success

**Trigger**: Valid civic issue detected + BrightData finds reporting URL

**Response**:
```json
{
  "tracking_id": "REPORT-ABC123",
  "status": "analyzed",
  "issue_type": "Road Crack",
  "confidence": 0.87,
  "reporting_url": "https://www.sf.gov/report-pothole-and-street-issues",
  ...
}
```

**HTTP Status**: 200

## Why This Matters

1. **Playwright Requirement**: Form submission automation needs a valid URL
2. **Fail Fast**: Don't proceed if we can't complete the full pipeline
3. **Clear Errors**: User gets specific error message about what failed
4. **No Silent Failures**: `reporting_url=null` is NOT acceptable for production

## Testing

```bash
# Valid request (should succeed)
curl -X POST http://localhost:8000/api/submit-civic-issue \
  -F "image=@pothole.jpg" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"

# Invalid coordinates (should fail with 500)
curl -X POST http://localhost:8000/api/submit-civic-issue \
  -F "image=@pothole.jpg" \
  -F "latitude=0.0" \
  -F "longitude=0.0"
```

## Next Steps

The `reporting_url` is guaranteed to be a valid string when the response succeeds. Playwright can now:

```python
# Playwright form submission can safely assume reporting_url exists
async def submit_form(reporting_url: str, issue_data: dict):
    browser = await playwright.chromium.launch()
    page = await browser.new_page()
    await page.goto(reporting_url)  # ✓ Always valid
    # ... fill form ...
```
