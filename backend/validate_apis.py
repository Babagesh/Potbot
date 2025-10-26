"""
API Validation & Setup Helper
Tests all API credentials and provides helpful error messages
"""

import os
import sys
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables
load_dotenv()


def validate_groq_api() -> Dict[str, Any]:
    """Validate Groq Vision API credentials"""
    print("\n" + "="*60)
    print("🔍 Testing Groq Vision API (Agent #1)")
    print("="*60)
    
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        return {
            "success": False,
            "error": "GROQ_API_KEY not found in .env",
            "help": [
                "1. Visit https://console.groq.com/keys",
                "2. Sign up for free account",
                "3. Create API key",
                "4. Add to .env: GROQ_API_KEY=gsk_..."
            ]
        }
    
    if not api_key.startswith("gsk_"):
        return {
            "success": False,
            "error": "Invalid Groq API key format (should start with 'gsk_')",
            "help": ["Copy the API key exactly as shown in Groq console"]
        }
    
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        # Simple test: list models
        models = client.models.list()
        
        print("✅ Groq API is working!")
        print(f"   Available models: {len(models.data)}")
        
        # Find vision models
        vision_models = [m for m in models.data if 'vision' in m.id.lower() or 'llama-4' in m.id.lower()]
        if vision_models:
            print(f"   Vision models: {len(vision_models)}")
            for model in vision_models[:3]:
                print(f"      - {model.id}")
        
        return {
            "success": True,
            "models": len(models.data),
            "error": None
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "help": [
                "Check if API key is correct",
                "Verify internet connection",
                "Try regenerating API key in Groq console"
            ]
        }


def validate_twitter_api() -> Dict[str, Any]:
    """Validate Twitter API credentials"""
    print("\n" + "="*60)
    print("🐦 Testing Twitter API (Agent #3)")
    print("="*60)
    
    # Check if all required credentials exist
    required_keys = {
        "TWITTER_BEARER_TOKEN": "Bearer Token (OAuth 2.0)",
        "TWITTER_API_KEY": "API Key (Consumer Key)",
        "TWITTER_API_SECRET": "API Secret (Consumer Secret)",
        "TWITTER_ACCESS_TOKEN": "Access Token",
        "TWITTER_ACCESS_TOKEN_SECRET": "Access Token Secret"
    }
    
    missing = []
    for key, description in required_keys.items():
        if not os.getenv(key):
            missing.append(f"{key} ({description})")
    
    if missing:
        return {
            "success": False,
            "error": f"Missing {len(missing)} credential(s)",
            "missing": missing,
            "help": [
                "Complete Twitter API setup:",
                "1. Go to https://developer.twitter.com/en/portal/dashboard",
                "2. Create app with Read & Write permissions",
                "3. Generate all 5 credentials",
                "4. Add to .env file",
                "",
                "See ENV_SETUP.md for detailed instructions"
            ]
        }
    
    try:
        import tweepy
        
        # Test OAuth 1.0a (for media upload)
        auth = tweepy.OAuth1UserHandler(
            os.getenv("TWITTER_API_KEY"),
            os.getenv("TWITTER_API_SECRET"),
            os.getenv("TWITTER_ACCESS_TOKEN"),
            os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        )
        api_v1 = tweepy.API(auth)
        
        # Test v2 Client (for tweeting)
        client = tweepy.Client(
            bearer_token=os.getenv("TWITTER_BEARER_TOKEN"),
            consumer_key=os.getenv("TWITTER_API_KEY"),
            consumer_secret=os.getenv("TWITTER_API_SECRET"),
            access_token=os.getenv("TWITTER_ACCESS_TOKEN"),
            access_token_secret=os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        )
        
        # Get authenticated user info
        user = client.get_me()
        
        print(f"✅ Twitter API is working!")
        print(f"   Authenticated as: @{user.data.username}")
        print(f"   User ID: {user.data.id}")
        print(f"   Account name: {user.data.name}")
        
        # Check rate limits
        try:
            rate_limit = api_v1.rate_limit_status()
            tweets_remaining = rate_limit['resources']['statuses']['/statuses/update']['remaining']
            print(f"   Rate limit: {tweets_remaining} tweets remaining")
        except:
            pass
        
        return {
            "success": True,
            "username": user.data.username,
            "user_id": user.data.id,
            "error": None
        }
    
    except tweepy.errors.Unauthorized as e:
        return {
            "success": False,
            "error": "Authentication failed (401 Unauthorized)",
            "help": [
                "Common causes:",
                "1. App doesn't have Read & Write permissions",
                "   → Go to app settings → User authentication → Change to 'Read and Write'",
                "   → Regenerate tokens AFTER changing permissions",
                "",
                "2. Credentials are incorrect or expired",
                "   → Regenerate all tokens in Developer Portal",
                "",
                "3. App suspended or keys revoked",
                "   → Check app status in Developer Portal",
                "",
                f"Raw error: {str(e)}"
            ]
        }
    
    except tweepy.errors.Forbidden as e:
        return {
            "success": False,
            "error": "Access forbidden (403)",
            "help": [
                "Your app doesn't have permission to perform this action.",
                "",
                "Solutions:",
                "1. Make sure app has 'Read and Write' permissions",
                "2. Apply for Elevated access for media upload:",
                "   → https://developer.twitter.com/en/portal/products/elevated",
                "",
                f"Raw error: {str(e)}"
            ]
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "help": [
                "Check if all credentials are correct",
                "Verify they match your Twitter app",
                "Try regenerating all tokens"
            ]
        }


