"""
Feature Extraction for AppLovin Challenge
Extracts high-value features from viral post images in corpus
"""

import os
import json
import requests
from PIL import Image
import numpy as np
from typing import Dict, Any, List
from io import BytesIO
from collections import Counter
import colorsys


class AppLovinFeatureExtractor:
    """
    Extract features from viral posts for AppLovin Challenge
    
    Extracts both:
    1. Visual features from images
    2. Text/engagement features from posts
    
    Goal: Find what makes content go viral in specific districts
    """
    
    def __init__(self):
        """Initialize feature extractor"""
        pass
    
    def extract_features_from_corpus(
        self,
        corpus: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract features from entire corpus
        
        Args:
            corpus: Output from corpus_scraper.py
        
        Returns:
            Feature analysis with patterns and insights
        """
        print(f"\n🔬 Extracting features from {corpus['district']} corpus")
        
        civic_features = self._analyze_posts(corpus['civic_posts'], "civic")
        general_features = self._analyze_posts(corpus['general_posts'], "general")
        
        # Combine insights
        combined_insights = self._combine_insights(
            civic_features,
            general_features,
            corpus['district']
        )
        
        return combined_insights
    
    def _analyze_posts(
        self,
        posts: List[Dict[str, Any]],
        post_type: str
    ) -> Dict[str, Any]:
        """
        Analyze a list of posts and extract patterns
        
        Args:
            posts: List of posts (civic or general)
            post_type: "civic" or "general"
        
        Returns:
            Feature analysis for this type
        """
        print(f"\n  📊 Analyzing {len(posts)} {post_type} posts...")
        
        # Text features
        text_features = self._extract_text_features(posts)
        
        # Engagement patterns
        engagement_patterns = self._analyze_engagement(posts)
        
        # Visual features (if images available)
        visual_features = self._extract_visual_features(posts)
        
        return {
            "post_type": post_type,
            "total_posts": len(posts),
            "text_features": text_features,
            "engagement_patterns": engagement_patterns,
            "visual_features": visual_features
        }
    
    def _extract_text_features(
        self,
        posts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extract text-based features from posts
        
        Novel AppLovin features:
        - Optimal text length
        - Hashtag effectiveness
        - Emoji usage patterns
        - Sentiment/tone
        - Call-to-action presence
        """
        
        if not posts:
            return {}
        
        # Text length analysis
        text_lengths = [len(post['text']) for post in posts]
        avg_length = sum(text_lengths) / len(text_lengths)
        
        # Correlate length with engagement
        length_engagement = []
        for post in posts:
            length_engagement.append((len(post['text']), post['engagement']))
        
        # Find optimal length (where engagement peaks)
        length_engagement.sort(key=lambda x: x[1], reverse=True)
        top_10_lengths = [le[0] for le in length_engagement[:10]]
        optimal_length = int(sum(top_10_lengths) / len(top_10_lengths))
        
        # Hashtag analysis
        all_hashtags = []
        for post in posts:
            all_hashtags.extend(post.get('hashtags', []))
        
        hashtag_freq = Counter(all_hashtags)
        top_hashtags = [tag for tag, _ in hashtag_freq.most_common(10)]
        
        # Emoji analysis
        emoji_count = 0
        total_posts_with_emoji = 0
        for post in posts:
            text = post['text']
            # Simple emoji detection (unicode ranges)
            post_emojis = sum(1 for char in text if ord(char) > 127000)
            if post_emojis > 0:
                total_posts_with_emoji += 1
                emoji_count += post_emojis
        
        avg_emojis = emoji_count / len(posts) if posts else 0
        emoji_usage = "high" if avg_emojis > 3 else "moderate" if avg_emojis > 1 else "low"
        
        # CTA detection
        cta_keywords = ['help', 'share', 'retweet', 'rt', 'check out', 'support', 'vote']
        posts_with_cta = sum(
            1 for post in posts
            if any(kw in post['text'].lower() for kw in cta_keywords)
        )
        cta_ratio = posts_with_cta / len(posts)
        
        return {
            "avg_text_length": int(avg_length),
            "optimal_text_length": optimal_length,
            "top_hashtags": top_hashtags,
            "avg_hashtags_per_post": len(all_hashtags) / len(posts),
            "emoji_usage": emoji_usage,
            "avg_emojis_per_post": round(avg_emojis, 2),
            "cta_ratio": round(cta_ratio, 2),
            "posts_analyzed": len(posts)
        }
    
    def _analyze_engagement(
        self,
        posts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze engagement patterns
        
        Novel features:
        - Engagement distribution
        - Virality threshold
        - Retweet vs like ratio
        - Reply engagement
        """
        
        if not posts:
            return {}
        
        engagements = [post['engagement'] for post in posts]
        likes = [post.get('likes', 0) for post in posts]
        retweets = [post.get('retweets', 0) for post in posts]
        replies = [post.get('replies', 0) for post in posts]
        
        # Calculate metrics
        avg_engagement = sum(engagements) / len(engagements)
        max_engagement = max(engagements)
        min_engagement = min(engagements)
        
        # Virality threshold (75th percentile)
        sorted_eng = sorted(engagements)
        virality_threshold = sorted_eng[int(len(sorted_eng) * 0.75)]
        
        # Engagement ratios
        total_likes = sum(likes)
        total_retweets = sum(retweets)
        total_replies = sum(replies)
        
        return {
            "avg_engagement": int(avg_engagement),
            "max_engagement": max_engagement,
            "min_engagement": min_engagement,
            "virality_threshold": virality_threshold,
            "like_ratio": round(total_likes / sum(engagements), 2) if sum(engagements) > 0 else 0,
            "retweet_ratio": round(total_retweets / sum(engagements), 2) if sum(engagements) > 0 else 0,
            "reply_ratio": round(total_replies / sum(engagements), 2) if sum(engagements) > 0 else 0
        }
    
    def _extract_visual_features(
        self,
        posts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extract visual features from images in posts
        
        Novel AppLovin visual features:
        - Dominant color palettes
        - Image brightness/contrast
        - Composition (close-up vs wide)
        - Warning color presence
        - Image quality
        
        NOTE: This requires downloading images, so we'll analyze
        a sample of posts to avoid rate limits
        """
        
        posts_with_media = [p for p in posts if p.get('media_url')]
        
        if not posts_with_media:
            return {"note": "No images available for analysis"}
        
        # Analyze sample (to avoid too many downloads)
        sample_size = min(20, len(posts_with_media))
        sample_posts = posts_with_media[:sample_size]
        
        print(f"     Analyzing images from {sample_size} posts...")
        
        color_analysis = []
        brightness_analysis = []
        has_warning_colors = 0
        high_quality_count = 0
        
        for post in sample_posts:
            try:
                # Download image
                img = self._download_image(post['media_url'])
                if img is None:
                    continue
                
                # Extract features
                features = self._analyze_single_image(img)
                
                color_analysis.append(features['dominant_colors'])
                brightness_analysis.append(features['brightness'])
                
                if features['has_warning_colors']:
                    has_warning_colors += 1
                
                if features['is_high_quality']:
                    high_quality_count += 1
            
            except Exception as e:
                print(f"     ⚠️ Error analyzing image: {e}")
                continue
        
        # Aggregate visual features
        avg_brightness = sum(brightness_analysis) / len(brightness_analysis) if brightness_analysis else 0
        warning_color_ratio = has_warning_colors / sample_size if sample_size > 0 else 0
        quality_ratio = high_quality_count / sample_size if sample_size > 0 else 0
        
        return {
            "images_analyzed": len(brightness_analysis),
            "avg_brightness": round(avg_brightness, 2),
            "warning_color_prevalence": round(warning_color_ratio, 2),
            "high_quality_ratio": round(quality_ratio, 2),
            "note": "Sample analysis to respect rate limits"
        }
    
    def _download_image(self, url: str) -> Image.Image:
        """Download image from URL"""
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                return Image.open(BytesIO(response.content))
        except:
            pass
        return None
    
    def _analyze_single_image(self, img: Image.Image) -> Dict[str, Any]:
        """
        Analyze single image for features
        
        This is the core AppLovin challenge - extracting
        high-value features from visual content
        """
        
        # Convert to RGB
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize for faster processing
        img.thumbnail((400, 400))
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Feature 1: Dominant colors
        dominant_colors = self._get_dominant_colors(img_array)
        
        # Feature 2: Brightness
        brightness = np.mean(img_array) / 255.0
        
        # Feature 3: Warning colors (red/yellow/orange)
        has_warning_colors = self._detect_warning_colors(img_array)
        
        # Feature 4: Image quality (resolution)
        is_high_quality = img.width > 800 and img.height > 800
        
        return {
            "dominant_colors": dominant_colors,
            "brightness": brightness,
            "has_warning_colors": has_warning_colors,
            "is_high_quality": is_high_quality
        }
    
    def _get_dominant_colors(self, img_array: np.ndarray, n_colors: int = 3) -> List[str]:
        """Extract dominant colors from image"""
        # Reshape to list of pixels
        pixels = img_array.reshape(-1, 3)
        
        # Sample pixels for speed
        if len(pixels) > 1000:
            indices = np.random.choice(len(pixels), 1000, replace=False)
            pixels = pixels[indices]
        
        # Simple clustering by rounding
        rounded = (pixels // 50) * 50
        unique, counts = np.unique(rounded, axis=0, return_counts=True)
        
        # Get top colors
        top_indices = np.argsort(counts)[-n_colors:]
        top_colors = unique[top_indices]
        
        # Convert to hex
        hex_colors = []
        for color in top_colors:
            hex_color = '#{:02x}{:02x}{:02x}'.format(int(color[0]), int(color[1]), int(color[2]))
            hex_colors.append(hex_color)
        
        return hex_colors
    
    def _detect_warning_colors(self, img_array: np.ndarray) -> bool:
        """Detect presence of warning colors (red, yellow, orange)"""
        # Convert to HSV for better color detection
        hsv = self._rgb_to_hsv_array(img_array)
        
        # Red: hue 0-10 and 350-360
        # Yellow: hue 50-70
        # Orange: hue 10-50
        
        hue = hsv[:, :, 0]
        saturation = hsv[:, :, 1]
        
        # Check for saturated warm colors
        warning_mask = (
            (((hue < 0.05) | (hue > 0.95)) & (saturation > 0.3)) |  # Red
            ((hue > 0.03) & (hue < 0.2) & (saturation > 0.3))  # Orange/Yellow
        )
        
        warning_ratio = np.sum(warning_mask) / warning_mask.size
        
        return warning_ratio > 0.1  # More than 10% warning colors
    
    def _rgb_to_hsv_array(self, rgb_array: np.ndarray) -> np.ndarray:
        """Convert RGB array to HSV"""
        rgb_normalized = rgb_array / 255.0
        hsv_array = np.zeros_like(rgb_normalized)
        
        for i in range(rgb_array.shape[0]):
            for j in range(rgb_array.shape[1]):
                r, g, b = rgb_normalized[i, j]
                h, s, v = colorsys.rgb_to_hsv(r, g, b)
                hsv_array[i, j] = [h, s, v]
        
        return hsv_array
    
    def _combine_insights(
        self,
        civic_features: Dict[str, Any],
        general_features: Dict[str, Any],
        district: str
    ) -> Dict[str, Any]:
        """
        Combine civic and general features to create final insights
        
        KEY INNOVATION: Use general viral patterns to inform civic posts
        """
        
        # Use general hashtags that work in the district
        general_hashtags = general_features['text_features'].get('top_hashtags', [])
        civic_hashtags = civic_features['text_features'].get('top_hashtags', [])
        
        # Combine - use civic-specific + popular general tags
        combined_hashtags = list(set(civic_hashtags[:3] + general_hashtags[:2]))
        
        # Use general emoji patterns (what works in this district)
        emoji_usage = general_features['text_features'].get('emoji_usage', 'moderate')
        
        # Blend text lengths
        general_length = general_features['text_features'].get('optimal_text_length', 150)
        civic_length = civic_features['text_features'].get('optimal_text_length', 150)
        optimal_length = int((general_length + civic_length) / 2)
        
        # Visual features from civic posts (more relevant)
        visual = civic_features.get('visual_features', {})
        
        return {
            "district": district,
            "posts_analyzed": {
                "civic": civic_features['total_posts'],
                "general": general_features['total_posts'],
                "total": civic_features['total_posts'] + general_features['total_posts']
            },
            "optimization_insights": {
                "optimal_text_length": optimal_length,
                "top_hashtags": combined_hashtags,
                "emoji_usage": emoji_usage,
                "cta_style": "direct" if civic_features['text_features'].get('cta_ratio', 0) > 0.5 else "community",
                "visual_features": visual
            },
            "engagement_benchmarks": {
                "civic_avg": civic_features['engagement_patterns'].get('avg_engagement', 0),
                "general_avg": general_features['engagement_patterns'].get('avg_engagement', 0),
                "virality_threshold": civic_features['engagement_patterns'].get('virality_threshold', 500)
            },
            "raw_features": {
                "civic": civic_features,
                "general": general_features
            }
        }


# ============================================================================
# Main Functions
# ============================================================================

def analyze_corpus(corpus: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to analyze a scraped corpus
    
    Usage:
        corpus = load_corpus("Mission District", "San Francisco")
        insights = analyze_corpus(corpus)
    """
    extractor = AppLovinFeatureExtractor()
    return extractor.extract_features_from_corpus(corpus)


# ============================================================================
# Testing
# ============================================================================

def test_feature_extraction():
    """Test feature extraction"""
    from corpus_scraper import load_corpus
    
    print("🧪 Testing Feature Extraction")
    
    # Load corpus
    corpus = load_corpus("Mission District", "San Francisco")
    
    if not corpus:
        print("⚠️ No corpus found. Run corpus_scraper.py first")
        return
    
    # Extract features
    insights = analyze_corpus(corpus)
    
    # Display results
    print("\n" + "="*60)
    print("📊 FEATURE EXTRACTION RESULTS")
    print("="*60)
    print(json.dumps(insights, indent=2))
    print("="*60)


if __name__ == "__main__":
    test_feature_extraction()

