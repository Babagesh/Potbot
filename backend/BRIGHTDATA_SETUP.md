# BrightData SERP API Setup

This module uses BrightData's SERP (Search Engine Results Page) API to automatically find civic issue reporting forms based on location and issue type.

## How It Works

1. **Reverse Geocoding**: Converts GPS coordinates → City name using Nominatim
2. **Search Query**: Builds query: `"{city} report {issue_type}"`
3. **SERP API**: Triggers BrightData to scrape Google search results
4. **Polling**: Waits for results to be ready (15-30 seconds)
5. **Parsing**: Extracts organic search results from response
6. **Relevance Scoring**: Ranks results (prioritizes .gov sites, 311 forms)
7. **Returns**: Top link (preferring .gov) + all results

## Setup

### 1. Get BrightData API Key

Your account: `hl_2588f7fb`

1. Log in to https://brightdata.com/
2. Go to API section
3. Copy your API key (starts with `Bearer ` token)

### 2. Add to .env

```bash
BRIGHTDATA_API_KEY=your_api_key_here
BRIGHTDATA_DATASET_ID=gd_mfz5x93lmsjjjylob
```

### 3. Test the Endpoint

Restart your server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Test endpoint:
```bash
curl "http://localhost:8000/api/test/search-form?latitude=37.7749&longitude=-122.4194&issue_type=Road%20Crack"
```

Or visit:
```
http://localhost:8000/docs
```
Look for `/api/test/search-form` endpoint.

## Example Response

```json
{
  "success": true,
  "city": "San Francisco",
  "search_query": "San Francisco report Road Crack",
  "top_link": {
    "title": "Report street and road maintenance issues",
    "url": "https://www.sf.gov/report-street-and-road-maintenance-issues",
    "snippet": "Report potholes, damaged roads, and other street issues...",
    "relevance_score": 0.8
  },
  "all_links": [
    {
      "title": "Report street and road maintenance issues",
      "url": "https://www.sf.gov/report-street-and-road-maintenance-issues",
      "snippet": "Report potholes, damaged roads, and other street issues...",
      "relevance_score": 0.8
    },
    {
      "title": "San Francisco Public Works",
      "url": "https://sfpublicworks.org/report",
      "snippet": "Submit a service request...",
      "relevance_score": 0.15
    }
  ],
  "snapshot_id": "s_abc123"
}
```

## Relevance Scoring

The system ranks results based on:
- ✅ `.gov` domain: +0.5 (highest priority)
- ✅ City name in URL: +0.2
- ✅ Keywords in title ("report", "form", "submit", "311"): +0.15
- ✅ City name in title: +0.1
- ✅ "311" reference in title/URL: +0.1
- ✅ Keywords in description: +0.05

**Top Link Logic:**
1. Prioritizes first .gov link
2. Falls back to highest scoring non-.gov link if no .gov found

## Integration with Main Pipeline

The form search can be integrated into your main civic issue submission:

```python
# In main.py submit_civic_issue endpoint:

# After image analysis
if analysis_results['category'] != "None":
    # Search for reporting form
    form_search = await search_reporting_form(
        latitude, longitude, analysis_results['category']
    )

    if form_search['success'] and form_search['form_links']:
        top_form = form_search['form_links'][0]
        # Use this URL for Playwright automation
```

## Testing Different Locations

Try various cities:

**San Francisco:**
```bash
curl "http://localhost:8000/api/test/search-form?latitude=37.7749&longitude=-122.4194&issue_type=Graffiti"
```

**New York:**
```bash
curl "http://localhost:8000/api/test/search-form?latitude=40.7128&longitude=-74.0060&issue_type=Road%20Crack"
```

**Los Angeles:**
```bash
curl "http://localhost:8000/api/test/search-form?latitude=34.0522&longitude=-118.2437&issue_type=Overflowing%20Trash"
```

## Reverse Geocoding

Uses Nominatim (OpenStreetMap) for free reverse geocoding:
- No API key required
- Respects rate limits
- Returns city, town, village, or county

## Error Handling

The system handles:
- ❌ Invalid coordinates → Returns error with city=None
- ❌ BrightData API timeout → Returns empty form_links
- ❌ API key missing → Returns error message
- ❌ No results found → Returns empty form_links array

## Cost Considerations

### BrightData SERP API
- **Dataset:** `gd_mfz5x93lmsjjjylob`
- **Cost:** Pay-per-use (check BrightData pricing)
- **Rate Limits:** Depends on your plan
- **Optimization:** Only search when issue detected (not for spam)

### Nominatim (Geocoding)
- **Cost:** Free
- **Rate Limit:** 1 request/second
- **Courtesy:** Uses proper user agent

## Next Steps

1. ✅ Test the endpoint with various locations
2. 🔨 Add your BrightData API key
3. 🔨 Integrate into main submission pipeline
4. 🔨 Use top form URL for Playwright automation
5. 🔨 Cache common city → form URL mappings

## Troubleshooting

### "Could not determine city from coordinates"
- Check coordinates are valid
- Try coordinates in a major city
- Geocoding service might be down (rare)

### "BrightData API key not configured"
- Make sure `BRIGHTDATA_API_KEY` is in `.env`
- Check no extra spaces or quotes
- Restart your server after adding key

### Empty `form_links` array
- BrightData might not have results for that city
- Try a major US city first (SF, NYC, LA)
- Check BrightData dashboard for API issues

### Low relevance scores
- Normal for some cities
- Top result is still likely correct
- Manual verification recommended for production

## Resources

- [BrightData Documentation](https://docs.brightdata.com/)
- [SERP API Guide](https://docs.brightdata.com/scraping-automation/web-data-apis/serp-api)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
