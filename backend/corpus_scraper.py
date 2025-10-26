"""
Corpus Scraper for AppLovin Challenge
Scrapes viral posts from specific districts to build analysis corpus
Combines civic posts + general viral content from the area

Uses snscrape (NO API KEY NEEDED!) - Free Twitter scraping
"""

import os
import json
import subprocess
from typing import List, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
import time
import re

load_dotenv()


class ViralCorpusScraper:
    """
    Scrape and build corpus of viral posts for feature extraction
    
    Two types of posts:
    1. Civic posts (potholes, graffiti, infrastructure)
    2. General viral posts from the district (any topic)
    
    Why? To understand what ACTUALLY goes viral in each neighborhood,
    not just what works for civic content specifically.
    
    Uses snscrape - NO API KEY REQUIRED!
    """
    
    def __init__(self):
        """Initialize scraper"""
        self.check_snscrape_installed()
    
    def check_snscrape_installed(self):
        """Check if snscrape is installed"""
        try:
            subprocess.run(['snscrape', '--version'], 
                         capture_output=True, 
                         check=True)
            print("✅ snscrape is installed")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ snscrape not installed. Install with: pip3 install snscrape")
            print("   Falling back to sample data")
    
    async def build_corpus(
        self,
        district: str,
        city: str,
        max_civic_posts: int = 50,
        max_general_posts: int = 50
    ) -> Dict[str, Any]:
        """
        Build complete corpus for district using snscrape (NO API KEY!)
        
        Args:
            district: e.g., "Mission District"
            city: e.g., "San Francisco"
            max_civic_posts: Number of civic posts to scrape
            max_general_posts: Number of general viral posts to scrape
        
        Returns:
            {
                "civic_posts": [...],
                "general_posts": [...],
                "combined_insights": {...}
            }
        """
        print(f"\n🔍 Building viral corpus for {district}, {city}")
        print(f"   Using snscrape (no API key needed!)")
        
        corpus = {
            "district": district,
            "city": city,
            "collected_at": datetime.now().isoformat(),
            "civic_posts": [],
            "general_posts": [],
        }
        
        try:
            # Scrape civic posts
            print(f"\n📊 Scraping {max_civic_posts} civic posts...")
            civic_posts = await self._scrape_civic_posts(district, city, max_civic_posts)
            corpus["civic_posts"] = civic_posts
            print(f"   ✅ Found {len(civic_posts)} civic posts")
            
            # Scrape general viral posts from district
            print(f"\n🔥 Scraping {max_general_posts} general viral posts...")
            general_posts = await self._scrape_general_viral_posts(district, city, max_general_posts)
            corpus["general_posts"] = general_posts
            print(f"   ✅ Found {len(general_posts)} general viral posts")
            
            # Save corpus
            self._save_corpus(corpus)
            
            return corpus
        
        except Exception as e:
            print(f"❌ Error building corpus: {e}")
            print(f"   Falling back to sample data")
            return self._get_sample_corpus(district, city)
    
    async def _scrape_civic_posts(
        self,
        district: str,
        city: str,
        max_posts: int
    ) -> List[Dict[str, Any]]:
        """
        Scrape civic infrastructure posts using snscrape
        
        Search for tweets about:
        - Potholes, road issues
        - Graffiti
        - Broken infrastructure
        - 311 reports
        """
        
        # Civic-related keywords
        civic_keywords = [
            ("pothole", district),
            ("graffiti", district),
            ("311", city),
            ("broken streetlight", district),
            ("sidewalk crack", district)
        ]
        
        posts = []
        
        for keyword, location in civic_keywords:
            if len(posts) >= max_posts:
                break
            
            try:
                # Build snscrape query with location
                # Format: "keyword location since:date lang:en"
                since_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
                query = f'"{keyword}" "{location}" since:{since_date} lang:en'
                
                print(f"   Searching: {keyword} in {location}")
                
                # Run snscrape command
                scraped_tweets = self._run_snscrape(query, max_results=10)
                
                for tweet in scraped_tweets:
                    # Calculate engagement
                    engagement = (
                        tweet.get('likeCount', 0) +
                        tweet.get('retweetCount', 0) * 2 +
                        tweet.get('replyCount', 0)
                    )
                    
                    # Only include tweets with some engagement
                    if engagement < 5:
                        continue
                    
                    # Extract hashtags
                    hashtags = re.findall(r'#(\w+)', tweet.get('content', ''))
                    
                    posts.append({
                        "id": tweet.get('id', f'civic_{len(posts)}'),
                        "text": tweet.get('content', ''),
                        "created_at": tweet.get('date', ''),
                        "engagement": engagement,
                        "likes": tweet.get('likeCount', 0),
                        "retweets": tweet.get('retweetCount', 0),
                        "replies": tweet.get('replyCount', 0),
                        "hashtags": hashtags,
                        "media_url": None,  # snscrape provides this but we'll skip for simplicity
                        "type": "civic"
                    })
            
            except Exception as e:
                print(f"   ⚠️ Error scraping '{keyword}': {e}")
                continue
        
        # Sort by engagement
        posts.sort(key=lambda x: x['engagement'], reverse=True)
        
        return posts[:max_posts]
    
    async def _scrape_general_viral_posts(
        self,
        district: str,
        city: str,
        max_posts: int
    ) -> List[Dict[str, Any]]:
        """
        Scrape GENERAL viral posts from the district using snscrape
        
        This is KEY: We want to know what goes viral in this
        neighborhood in GENERAL, not just civic posts.
        
        Mission District might have different viral patterns than
        Financial District - different humor, different concerns,
        different visual styles.
        """
        
        # Search for viral posts mentioning the district
        since_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        query = f'"{district}" since:{since_date} lang:en min_faves:50'
        
        print(f"   Searching: viral posts in {district}")
        
        posts = []
        
        try:
            # Run snscrape
            scraped_tweets = self._run_snscrape(query, max_results=max_posts)
            
            for tweet in scraped_tweets:
                # Calculate engagement
                engagement = (
                    tweet.get('likeCount', 0) +
                    tweet.get('retweetCount', 0) * 2 +
                    tweet.get('replyCount', 0)
                )
                
                # Only include highly engaged posts
                if engagement < 50:
                    continue
                
                # Extract hashtags
                hashtags = re.findall(r'#(\w+)', tweet.get('content', ''))
                
                posts.append({
                    "id": tweet.get('id', f'general_{len(posts)}'),
                    "text": tweet.get('content', ''),
                    "created_at": tweet.get('date', ''),
                    "engagement": engagement,
                    "likes": tweet.get('likeCount', 0),
                    "retweets": tweet.get('retweetCount', 0),
                    "replies": tweet.get('replyCount', 0),
                    "hashtags": hashtags,
                    "media_url": None,
                    "type": "general"
                })
        
        except Exception as e:
            print(f"   ⚠️ Error scraping general posts: {e}")
        
        # Sort by engagement
        posts.sort(key=lambda x: x['engagement'], reverse=True)
        
        return posts[:max_posts]
    
    def _run_snscrape(self, query: str, max_results: int = 50) -> List[Dict]:
        """
        Run snscrape command and return tweets as JSON
        
        Args:
            query: Search query
            max_results: Maximum tweets to return
        
        Returns:
            List of tweet dictionaries
        """
        try:
            # Build snscrape command
            # Format: snscrape --jsonl --max-results N twitter-search "query"
            cmd = [
                'snscrape',
                '--jsonl',
                '--max-results', str(max_results),
                'twitter-search',
                query
            ]
            
            # Run command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                print(f"     snscrape error: {result.stderr}")
                return []
            
            # Parse JSON lines
            tweets = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        tweet = json.loads(line)
                        tweets.append(tweet)
                    except json.JSONDecodeError:
                        continue
            
            return tweets
        
        except subprocess.TimeoutExpired:
            print(f"     snscrape timeout")
            return []
        except Exception as e:
            print(f"     snscrape error: {e}")
            return []
    
    def _save_corpus(self, corpus: Dict[str, Any]):
        """Save corpus to JSON file for analysis"""
        filename = f"corpus_{corpus['district'].replace(' ', '_')}_{corpus['city'].replace(' ', '_')}.json"
        filepath = os.path.join("corpus_data", filename)
        
        os.makedirs("corpus_data", exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(corpus, f, indent=2)  # Fixed: dump not dumps!
        
        print(f"\n💾 Corpus saved to {filepath}")
    
    def _get_sample_corpus(self, district: str, city: str) -> Dict[str, Any]:
        """
        Generate sample corpus data for demo
        (Used when Twitter API not available)
        """
        return {
            "district": district,
            "city": city,
            "collected_at": datetime.now().isoformat(),
            "civic_posts": self._generate_sample_civic_posts(district),
            "general_posts": self._generate_sample_general_posts(district)
        }
    
    def _generate_sample_civic_posts(self, district: str) -> List[Dict[str, Any]]:
        """Generate realistic sample civic posts"""
        import random
        
        templates = [
            "Huge pothole on {street}! Been here for weeks. @{city}311 #Fix{city}",
            "Graffiti covering entire wall on {street}. Can we get this cleaned? #CivicAction",
            "Broken streetlight at {street} - super dark at night, safety issue! #{district}",
            "Sidewalk completely cracked on {street}. Accessibility issue! #Fix{city}",
        ]
        
        streets = ["Market St", "Mission St", "Valencia St", "16th St", "24th St"]
        
        posts = []
        for i in range(50):
            engagement = random.randint(50, 500)
            posts.append({
                "id": f"sample_civic_{i}",
                "text": random.choice(templates).format(
                    street=random.choice(streets),
                    city=district.split()[0] if district else "SF",
                    district=district.replace(" ", "")
                ),
                "engagement": engagement,
                "likes": int(engagement * 0.6),
                "retweets": int(engagement * 0.3),
                "replies": int(engagement * 0.1),
                "hashtags": ["FixSF", "SF311", "CivicAction"],
                "type": "civic"
            })
        
        return posts
    
    def _generate_sample_general_posts(self, district: str) -> List[Dict[str, Any]]:
        """Generate realistic sample general viral posts from district"""
        import random
        
        # General content that goes viral in neighborhoods
        templates = [
            "Best tacos in {district}! 🌮 Line was worth it",
            "Sunset view from {district} tonight 🌅",
            "New mural on {street} is incredible! Local artists crushing it 🎨",
            "Street fair in {district} this weekend! See you there",
            "Support local: this {district} coffee shop is amazing ☕",
        ]
        
        streets = ["Mission St", "Valencia St", "16th St"]
        
        posts = []
        for i in range(50):
            engagement = random.randint(100, 1000)  # General posts get more engagement
            posts.append({
                "id": f"sample_general_{i}",
                "text": random.choice(templates).format(
                    district=district,
                    street=random.choice(streets)
                ),
                "engagement": engagement,
                "likes": int(engagement * 0.7),
                "retweets": int(engagement * 0.2),
                "replies": int(engagement * 0.1),
                "hashtags": [district.replace(" ", ""), "SF", "Local"],
                "type": "general"
            })
        
        return posts


# ============================================================================
# Helper Functions
# ============================================================================

async def scrape_and_save_corpus(district: str, city: str):
    """
    Main function to scrape and save corpus
    
    Usage:
        await scrape_and_save_corpus("Mission District", "San Francisco")
    """
    scraper = ViralCorpusScraper()
    corpus = await scraper.build_corpus(district, city)
    
    print(f"\n✅ Corpus complete!")
    print(f"   Civic posts: {len(corpus['civic_posts'])}")
    print(f"   General posts: {len(corpus['general_posts'])}")
    print(f"   Total: {len(corpus['civic_posts']) + len(corpus['general_posts'])}")
    
    return corpus


def load_corpus(district: str, city: str) -> Dict[str, Any]:
    """
    Load pre-scraped corpus from file
    
    Usage:
        corpus = load_corpus("Mission District", "San Francisco")
    """
    filename = f"corpus_{district.replace(' ', '_')}_{city.replace(' ', '_')}.json"
    filepath = os.path.join("corpus_data", filename)
    
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    else:
        print(f"⚠️ No corpus found for {district}, {city}")
        return None


# ============================================================================
# Testing
# ============================================================================

async def test_scraper():
    """Test the corpus scraper"""
    print("🧪 Testing Corpus Scraper")
    
    # Test with Mission District
    corpus = await scrape_and_save_corpus("Mission District", "San Francisco")
    
    # Show sample posts
    print("\n📊 Sample Civic Posts:")
    for post in corpus['civic_posts'][:3]:
        print(f"   {post['text'][:80]}...")
        print(f"   Engagement: {post['engagement']} (👍{post['likes']} 🔁{post['retweets']})")
    
    print("\n🔥 Sample General Viral Posts:")
    for post in corpus['general_posts'][:3]:
        print(f"   {post['text'][:80]}...")
        print(f"   Engagement: {post['engagement']} (👍{post['likes']} 🔁{post['retweets']})")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_scraper())

