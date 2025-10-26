"""
BrightData SERP API Integration
Searches for civic issue reporting forms based on location and issue type
"""

import requests
import os
from typing import Dict, Any, List, Optional
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_city_from_coordinates(latitude: float, longitude: float) -> Optional[str]:
    """
    Reverse geocode coordinates to get city name

    Args:
        latitude: GPS latitude
        longitude: GPS longitude

    Returns:
        City name or None if lookup fails
    """
    try:
        # Initialize geocoder with a user agent
        geolocator = Nominatim(user_agent="civicsight_app")

        # Reverse geocode
        location = geolocator.reverse(f"{latitude}, {longitude}", timeout=10)

        if location and location.raw.get('address'):
            address = location.raw['address']

            # Try to get city from various address fields
            city = (
                address.get('city') or
                address.get('town') or
                address.get('village') or
                address.get('municipality') or
                address.get('county')
            )

            if city:
                print(f"📍 Geocoded location: {city}, {address.get('state', '')} {address.get('country', '')}")
                return city

        print(f"⚠️ Could not determine city from coordinates ({latitude}, {longitude})")
        return None

    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"⚠️ Geocoding error: {str(e)}")
        return None


async def search_reporting_form(
    latitude: float,
    longitude: float,
    issue_type: str
) -> Dict[str, Any]:
    """
    Search for civic issue reporting form using BrightData SERP API

    Args:
        latitude: GPS latitude
        longitude: GPS longitude
        issue_type: Type of civic issue (e.g., "Road Crack", "Graffiti")

    Returns:
        Dictionary with search results
    """
    try:
        # Get city from coordinates
        city = get_city_from_coordinates(latitude, longitude)

        if not city:
            return {
                "success": False,
                "error": "Could not determine city from coordinates",
                "city": None,
                "search_query": None,
                "form_links": []
            }

        # Build exact search query: "{city} report {issue_category}"
        search_query = f"{city} report {issue_type}"
        print(f"🔍 Searching Google: '{search_query}'")

        # Get BrightData API credentials
        api_key = os.getenv("BRIGHTDATA_API_KEY")
        dataset_id = os.getenv("BRIGHTDATA_DATASET_ID", "gd_mfz5x93lmsjjjylob")

        if not api_key:
            print("⚠️ BRIGHTDATA_API_KEY not found in environment")
            print("ℹ️  Get your API key from: https://brightdata.com/")
            return {
                "success": False,
                "error": "BrightData API key not configured. Add BRIGHTDATA_API_KEY to .env file",
                "city": city,
                "search_query": search_query,
                "form_links": []
            }

        if not dataset_id:
            print("⚠️ BRIGHTDATA_DATASET_ID not configured, using default")
            dataset_id = "gd_mfz5x93lmsjjjylob"

        print(f"📡 Using dataset ID: {dataset_id}")

        # BrightData SERP API endpoint
        endpoint = f"https://api.brightdata.com/datasets/v3/trigger?dataset_id={dataset_id}"

        # Prepare request payload
        payload = [{
            "url": "https://www.google.com/",
            "keyword": search_query,
            "language": "en",
            "country": "US",
            "start_page": 1,
            "end_page": 1  # Only get first page of results
        }]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        print(f"📡 Calling BrightData SERP API...")

        # Make API request to trigger data collection
        response = requests.post(endpoint, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        # Parse initial response (contains snapshot_id)
        trigger_data = response.json()
        snapshot_id = trigger_data.get("snapshot_id")

        print(f"📸 Received snapshot ID: {snapshot_id}")

        if not snapshot_id:
            print(f"⚠️ No snapshot_id in response: {trigger_data}")
            return {
                "success": False,
                "error": "BrightData did not return a snapshot_id",
                "city": city,
                "search_query": search_query,
                "form_links": []
            }

        # Wait and retrieve the actual results using snapshot_id
        print(f"⏳ Retrieving results from snapshot...")
        import asyncio

        # Poll for results (BrightData processes asynchronously)
        max_retries = 30  # Increased from 10
        retry_delay = 3  # Increased from 2 seconds
        data = None

        for attempt in range(max_retries):
            await asyncio.sleep(retry_delay)

            # Fetch results using snapshot ID
            results_url = f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}?format=json"
            results_response = requests.get(results_url, headers=headers, timeout=30)

            if results_response.status_code == 200:
                data = results_response.json()
                print(f"✅ Retrieved results (attempt {attempt + 1})")
                print(f"📦 Response type: {type(data)}")
                print(f"📦 Response keys: {list(data.keys()) if isinstance(data, dict) else f'list with {len(data)} items'}")
                print(f"📦 Response sample: {json.dumps(data, indent=2)[:500] if data else 'empty'}...")

                # Check if data is ready (not empty)
                if data and (isinstance(data, list) and len(data) > 0 or isinstance(data, dict) and data):
                    break
                else:
                    print(f"⚠️ Data retrieved but empty, continuing to poll...")
            elif results_response.status_code == 202:
                print(f"⏳ Attempt {attempt + 1}/{max_retries} - Still processing (202)")
            else:
                print(f"⚠️ Attempt {attempt + 1}/{max_retries} - Unexpected status {results_response.status_code}")

        if not data or (isinstance(data, list) and len(data) == 0):
            print(f"⚠️ No data retrieved after {max_retries} attempts")
            return {
                "success": False,
                "error": f"BrightData results not ready after {max_retries * retry_delay} seconds",
                "city": city,
                "search_query": search_query,
                "form_links": [],
                "snapshot_id": snapshot_id
            }

        # Extract relevant links from results
        form_links = extract_form_links(data, city)

        # Find top .gov link
        gov_links = [link for link in form_links if ".gov" in link.get("url", "").lower()]
        top_link = gov_links[0] if gov_links else (form_links[0] if form_links else None)

        print(f"✅ Found {len(form_links)} results ({len(gov_links)} .gov sites)")
        if top_link:
            print(f"🎯 Top result: {top_link['url']}")

        return {
            "success": True,
            "city": city,
            "search_query": search_query,
            "top_link": top_link,
            "all_links": form_links,
            "snapshot_id": snapshot_id
        }

    except requests.exceptions.Timeout:
        print(f"⚠️ BrightData API timeout")
        return {
            "success": False,
            "error": "Search API timeout",
            "city": city if 'city' in locals() else None,
            "search_query": search_query if 'search_query' in locals() else None,
            "form_links": []
        }

    except requests.exceptions.RequestException as e:
        print(f"⚠️ BrightData API error: {str(e)}")
        return {
            "success": False,
            "error": f"Search API error: {str(e)}",
            "city": city if 'city' in locals() else None,
            "search_query": search_query if 'search_query' in locals() else None,
            "form_links": []
        }

    except Exception as e:
        print(f"⚠️ Unexpected error in form search: {str(e)}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "city": city if 'city' in locals() else None,
            "search_query": search_query if 'search_query' in locals() else None,
            "form_links": []
        }


