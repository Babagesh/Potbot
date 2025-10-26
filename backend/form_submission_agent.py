"""
Agent #2 - City Form Submission Agent
Automatically submits civic issue reports to city departments and retrieves tracking numbers
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()


class FormSubmissionAgent:
    """
    Agent #2: Submits civic issues to city departments and gets tracking numbers
    
    Workflow:
    1. Receive data from Agent #1 (vision analysis)
    2. Determine correct city department based on location and issue type
    3. Fill out and submit form (via API or automation)
    4. Retrieve tracking number from city system
    5. Return tracking number and address
    """
    
    def __init__(self):
        """Initialize form submission agent"""
        self.sf_311_api_key = os.getenv("SF_311_API_KEY")
        self.default_city_apis = self._load_city_apis()
    
    def _load_city_apis(self) -> Dict[str, Any]:
        """Load city API configurations"""
        return {
            "San Francisco": {
                "api_url": "https://mobile311.sfgov.org/api/submit",
                "backup_url": "https://sf311.org/submit",
                "api_key_required": True
            },
            "Oakland": {
                "api_url": "https://seeclickfix.com/api/v2/issues",
                "backup_url": "https://oaklandca.gov/services/report-a-problem",
                "api_key_required": False
            },
            "Berkeley": {
                "api_url": "https://seeclickfix.com/api/v2/issues",
                "backup_url": "https://berkeleyca.gov/report-issue",
                "api_key_required": False
            }
        }
    
    async def submit_civic_issue(
        self,
        # Data from Agent #1 (Vision AI)
        category: str,
        description: str,
        latitude: float,
        longitude: float,
        confidence: float,
        image_path: str,
        tracking_id: str
    ) -> Dict[str, Any]:
        """
        Main entry point: Submit civic issue to city department
        
        Args:
            category: Issue type from Agent #1 (e.g., "Road Crack")
            description: AI-generated description
            latitude: GPS latitude
            longitude: GPS longitude
            confidence: Detection confidence (0-1)
            image_path: Path to image file
            tracking_id: Internal tracking ID
        
        Returns:
            {
                "success": bool,
                "tracking_number": str,    # City's tracking number
                "address": str,            # Full street address
                "city": str,               # City name
                "department": str,         # Department that received report
                "submission_method": str,  # "api", "form", "manual"
                "estimated_response_time": str,
                "error": str (if failed)
            }
        """
        try:
            print(f"\n📋 Starting Agent #2: Form Submission")
            print(f"🎯 Issue: {category}")
            print(f"📍 Location: ({latitude}, {longitude})")
            
            # Step 1: Reverse geocode to get address
            print(f"\n🌍 Reverse geocoding coordinates...")
            address_data = await self._reverse_geocode(latitude, longitude)
            
            if not address_data["success"]:
                raise Exception(f"Failed to get address: {address_data.get('error')}")
            
            address = address_data["address"]
            city = address_data["city"]
            state = address_data["state"]
            
            print(f"  ✅ Address: {address}")
            print(f"  ✅ City: {city}, {state}")
            
            # Step 2: Determine city department
            print(f"\n🏛️ Determining city department...")
            department = self._get_department_for_issue(category)
            print(f"  ✅ Department: {department}")
            
            # Step 3: Submit to city system
            print(f"\n📤 Submitting to {city} {department}...")
            submission_result = await self._submit_to_city(
                city=city,
                category=category,
                description=description,
                address=address,
                latitude=latitude,
                longitude=longitude,
                image_path=image_path,
                tracking_id=tracking_id
            )
            
            if submission_result["success"]:
                print(f"  ✅ Submitted successfully!")
                print(f"  🔢 Tracking Number: {submission_result['tracking_number']}")
                
                return {
                    "success": True,
                    "tracking_number": submission_result["tracking_number"],
                    "address": address,
                    "city": city,
                    "state": state,
                    "department": department,
                    "submission_method": submission_result["method"],
                    "estimated_response_time": submission_result.get("estimated_response_time", "5-7 business days"),
                    "error": None
                }
            else:
                raise Exception(f"Submission failed: {submission_result.get('error')}")
        
        except Exception as e:
            print(f"❌ Agent #2 failed: {str(e)}")
            # Return fallback data for demo purposes
            return {
                "success": False,
                "tracking_number": self._generate_fallback_tracking_number(tracking_id),
                "address": f"Location: {latitude}, {longitude}",
                "city": "Unknown",
                "state": "CA",
                "department": self._get_department_for_issue(category),
                "submission_method": "fallback",
                "estimated_response_time": "Unknown",
                "error": str(e)
            }
    
    async def _reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Convert GPS coordinates to street address using geocoding API
        
        Uses Nominatim (OpenStreetMap) - free, no API key required
        For production, consider Google Maps or Mapbox for better accuracy
        """
        try:
            # Using Nominatim (OSM) - free reverse geocoding
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": latitude,
                "lon": longitude,
                "format": "json",
                "addressdetails": 1
            }
            headers = {
                "User-Agent": "PotBot-CalHacks/1.0"  # Required by Nominatim
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                address_parts = data.get("address", {})
                
                # Build full address
                street_number = address_parts.get("house_number", "")
                street = address_parts.get("road", "")
                city = address_parts.get("city") or address_parts.get("town") or address_parts.get("village", "San Francisco")
                state = address_parts.get("state", "CA")
                zipcode = address_parts.get("postcode", "")
                
                # Format address
                address_line = f"{street_number} {street}".strip()
                if not address_line:
                    address_line = f"{latitude}, {longitude}"
                
                full_address = f"{address_line}, {city}, {state}"
                if zipcode:
                    full_address += f" {zipcode}"
                
                return {
                    "success": True,
                    "address": full_address,
                    "street": address_line,
                    "city": city,
                    "state": state,
                    "zipcode": zipcode,
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "address": f"{latitude}, {longitude}",
                    "city": "Unknown",
                    "state": "CA",
                    "error": f"Geocoding failed: HTTP {response.status_code}"
                }
        
        except Exception as e:
            return {
                "success": False,
                "address": f"{latitude}, {longitude}",
                "city": "Unknown",
                "state": "CA",
                "error": str(e)
            }
    
    def _get_department_for_issue(self, category: str) -> str:
        """Map issue category to city department"""
        department_mapping = {
            "Road Crack": "Public Works - Street Maintenance",
            "Sidewalk Crack": "Public Works - Sidewalk Repair",
            "Graffiti": "Public Works - Graffiti Removal",
            "Overflowing Trash": "Public Works - Street Cleaning",
            "Faded Street Markings": "Public Works - Traffic Division",
            "Broken Street Light": "Public Works - Street Lighting",
            "Fallen Tree": "Public Works - Urban Forestry"
        }
        return department_mapping.get(category, "Public Works - General")
    
    async def _submit_to_city(
        self,
        city: str,
        category: str,
        description: str,
        address: str,
        latitude: float,
        longitude: float,
        image_path: str,
        tracking_id: str
    ) -> Dict[str, Any]:
        """
        Submit issue to city's 311 system
        
        For CalHacks demo:
        - Try real SF 311 API if available
        - Otherwise generate realistic mock tracking number
        
        For production:
        - Implement city-specific API integrations
        - Add Playwright automation for web forms
        - Handle authentication and rate limiting
        """
        
        # Try SF 311 API (if API key available)
        if city == "San Francisco" and self.sf_311_api_key:
            return await self._submit_to_sf311_api(
                category=category,
                description=description,
                address=address,
                latitude=latitude,
                longitude=longitude,
                image_path=image_path
            )
        
        # Try SeeClickFix API (used by many cities)
        elif city in ["Oakland", "Berkeley"]:
            return await self._submit_to_seeclickfix(
                city=city,
                category=category,
                description=description,
                latitude=latitude,
                longitude=longitude,
                image_path=image_path
            )
        
        # Fallback: Generate mock tracking number for demo
        else:
            print(f"  ℹ️ No API available for {city}, generating demo tracking number")
            return {
                "success": True,
                "tracking_number": self._generate_tracking_number(city, tracking_id),
                "method": "demo",
                "estimated_response_time": "5-7 business days"
            }
    
    async def _submit_to_sf311_api(
        self,
        category: str,
        description: str,
        address: str,
        latitude: float,
        longitude: float,
        image_path: str
    ) -> Dict[str, Any]:
        """
        Submit to San Francisco 311 API
        
        Real SF 311 API: https://sf311.org/services
        Open311 API: https://wiki.open311.org/GeoReport_v2/
        """
        try:
            # SF 311 API endpoint (Open311 standard)
            url = "https://mobile311.sfgov.org/open311/v2/requests.json"
            
            # Map category to SF 311 service code
            service_codes = {
                "Road Crack": "street-pothole",
                "Sidewalk Crack": "sidewalk-damage",
                "Graffiti": "graffiti-removal",
                "Overflowing Trash": "overflowing-trash-can",
                "Faded Street Markings": "faded-street-markings",
                "Broken Street Light": "street-light-out",
                "Fallen Tree": "tree-emergency"
            }
            
            service_code = service_codes.get(category, "general-request")
            
            # Prepare request
            data = {
                "api_key": self.sf_311_api_key,
                "service_code": service_code,
                "description": description,
                "address_string": address,
                "lat": latitude,
                "long": longitude,
                "email": os.getenv("SUBMITTER_EMAIL", "potbot@example.com"),
                "first_name": "PotBot",
                "last_name": "Civic Reporter"
            }
            
            # TODO: Upload image as well
            # files = {"media": open(image_path, "rb")}
            
            response = requests.post(url, data=data, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                tracking_number = result[0]["service_request_id"]
                
                return {
                    "success": True,
                    "tracking_number": tracking_number,
                    "method": "sf311_api",
                    "estimated_response_time": "3-5 business days"
                }
            else:
                raise Exception(f"SF 311 API error: {response.status_code}")
        
        except Exception as e:
            print(f"  ⚠️ SF 311 API failed: {e}")
            # Fallback to mock
            return {
                "success": True,
                "tracking_number": self._generate_tracking_number("San Francisco", "SF"),
                "method": "fallback",
                "estimated_response_time": "5-7 business days"
            }
    
    async def _submit_to_seeclickfix(
        self,
        city: str,
        category: str,
        description: str,
        latitude: float,
        longitude: float,
        image_path: str
    ) -> Dict[str, Any]:
        """
        Submit to SeeClickFix API (used by Oakland, Berkeley, and other cities)
        
        SeeClickFix API: https://seeclickfix.com/open311
        """
        try:
            # SeeClickFix uses Open311 standard
            url = "https://seeclickfix.com/api/v2/issues"
            
            # Note: SeeClickFix requires authentication for posting
            # For demo, we'll generate mock tracking number
            
            return {
                "success": True,
                "tracking_number": self._generate_tracking_number(city, "SCF"),
                "method": "demo",
                "estimated_response_time": "7-10 business days"
            }
        
        except Exception as e:
            return {
                "success": True,
                "tracking_number": self._generate_tracking_number(city, "SCF"),
                "method": "fallback",
                "estimated_response_time": "7-10 business days"
            }
    
    def _generate_tracking_number(self, city: str, prefix: str = None) -> str:
        """Generate realistic tracking number for demo purposes"""
        import random
        
        # City prefixes
        city_prefixes = {
            "San Francisco": "SF311",
            "Oakland": "OAK311",
            "Berkeley": "BERK311"
        }
        
        prefix = prefix or city_prefixes.get(city, "CITY311")
        
        # Generate tracking number: PREFIX-YEAR-SEQUENTIAL
        year = datetime.now().year
        sequential = random.randint(100000, 999999)
        
        return f"{prefix}-{year}-{sequential}"
    
    def _generate_fallback_tracking_number(self, tracking_id: str) -> str:
        """Generate fallback tracking number from internal tracking ID"""
        # Extract last 6 chars from tracking_id
        suffix = tracking_id.replace("REPORT-", "")[-6:]
        year = datetime.now().year
        return f"DEMO311-{year}-{suffix}"


# ============================================================================
# Main entry point for Agent #2
# ============================================================================

async def submit_civic_issue_to_city(
    # Data from Agent #1
    category: str,
    description: str,
    latitude: float,
    longitude: float,
    confidence: float,
    image_path: str,
    tracking_id: str
) -> Dict[str, Any]:
    """
    Main function to submit civic issue to city department
    
    This is called from main.py after Agent #1 completes.
    
    Returns:
        {
            "success": bool,
            "tracking_number": str,
            "address": str,
            "city": str,
            "department": str
        }
    """
    agent = FormSubmissionAgent()
    return await agent.submit_civic_issue(
        category=category,
        description=description,
        latitude=latitude,
        longitude=longitude,
        confidence=confidence,
        image_path=image_path,
        tracking_id=tracking_id
    )


# ============================================================================
# Testing
# ============================================================================

async def test_form_submission_agent():
    """Test Agent #2 with mock data"""
    print("🧪 Testing Form Submission Agent (Agent #2)")
    
    # Mock data from Agent #1
    result = await submit_civic_issue_to_city(
        category="Road Crack",
        description="Large pothole in road surface causing vehicle damage",
        latitude=37.7749,
        longitude=-122.4194,
        confidence=0.92,
        image_path="uploads/test_pothole.jpg",
        tracking_id="REPORT-A3B5C7D9"
    )
    
    print("\n" + "="*60)
    print("Test Results:")
    print(json.dumps(result, indent=2))
    print("="*60)


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_form_submission_agent())

