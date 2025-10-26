"""
Agent #3 - Social Media Publishing Agent
Optimizes and publishes civic issue reports to social media using AppLovin insights
"""

import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
import tweepy
from dotenv import load_dotenv
from applovin_analyzer import analyze_viral_posts_in_area

load_dotenv()


class SocialMediaAgent:
    """
    Agent #3: Creates and publishes optimized social media posts
    
    Workflow:
    1. Receive data from Agent #1 (vision analysis) and Agent #2 (form submission)
    2. Use AppLovin to analyze viral civic posts in the same neighborhood
    3. Apply viral traits to optimize post
    4. Publish to Twitter/X
    5. Return post URL
    """
    
    def __init__(self):
        """Initialize Twitter API client"""
        self.twitter_client = self._init_twitter_client()
    
    def _init_twitter_client(self) -> Optional[tweepy.Client]:
        """Initialize Twitter API v2 client"""
        try:
            # Twitter API v2 credentials
            bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
            api_key = os.getenv("TWITTER_API_KEY")
            api_secret = os.getenv("TWITTER_API_SECRET")
            access_token = os.getenv("TWITTER_ACCESS_TOKEN")
            access_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
            
            if not all([bearer_token, api_key, api_secret, access_token, access_secret]):
                print("⚠️ Warning: Twitter API credentials not found in environment")
                return None
            
            # Create client with OAuth 1.0a User Context
            client = tweepy.Client(
                bearer_token=bearer_token,
                consumer_key=api_key,
                consumer_secret=api_secret,
                access_token=access_token,
                access_token_secret=access_secret
            )
            
            print("✅ Twitter API client initialized")
            return client
            
        except Exception as e:
            print(f"❌ Failed to initialize Twitter client: {e}")
            return None
    
    async def create_and_publish_post(
        self,
        # Data from Agent #1 (Vision AI)
        image_path: str,
        category: str,
        description: str,
        latitude: float,
        longitude: float,
        confidence: float,
        tracking_id: str,
        
        # Data from Agent #2 (Form Submission)
        tracking_number: str,
        address: str,
        
        # Optional metadata
        created_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Main entry point: Create and publish optimized social media post
        
        Returns:
            {
                "success": bool,
                "post_url": str,
                "post_text": str,
                "optimization_insights": dict,
                "error": str (if failed)
            }
        """
        try:
            print(f"\n🐦 Starting Agent #3: Social Media Publishing")
            print(f"📍 Location: {address}")
            print(f"🎯 Issue: {category}")
            
            # Step 1: Analyze viral posts in the area using AppLovin
            print(f"\n📊 Analyzing viral civic posts near {address}...")
            viral_insights = await analyze_viral_posts_in_area(
                address=address,
                latitude=latitude,
                longitude=longitude,
                category=category
            )
            
            # Step 2: Generate base post content
            print(f"\n✍️ Generating optimized post content...")
            post_text = self._generate_optimized_post(
                category=category,
                description=description,
                address=address,
                tracking_number=tracking_number,
                viral_insights=viral_insights
            )
            
            # Step 3: Publish to Twitter
            print(f"\n📤 Publishing to Twitter/X...")
            post_result = await self._publish_to_twitter(
                text=post_text,
                image_path=image_path,
                tracking_id=tracking_id
            )
            
            if post_result["success"]:
                print(f"✅ Post published successfully!")
                print(f"🔗 URL: {post_result['post_url']}")
            else:
                print(f"❌ Failed to publish: {post_result.get('error', 'Unknown error')}")
            
            # Return complete result
            return {
                "success": post_result["success"],
                "post_url": post_result.get("post_url"),
                "post_text": post_text,
                "optimization_insights": viral_insights,
                "error": post_result.get("error")
            }
            
        except Exception as e:
            print(f"❌ Agent #3 failed: {str(e)}")
            return {
                "success": False,
                "post_url": None,
                "post_text": None,
                "optimization_insights": None,
                "error": str(e)
            }
    
    def _generate_optimized_post(
        self,
        category: str,
        description: str,
        address: str,
        tracking_number: str,
        viral_insights: Dict[str, Any]
    ) -> str:
        """
        Generate optimized post text based on AppLovin viral insights
        
        Args:
            category: Issue type (e.g., "Road Crack")
            description: AI-generated description
            address: Street address
            tracking_number: City tracking number
            viral_insights: Insights from AppLovin analysis
        
        Returns:
            Optimized post text
        """
        # Extract optimization insights
        optimal_length = viral_insights.get("optimal_text_length", 150)
        top_hashtags = viral_insights.get("top_hashtags", ["FixOurStreets", "CivicAction"])
        emoji_style = viral_insights.get("emoji_usage", "moderate")
        cta_style = viral_insights.get("cta_style", "direct")
        
        # Map category to emoji (based on viral insights)
        category_emojis = {
            "Road Crack": "🚗🕳️",
            "Sidewalk Crack": "🚶‍♂️⚠️",
            "Graffiti": "🎨🚫",
            "Overflowing Trash": "🗑️♻️",
            "Faded Street Markings": "🚦⚠️",
            "Broken Street Light": "💡🔧",
            "Fallen Tree": "🌳⚠️"
        }
        
        emoji = category_emojis.get(category, "🚨")
        
        # Build post components
        if emoji_style == "high":
            header = f"{emoji} {category.upper()} REPORTED {emoji}"
        elif emoji_style == "low":
            header = f"{category} reported at"
        else:  # moderate
            header = f"{emoji} {category} reported"
        
        # Location line
        location_line = f"📍 {address}"
        
        # Tracking info
        tracking_line = f"🔢 Track repairs: {tracking_number}"
        
        # Call to action (based on viral insights)
        if cta_style == "urgent":
            cta = "Help us fix this! RT to get city attention 🚀"
        elif cta_style == "community":
            cta = "Join us in making our streets safer 💪"
        else:  # direct
            cta = "Follow for updates"
        
        # Hashtags (use top performing ones from area)
        hashtags = " ".join([f"#{tag}" for tag in top_hashtags[:3]])
        
        # Assemble post (respect optimal length)
        post_parts = [header, location_line, tracking_line, cta, hashtags]
        post_text = "\n".join(post_parts)
        
        # Trim if too long (Twitter limit is 280 chars)
        if len(post_text) > 280:
            # Remove CTA if needed
            post_parts = [header, location_line, tracking_line, hashtags]
            post_text = "\n".join(post_parts)
        
        if len(post_text) > 280:
            # Shorten address
            short_address = address.split(",")[0]  # Just street, no city/state
            location_line = f"📍 {short_address}"
            post_parts = [header, location_line, tracking_line, hashtags]
            post_text = "\n".join(post_parts)
        
        return post_text[:280]  # Hard limit
    
    async def _publish_to_twitter(
        self,
        text: str,
        image_path: str,
        tracking_id: str
    ) -> Dict[str, Any]:
        """
        Publish post to Twitter/X with image
        
        Args:
            text: Post text
            image_path: Path to image file
            tracking_id: Unique tracking ID
        
        Returns:
            {
                "success": bool,
                "post_url": str,
                "post_id": str,
                "error": str (if failed)
            }
        """
        try:
            if not self.twitter_client:
                return {
                    "success": False,
                    "error": "Twitter API client not initialized"
                }
            
            # Upload media first (Twitter API v1.1 for media upload)
            # Need to use API v1.1 for media, then v2 for tweet
            api_key = os.getenv("TWITTER_API_KEY")
            api_secret = os.getenv("TWITTER_API_SECRET")
            access_token = os.getenv("TWITTER_ACCESS_TOKEN")
            access_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
            
            # Create v1.1 API for media upload
            auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_secret)
            api_v1 = tweepy.API(auth)
            
            # Upload image
            print(f"  📤 Uploading image: {image_path}")
            media = api_v1.media_upload(filename=image_path)
            media_id = media.media_id
            
            print(f"  ✅ Image uploaded (media_id: {media_id})")
            
            # Create tweet with image using v2 API
            print(f"  📝 Creating tweet...")
            response = self.twitter_client.create_tweet(
                text=text,
                media_ids=[media_id]
            )
            
            # Extract tweet ID and construct URL
            tweet_id = response.data['id']
            
            # Get authenticated user's username
            user = self.twitter_client.get_me()
            username = user.data.username
            
            post_url = f"https://twitter.com/{username}/status/{tweet_id}"
            
            print(f"  ✅ Tweet created: {tweet_id}")
            
            return {
                "success": True,
                "post_url": post_url,
                "post_id": tweet_id,
                "error": None
            }
            
        except Exception as e:
            print(f"  ❌ Twitter publish failed: {str(e)}")
            return {
                "success": False,
                "post_url": None,
                "post_id": None,
                "error": str(e)
            }


# ============================================================================
# Main entry point for Agent #3
# ============================================================================

async def publish_civic_issue_to_social_media(
    # Agent #1 data
    image_path: str,
    category: str,
    description: str,
    latitude: float,
    longitude: float,
    confidence: float,
    tracking_id: str,
    
    # Agent #2 data
    tracking_number: str,
    address: str
) -> Dict[str, Any]:
    """
    Main function to publish civic issue to social media with AppLovin optimization
    
    This is called from main.py after Agent #1 and Agent #2 complete.
    
    Returns:
        {
            "success": bool,
            "post_url": str,
            "post_text": str,
            "optimization_insights": dict
        }
    """
    agent = SocialMediaAgent()
    return await agent.create_and_publish_post(
        image_path=image_path,
        category=category,
        description=description,
        latitude=latitude,
        longitude=longitude,
        confidence=confidence,
        tracking_id=tracking_id,
        tracking_number=tracking_number,
        address=address
    )


# ============================================================================
# Testing
# ============================================================================

async def test_social_media_agent():
    """Test Agent #3 with mock data"""
    print("🧪 Testing Social Media Agent (Agent #3)")
    
    # Mock data from Agent #1 and Agent #2
    result = await publish_civic_issue_to_social_media(
        # Agent #1 data
        image_path="uploads/test_pothole.jpg",
        category="Road Crack",
        description="Large pothole in road surface causing vehicle damage",
        latitude=37.7749,
        longitude=-122.4194,
        confidence=0.92,
        tracking_id="REPORT-A3B5C7D9",
        
        # Agent #2 data
        tracking_number="SF311-2025-123456",
        address="123 Market St, San Francisco, CA 94103"
    )
    
    print("\n" + "="*60)
    print("Test Results:")
    print(json.dumps(result, indent=2))
    print("="*60)


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_social_media_agent())