def extract_form_links(data: Dict, city: str) -> List[Dict[str, str]]:
    """
    Extract relevant form links from BrightData SERP response

    Args:
        data: BrightData API response (list or dict)
        city: City name for relevance filtering

    Returns:
        List of dictionaries with link info
    """
    links = []

    # BrightData returns results in different formats depending on the dataset
    # This handles common SERP result structures
    try:
        print(f"🔍 Looking for results in response...")

        # BrightData SERP returns array with one item containing 'organic' results
        if isinstance(data, list) and len(data) > 0:
            print(f"   Data is a list with {len(data)} items")
            # Get first item (search results)
            search_data = data[0]

            # Check for organic results (actual Google search results)
            if isinstance(search_data, dict) and 'organic' in search_data:
                organic_results = search_data['organic']
                print(f"   Found 'organic' results with {len(organic_results)} items")

                for rank, result in enumerate(organic_results[:10], start=1):  # Top 10 results
                    link = result.get("link", "")
                    title = result.get("title", "")
                    description = result.get("description", "")

                    if link and title:  # Only add if we have a valid link and title
                        links.append({
                            "title": title,
                            "url": link,
                            "snippet": description,
                            "google_rank": rank,
                            "relevance_score": calculate_relevance({
                                "title": title,
                                "link": link,
                                "description": description,
                                "rank": rank
                            }, city)
                        })
            else:
                print(f"   No 'organic' key found in search_data")
                print(f"   Available keys: {list(search_data.keys()) if isinstance(search_data, dict) else 'not a dict'}")

        # Legacy handling for other response formats
        elif isinstance(data, dict):
            # Check for organic_results
            if 'organic_results' in data:
                print(f"   Found 'organic_results' with {len(data['organic_results'])} items")
                for result in data['organic_results'][:10]:
                    links.append({
                        "title": result.get("title", ""),
                        "url": result.get("link", ""),
                        "snippet": result.get("snippet", ""),
                        "relevance_score": calculate_relevance(result, city)
                    })

            # Alternative structure: results array
            elif 'results' in data:
                print(f"   Found 'results' with {len(data['results'])} items")
                for result in data['results'][:10]:
                    links.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", "") or result.get("link", ""),
                        "snippet": result.get("description", "") or result.get("snippet", ""),
                        "relevance_score": calculate_relevance(result, city)
                    })
            else:
                print(f"⚠️ Unknown dict format. Keys: {list(data.keys())}")

        else:
            print(f"⚠️ Unknown response format: {type(data)}")

        # Sort by relevance
        links.sort(key=lambda x: x['relevance_score'], reverse=True)

        print(f"✅ Extracted {len(links)} links")

    except Exception as e:
        print(f"⚠️ Error parsing SERP results: {str(e)}")
        import traceback
        print(traceback.format_exc())

    return links


