"""
End-to-End Pipeline Testing Script
Tests the complete 3-agent workflow with real or mock data
"""

import asyncio
import sys
import os
import json
from datetime import datetime
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import all agents
from image_agent import analyze_image_with_agent
from form_submission_agent import submit_civic_issue_to_city
from social_media_agent import publish_civic_issue_to_social_media


class PipelineTester:
    """Test the complete 3-agent pipeline"""
    
    def __init__(self):
        self.results = {
            "agent_1": None,
            "agent_2": None,
            "agent_3": None,
            "timing": {},
            "errors": []
        }
    
    async def test_full_pipeline(
        self,
        image_path: str,
        latitude: float,
        longitude: float,
        tracking_id: str = None
    ) -> Dict[str, Any]:
        """
        Run the complete 3-agent pipeline
        
        Args:
            image_path: Path to test image
            latitude: GPS latitude
            longitude: GPS longitude
            tracking_id: Optional tracking ID (generated if not provided)
        
        Returns:
            Complete results from all 3 agents
        """
        
        if not tracking_id:
            import uuid
            tracking_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        
        print("\n" + "="*70)
        print("🧪 POTBOT PIPELINE E2E TEST")
        print("="*70)
        print(f"📸 Image: {image_path}")
        print(f"📍 Location: ({latitude}, {longitude})")
        print(f"🆔 Tracking ID: {tracking_id}")
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70)
        
        try:
            # ================================================================
            # AGENT #1: Image Analysis with Groq Vision
            # ================================================================
            print("\n" + "="*70)
            print("🤖 AGENT #1: Image Analysis (Groq Vision)")
            print("="*70)
            
            start_time = datetime.now()
            
            agent1_result = await analyze_image_with_agent(
                image_path=image_path,
                latitude=latitude,
                longitude=longitude
            )
            
            agent1_duration = (datetime.now() - start_time).total_seconds()
            self.results["timing"]["agent_1"] = agent1_duration
            self.results["agent_1"] = agent1_result
            
            print(f"\n✅ Agent #1 Complete ({agent1_duration:.2f}s)")
            print(f"   Category: {agent1_result['category']}")
            print(f"   Confidence: {agent1_result['confidence']:.2f}")
            print(f"   Description: {agent1_result['Text_Description'][:100]}...")
            
            # Check if image was rejected
            if agent1_result['category'] == "None":
                print("\n⚠️  Image rejected as non-civic infrastructure")
                print("   Pipeline stopped (no form submission or social media post)")
                
                return {
                    "success": False,
                    "reason": "Image rejected by Agent #1",
                    "agent_1": agent1_result,
                    "agent_2": None,
                    "agent_3": None
                }
            
            # ================================================================
            # AGENT #2: Submit to City & Get Tracking Number
            # ================================================================
            print("\n" + "="*70)
            print("📋 AGENT #2: Form Submission to City")
            print("="*70)
            
            start_time = datetime.now()
            
            agent2_result = await submit_civic_issue_to_city(
                category=agent1_result['category'],
                description=agent1_result['Text_Description'],
                latitude=latitude,
                longitude=longitude,
                confidence=agent1_result['confidence'],
                image_path=image_path,
                tracking_id=tracking_id
            )
            
            agent2_duration = (datetime.now() - start_time).total_seconds()
            self.results["timing"]["agent_2"] = agent2_duration
            self.results["agent_2"] = agent2_result
            
            print(f"\n✅ Agent #2 Complete ({agent2_duration:.2f}s)")
            print(f"   Tracking Number: {agent2_result['tracking_number']}")
            print(f"   Address: {agent2_result['address']}")
            print(f"   City: {agent2_result['city']}")
            print(f"   Department: {agent2_result['department']}")
            
            # ================================================================
            # AGENT #3: Post to Social Media with AppLovin Optimization
            # ================================================================
            print("\n" + "="*70)
            print("🐦 AGENT #3: Social Media Publishing (AppLovin + Twitter)")
            print("="*70)
            
            start_time = datetime.now()
            
            agent3_result = await publish_civic_issue_to_social_media(
                # Agent #1 data
                image_path=image_path,
                category=agent1_result['category'],
                description=agent1_result['Text_Description'],
                latitude=latitude,
                longitude=longitude,
                confidence=agent1_result['confidence'],
                tracking_id=tracking_id,
                
                # Agent #2 data
                tracking_number=agent2_result['tracking_number'],
                address=agent2_result['address']
            )
            
            agent3_duration = (datetime.now() - start_time).total_seconds()
            self.results["timing"]["agent_3"] = agent3_duration
            self.results["agent_3"] = agent3_result
            
            print(f"\n✅ Agent #3 Complete ({agent3_duration:.2f}s)")
            print(f"   Post Text Length: {len(agent3_result.get('post_text', ''))}")
            print(f"   Viral Posts Analyzed: {agent3_result.get('optimization_insights', {}).get('viral_posts_analyzed', 0)}")
            
            if agent3_result.get('post_url'):
                print(f"   🔗 Post URL: {agent3_result['post_url']}")
            else:
                print(f"   ⚠️  No post URL (demo mode or Twitter API not configured)")
            
            # ================================================================
            # PIPELINE COMPLETE
            # ================================================================
            total_duration = sum(self.results["timing"].values())
            
            print("\n" + "="*70)
            print("✅ PIPELINE COMPLETE - ALL AGENTS SUCCEEDED")
            print("="*70)
            print(f"⏱️  Total Time: {total_duration:.2f}s")
            print(f"   Agent #1: {agent1_duration:.2f}s")
            print(f"   Agent #2: {agent2_duration:.2f}s")
            print(f"   Agent #3: {agent3_duration:.2f}s")
            print("")
            print(f"📊 Results:")
            print(f"   Issue Type: {agent1_result['category']}")
            print(f"   Confidence: {agent1_result['confidence']:.2f}")
            print(f"   City Tracking: {agent2_result['tracking_number']}")
            print(f"   Address: {agent2_result['address']}")
            print(f"   Viral Insights: {agent3_result.get('optimization_insights', {}).get('viral_posts_analyzed', 0)} posts analyzed")
            
            if agent3_result.get('post_url'):
                print(f"   Social Media: {agent3_result['post_url']}")
            
            print("="*70)
            
            return {
                "success": True,
                "tracking_id": tracking_id,
                "agent_1": agent1_result,
                "agent_2": agent2_result,
                "agent_3": agent3_result,
                "timing": self.results["timing"],
                "total_duration": total_duration
            }
        
        except Exception as e:
            print(f"\n❌ PIPELINE FAILED")
            print(f"   Error: {str(e)}")
            
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "error": str(e),
                "agent_1": self.results.get("agent_1"),
                "agent_2": self.results.get("agent_2"),
                "agent_3": self.results.get("agent_3"),
                "timing": self.results["timing"]
            }
    
    def print_detailed_results(self, results: Dict[str, Any]):
        """Print detailed results in JSON format"""
        print("\n" + "="*70)
        print("📄 DETAILED RESULTS (JSON)")
        print("="*70)
        print(json.dumps(results, indent=2, default=str))
        print("="*70)