def validate_applovin_api() -> Dict[str, Any]:
    """Validate AppLovin Ad Intelligence API credentials"""
    print("\n" + "="*60)
    print("📊 Testing AppLovin Ad Intelligence (Agent #3 Enhancement)")
    print("="*60)
    
    api_key = os.getenv("APPLOVIN_API_KEY")
    base_url = os.getenv("APPLOVIN_API_BASE_URL", "https://api.applovin.com/v1")
    
    if not api_key:
        print("⚠️  AppLovin API key not configured (OPTIONAL)")
        print("   Using mock data based on civic engagement research")
        print("   Mock data includes 100-1000 analyzed posts per area")
        print("")
        print("   To enable real AppLovin analysis:")
        print("   1. Visit https://www.applovin.com/ad-intelligence/")
        print("   2. Sign up and request API access")
        print("   3. Add to .env: APPLOVIN_API_KEY=your_key")
        
        return {
            "success": True,
            "mode": "mock",
            "error": None,
            "help": ["Using realistic mock data (totally fine for CalHacks!)"]
        }
    
    try:
        import requests
        
        # Test API connection
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Try a simple endpoint (adjust based on actual AppLovin API)
        response = requests.get(
            f"{base_url}/health",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ AppLovin API is working!")
            print("   Using real ad intelligence data")
            return {
                "success": True,
                "mode": "real",
                "error": None
            }
        else:
            print(f"⚠️  AppLovin API returned status {response.status_code}")
            print("   Falling back to mock data")
            return {
                "success": True,
                "mode": "mock",
                "error": f"API returned {response.status_code}"
            }
    
    except Exception as e:
        print(f"⚠️  AppLovin API error: {e}")
        print("   Falling back to mock data")
        return {
            "success": True,
            "mode": "mock",
            "error": str(e)
        }


def validate_sf311_api() -> Dict[str, Any]:
    """Validate SF 311 API credentials"""
    print("\n" + "="*60)
    print("🏛️  Testing SF 311 API (Agent #2 Enhancement)")
    print("="*60)
    
    api_key = os.getenv("SF_311_API_KEY")
    
    if not api_key:
        print("⚠️  SF 311 API key not configured (OPTIONAL)")
        print("   Using demo tracking numbers (format: SF311-2025-XXXXXX)")
        print("")
        print("   To enable real SF 311 submissions:")
        print("   1. Visit https://sf311.org/api")
        print("   2. Request API access")
        print("   3. Add to .env: SF_311_API_KEY=your_key")
        
        return {
            "success": True,
            "mode": "demo",
            "error": None
        }
    
    try:
        import requests
        
        # Test SF 311 API
        url = "https://mobile311.sfgov.org/open311/v2/services.json"
        params = {"api_key": api_key}
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            services = response.json()
            print("✅ SF 311 API is working!")
            print(f"   Available services: {len(services)}")
            return {
                "success": True,
                "mode": "real",
                "services": len(services),
                "error": None
            }
        else:
            print(f"⚠️  SF 311 API returned status {response.status_code}")
            print("   Using demo tracking numbers")
            return {
                "success": True,
                "mode": "demo",
                "error": f"API returned {response.status_code}"
            }
    
    except Exception as e:
        print(f"⚠️  SF 311 API error: {e}")
        print("   Using demo tracking numbers")
        return {
            "success": True,
            "mode": "demo",
            "error": str(e)
        }


def main():
    """Run all API validations"""
    print("\n" + "="*60)
    print("🚀 PotBot API Validation & Setup Helper")
    print("="*60)
    print("This script tests all your API credentials")
    print("and provides helpful setup instructions.")
    
    results = {}
    
    # Test each API
    results["groq"] = validate_groq_api()
    results["twitter"] = validate_twitter_api()
    results["applovin"] = validate_applovin_api()
    results["sf311"] = validate_sf311_api()
    
    # Print summary
    print("\n" + "="*60)
    print("📋 SUMMARY")
    print("="*60)
    
    all_required_working = True
    
    # Required APIs
    print("\n✅ Required APIs (needed for core functionality):")
    
    if results["groq"]["success"]:
        print("   ✅ Groq Vision API - Working")
    else:
        print("   ❌ Groq Vision API - NOT WORKING")
        all_required_working = False
    
    if results["twitter"]["success"]:
        print(f"   ✅ Twitter API - Working (@{results['twitter'].get('username', 'unknown')})")
    else:
        print("   ❌ Twitter API - NOT WORKING")
        all_required_working = False
    
    # Optional APIs
    print("\n📊 Optional APIs (enhance functionality):")
    
    print(f"   {'✅' if results['applovin']['mode'] == 'real' else '⚠️ '} AppLovin Ad Intelligence - {results['applovin']['mode'].upper()}")
    print(f"   {'✅' if results['sf311']['mode'] == 'real' else '⚠️ '} SF 311 API - {results['sf311']['mode'].upper()}")
    
    # Final verdict
    print("\n" + "="*60)
    if all_required_working:
        print("🎉 ALL REQUIRED APIS ARE WORKING!")
        print("="*60)
        print("✅ Your PotBot is ready for CalHacks!")
        print("")
        print("Next steps:")
        print("1. Start backend: cd backend && uvicorn main:app --reload")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Test the full pipeline!")
        print("")
        if results["applovin"]["mode"] == "mock" or results["sf311"]["mode"] == "demo":
            print("💡 Optional: Set up AppLovin and SF311 APIs for full features")
        return 0
    else:
        print("❌ SOME REQUIRED APIS ARE NOT WORKING")
        print("="*60)
        print("")
        print("Please fix the issues above before running PotBot.")
        print("")
        print("Detailed help:")
        
        if not results["groq"]["success"]:
            print("\n🔍 Groq API:")
            for help_line in results["groq"]["help"]:
                print(f"   {help_line}")
        
        if not results["twitter"]["success"]:
            print("\n🐦 Twitter API:")
            for help_line in results["twitter"]["help"]:
                print(f"   {help_line}")
        
        print("\n📚 For detailed setup instructions, see: backend/ENV_SETUP.md")
        return 1


if __name__ == "__main__":
    sys.exit(main())