def calculate_relevance(result: Dict, city: str) -> float:
    """
    Calculate relevance score for a search result

    Strategy: Trust Google's ranking as primary signal, boost .gov domains

    Args:
        result: Search result dictionary (with 'rank' field from Google)
        city: City name

    Returns:
        Relevance score (0.0 - 10.0+)
    """
    score = 0.0
    city_lower = city.lower()

    title = result.get("title", "").lower()
    # Handle both 'url' and 'link' fields
    url = result.get("url", "") or result.get("link", "")
    url_lower = url.lower() if url else ""
    # Handle both 'snippet' and 'description' fields
    snippet = result.get("snippet", "") or result.get("description", "")
    snippet_lower = snippet.lower() if snippet else ""

    # Get Google's ranking (1 = top result)
    google_rank = result.get("rank", 10)

    # Primary signal: Google's ranking (inverted - lower rank = higher score)
    # Rank 1 gets 10.0, Rank 2 gets 9.0, etc.
    score += (11 - google_rank)

    # Bonus for .gov domains (strong signal)
    if ".gov" in url_lower:
        score += 5.0

    # Bonus for exact match keywords in title
    if any(word in title for word in ["report", "form", "submit"]):
        score += 2.0

    # Bonus for 311 (civic reporting standard)
    if "311" in title or "311" in url_lower:
        score += 1.5

    # Bonus for city in URL
    if city_lower in url_lower:
        score += 1.0

    # Bonus for city in title
    if city_lower in title:
        score += 0.5

    return score


# ============================================================================
# Testing
# ============================================================================

async def test_search():
    """Test function for development"""
    # Test with San Francisco coordinates
    result = await search_reporting_form(
        latitude=37.7749,
        longitude=-122.4194,
        issue_type="Sidewalk Crack"
    )

    print("\n" + "="*60)
    print("Search Results:")
    print(json.dumps(result, indent=2))
    print("="*60 + "\n")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_search())