async def test_with_sample_image():
    """Test pipeline with a sample image (if available)"""
    
    # Look for test images in common locations
    test_images = [
        "uploads/test_pothole.jpg",
        "test_pothole.jpg",
        "../test_images/pothole.jpg"
    ]
    
    image_path = None
    for path in test_images:
        if os.path.exists(path):
            image_path = path
            break
    
    if not image_path:
        print("\n⚠️  No test image found")
        print("   Looking for images in:")
        for path in test_images:
            print(f"      - {path}")
        print("")
        print("   To test with your own image:")
        print("   python test_pipeline.py path/to/your/image.jpg [lat] [lon]")
        return
    
    # Test with San Francisco location
    latitude = 37.7749
    longitude = -122.4194
    
    tester = PipelineTester()
    results = await tester.test_full_pipeline(
        image_path=image_path,
        latitude=latitude,
        longitude=longitude
    )
    
    tester.print_detailed_results(results)


async def test_with_custom_image(image_path: str, latitude: float, longitude: float):
    """Test pipeline with custom image and location"""
    
    if not os.path.exists(image_path):
        print(f"❌ Error: Image not found at {image_path}")
        return
    
    tester = PipelineTester()
    results = await tester.test_full_pipeline(
        image_path=image_path,
        latitude=latitude,
        longitude=longitude
    )
    
    tester.print_detailed_results(results)


