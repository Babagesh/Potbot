#!/usr/bin/env python3
"""
Quick script to create a test image simulating a pothole
"""
from PIL import Image, ImageDraw, ImageFont
import random

# Create a 800x600 image simulating a road with damage
width, height = 800, 600
img = Image.new('RGB', (width, height), color='#3d3d3d')
draw = ImageDraw.Draw(img)

# Draw road texture (darker asphalt)
for _ in range(10000):
    x = random.randint(0, width)
    y = random.randint(0, height)
    gray = random.randint(40, 70)
    draw.point((x, y), fill=(gray, gray, gray))

# Draw a big pothole in the center
pothole_x, pothole_y = width // 2, height // 2
pothole_width, pothole_height = 200, 150

# Draw irregular pothole shape
draw.ellipse(
    [pothole_x - pothole_width // 2, pothole_y - pothole_height // 2,
     pothole_x + pothole_width // 2, pothole_y + pothole_height // 2],
    fill='#1a1a1a',
    outline='#8B4513',
    width=5
)

# Add some cracks
for _ in range(5):
    start_x = random.randint(pothole_x - 200, pothole_x + 200)
    start_y = random.randint(pothole_y - 150, pothole_y + 150)
    end_x = start_x + random.randint(-100, 100)
    end_y = start_y + random.randint(-100, 100)
    draw.line([(start_x, start_y), (end_x, end_y)], fill='#2d2d2d', width=3)

# Draw road markings (faded yellow line)
draw.rectangle([width // 2 - 5, 0, width // 2 + 5, 100], fill='#cccc66')
draw.rectangle([width // 2 - 5, height - 100, width // 2 + 5, height], fill='#cccc66')

# Save
img.save('test-road-pothole.jpg', 'JPEG', quality=85)
print("✅ Created test-road-pothole.jpg")
print("\nTest with:")
print("curl -X POST http://localhost:8000/api/submit-civic-issue \\")
print('  -F "image=@test-road-pothole.jpg" \\')
print('  -F "latitude=37.755196" \\')
print('  -F "longitude=-122.423207"')
