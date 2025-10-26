"""
Playwright Integration Module
Handles calling Node.js Playwright automation scripts and extracting results
"""

import subprocess
import json
import re
import os
from typing import Dict, Optional, Tuple
from pathlib import Path


class PlaywrightIntegration:
    """Manages Playwright script execution for SF.gov form automation"""

    def __init__(self, scripts_dir: str = None):
        """
        Initialize Playwright integration

        Args:
            scripts_dir: Path to scripts/sf-forms directory. If None, auto-detects.
        """
        if scripts_dir is None:
            # Auto-detect scripts directory (go up one level from backend, then into scripts/sf-forms)
            backend_dir = Path(__file__).parent
            project_root = backend_dir.parent
            scripts_dir = project_root / "scripts" / "sf-forms"

        self.scripts_dir = Path(scripts_dir)

        # Verify scripts directory exists
        if not self.scripts_dir.exists():
            raise FileNotFoundError(f"Scripts directory not found: {self.scripts_dir}")

        print(f"📁 Playwright scripts directory: {self.scripts_dir}")

    def get_script_for_category(self, category: str) -> Tuple[str, str]:
        """
        Map AI category to appropriate Playwright script

        Args:
            category: AI category (Road Crack, Sidewalk Crack, Graffiti, Fallen Tree)

        Returns:
            Tuple of (script_path, script_type) or raises ValueError if unknown
        """
        category_to_script = {
            "Road Crack": ("unified-sf-form-automation.js", "unified"),
            "Sidewalk Crack": ("unified-sf-form-automation.js", "unified"),
            "Graffiti": ("graffiti-all-types-tester.js", "graffiti"),
            "Fallen Tree": ("fallen-tree-form-tester.js", "tree")
        }

        if category not in category_to_script:
            raise ValueError(f"Unknown category: {category}. Expected one of: {list(category_to_script.keys())}")

        script_name, script_type = category_to_script[category]
        script_path = self.scripts_dir / script_name

        if not script_path.exists():
            raise FileNotFoundError(f"Playwright script not found: {script_path}")

        return str(script_path), script_type

    def prepare_playwright_data(
        self,
        category: str,
        form_fields: Dict,
        latitude: float,
        longitude: float,
        location_description: str,
        request_description: str,
        image_path: str
    ) -> Dict:
        """
        Prepare data structure for Playwright script

        Args:
            category: AI category
            form_fields: Form fields from AI analysis
            latitude: GPS latitude
            longitude: GPS longitude
            location_description: Detailed location description
            request_description: Detailed issue description
            image_path: Path to uploaded image

        Returns:
            Dictionary ready for Playwright script
        """
        # Base data that all scripts need
        playwright_data = {
            "coordinates": f"{latitude}, {longitude}",
            "locationDescription": location_description,
            "requestDescription": request_description,
            "imagePath": image_path
        }

        # Merge with AI-generated form fields
        playwright_data.update(form_fields)

        print(f"📋 Prepared Playwright data for {category}:")
        print(json.dumps(playwright_data, indent=2))

        return playwright_data

    async def submit_form(
        self,
        category: str,
        form_fields: Dict,
        latitude: float,
        longitude: float,
        location_description: str,
        request_description: str,
        image_path: str,
        timeout: int = 120
    ) -> Dict:
        """
        Submit form to SF.gov using Playwright automation

        Args:
            category: AI category (Road Crack, Sidewalk Crack, Graffiti, Fallen Tree)
            form_fields: Form fields dict from AI
            latitude: GPS latitude
            longitude: GPS longitude
            location_description: Detailed location from AI
            request_description: Detailed description from AI
            image_path: Path to uploaded image
            timeout: Timeout in seconds (default: 120)

        Returns:
            Dict with success status, tracking number, and details
        """
        try:
            # Get appropriate script
            script_path, script_type = self.get_script_for_category(category)
            print(f"\n🎭 Calling Playwright script: {script_path}")

            # Prepare data
            playwright_data = self.prepare_playwright_data(
                category=category,
                form_fields=form_fields,
                latitude=latitude,
                longitude=longitude,
                location_description=location_description,
                request_description=request_description,
                image_path=image_path
            )

            # Convert to JSON string for command line argument
            data_json = json.dumps(playwright_data)

            print(f"🚀 Executing Playwright script...")
            print(f"   Script: {os.path.basename(script_path)}")
            print(f"   Category: {category}")
            print(f"   Timeout: {timeout}s")

            # Call Node.js script with data as command line argument
            result = subprocess.run(
                ['node', script_path, data_json],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(self.scripts_dir)  # Run from scripts directory
            )

            # Check for errors
            if result.returncode != 0:
                error_msg = result.stderr if result.stderr else "Unknown error"
                print(f"❌ Playwright script failed with return code {result.returncode}")
                print(f"   Error: {error_msg}")

                return {
                    "success": False,
                    "error": f"Playwright script failed: {error_msg}",
                    "returncode": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }

            # Success - extract tracking number from output
            print(f"✅ Playwright script completed successfully")
            print(f"📄 Output:\n{result.stdout}")

            tracking_number = self.extract_tracking_number(result.stdout)
            address = self.extract_address(result.stdout)

            return {
                "success": True,
                "tracking_number": tracking_number,
                "address": address,
                "stdout": result.stdout,
                "stderr": result.stderr
            }

        except subprocess.TimeoutExpired:
            print(f"⏱️ Playwright script timed out after {timeout}s")
            return {
                "success": False,
                "error": f"Script execution timed out after {timeout} seconds"
            }

        except FileNotFoundError as e:
            print(f"❌ File not found: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

        except Exception as e:
            print(f"❌ Unexpected error during Playwright execution: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }

    def extract_tracking_number(self, output: str) -> Optional[str]:
        """
        Extract service request tracking number from Playwright output

        Args:
            output: stdout from Playwright script

        Returns:
            Tracking number string or None if not found
        """
        # Common patterns for tracking numbers in the output
        patterns = [
            r'"serviceRequestNumber":\s*"(\d+)"',  # JSON format: "serviceRequestNumber": "101002860550"
            r'serviceRequestNumber["\']?\s*:\s*["\']?(\d+)',  # JS: serviceRequestNumber: "101002860550"
            r'Service Request[:\s#]+(\d+)',  # Text: Service Request: 101002860550
            r'Request[:\s#]+(\d+)',  # Text: Request: 101002860550
            r'Tracking[:\s#]+(\d+)',  # Text: Tracking: 101002860550
            r'Case[:\s#]+(\d+)',  # Text: Case: 101002860550
            r'SR[:\s#]+(\d+)',  # Text: SR: 101002860550
            r'number["\']?\s*:\s*["\']?(\d{10,})',  # Generic number field with 10+ digits
            r'(\d{12})',  # 12-digit number (SF.gov format)
            r'(\d{10,15})',  # 10-15 digit number (broader match)
        ]

        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                tracking_num = match.group(1)
                # Validate it's a reasonable tracking number (at least 8 digits)
                if len(tracking_num) >= 8:
                    print(f"🎯 Extracted tracking number: {tracking_num} (pattern: {pattern})")
                    return tracking_num

        print(f"⚠️ Could not extract tracking number from output")
        print(f"📄 Output preview (first 500 chars):\n{output[:500]}")
        return None

    def extract_address(self, output: str) -> Optional[str]:
        """
        Extract request address from Playwright output

        Args:
            output: stdout from Playwright script

        Returns:
            Address string or None if not found
        """
        # Patterns for address extraction
        patterns = [
            r'"requestAddress":\s*"([^"]+)"',  # JSON format
            r'requestAddress:\s*["\']([^"\']+)["\']',  # JS object format
            r'Address:\s*([^\n]+)',  # Text format
        ]

        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                address = match.group(1).strip()
                print(f"📍 Extracted address: {address}")
                return address

        return None


# Singleton instance
_playwright_integration = None


def get_playwright_integration() -> PlaywrightIntegration:
    """Get or create singleton PlaywrightIntegration instance"""
    global _playwright_integration
    if _playwright_integration is None:
        _playwright_integration = PlaywrightIntegration()
    return _playwright_integration


async def submit_to_sfgov(
    category: str,
    form_fields: Dict,
    latitude: float,
    longitude: float,
    location_description: str,
    request_description: str,
    image_path: str
) -> Dict:
    """
    Convenience function to submit form to SF.gov

    Args:
        category: AI category
        form_fields: Form fields from AI
        latitude: GPS latitude
        longitude: GPS longitude
        location_description: Location description from AI
        request_description: Issue description from AI
        image_path: Path to uploaded image

    Returns:
        Dict with success, tracking_number, etc.
    """
    integration = get_playwright_integration()
    return await integration.submit_form(
        category=category,
        form_fields=form_fields,
        latitude=latitude,
        longitude=longitude,
        location_description=location_description,
        request_description=request_description,
        image_path=image_path
    )