async def run_test_suite():
    """Run comprehensive test suite"""
    
    print("\n" + "="*70)
    print("🧪 POTBOT TEST SUITE")
    print("="*70)
    print("Running comprehensive tests for all agents...")
    
    # Test 1: Individual Agent Tests
    print("\n📋 Test 1: Individual Agent Tests")
    print("-" * 70)
    
    # Test Agent #1
    print("\n1.1. Testing Agent #1 (Image Analysis)...")
    try:
        # This would need a real image
        print("   ⏭️  Skipped (run with test image)")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test Agent #2
    print("\n1.2. Testing Agent #2 (Form Submission)...")
    try:
        from form_submission_agent import FormSubmissionAgent
        agent2 = FormSubmissionAgent()
        
        # Test reverse geocoding
        import requests
        response = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": 37.7749, "lon": -122.4194, "format": "json"},
            headers={"User-Agent": "PotBot-Test/1.0"},
            timeout=10
        )
        
        if response.status_code == 200:
            print("   ✅ Reverse geocoding works")
        else:
            print(f"   ⚠️  Reverse geocoding returned {response.status_code}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test Agent #3
    print("\n1.3. Testing Agent #3 (Social Media)...")
    try:
        from social_media_agent import SocialMediaAgent
        agent3 = SocialMediaAgent()
        
        if agent3.twitter_client:
            print("   ✅ Twitter API initialized")
        else:
            print("   ⚠️  Twitter API not configured")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test 2: AppLovin Analyzer
    print("\n📋 Test 2: AppLovin Analyzer")
    print("-" * 70)
    
    try:
        from applovin_analyzer import analyze_viral_posts_in_area
        
        insights = await analyze_viral_posts_in_area(
            address="Market St, San Francisco, CA",
            latitude=37.7749,
            longitude=-122.4194,
            category="Road Crack",
            radius_miles=5.0
        )
        
        print(f"   ✅ Analyzed {insights['viral_posts_analyzed']} viral posts")
        print(f"   Top hashtags: {', '.join(insights['top_hashtags'][:3])}")
        print(f"   Optimal text length: {insights['optimal_text_length']}")
        print(f"   Emoji usage: {insights['emoji_usage']}")
        print(f"   CTA style: {insights['cta_style']}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test 3: API Credentials
    print("\n📋 Test 3: API Credentials")
    print("-" * 70)
    print("   Run: python validate_apis.py")
    
    print("\n" + "="*70)
    print("Test suite complete!")
    print("="*70)


def main():
    """Main entry point"""
    
    if len(sys.argv) == 1:
        # No arguments - run test suite
        print("Running full test suite...")
        asyncio.run(run_test_suite())
    
    elif len(sys.argv) == 2 and sys.argv[1] == "suite":
        # Run test suite
        asyncio.run(run_test_suite())
    
    elif len(sys.argv) == 2:
        # Test with provided image, default SF location
        image_path = sys.argv[1]
        latitude = 37.7749  # San Francisco
        longitude = -122.4194
        
        print(f"Testing with image: {image_path}")
        print(f"Location: San Francisco ({latitude}, {longitude})")
        asyncio.run(test_with_custom_image(image_path, latitude, longitude))
    
    elif len(sys.argv) == 4:
        # Test with image and custom location
        image_path = sys.argv[1]
        latitude = float(sys.argv[2])
        longitude = float(sys.argv[3])
        
        print(f"Testing with image: {image_path}")
        print(f"Location: ({latitude}, {longitude})")
        asyncio.run(test_with_custom_image(image_path, latitude, longitude))
    
    else:
        print("Usage:")
        print("  python test_pipeline.py                     # Run test suite")
        print("  python test_pipeline.py suite               # Run test suite")
        print("  python test_pipeline.py <image>             # Test with image (SF location)")
        print("  python test_pipeline.py <image> <lat> <lon> # Test with image and location")
        print("")
        print("Examples:")
        print("  python test_pipeline.py pothole.jpg")
        print("  python test_pipeline.py pothole.jpg 37.7749 -122.4194")


if __name__ == "__main__":
    main()

