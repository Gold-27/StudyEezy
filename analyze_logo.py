from PIL import Image
from collections import Counter

try:
    img = Image.open('public/logo.jpeg').convert('RGBA')
    width, height = img.size
    print(f"Size: {width}x{height}")
    
    colors = img.getcolors(width*height)
    # Sort by count
    colors = sorted(colors, key=lambda x: x[0], reverse=True)
    print("Top 5 colors:")
    for count, color in colors[:5]:
        print(f"Count: {count}, Color: {color}")
except Exception as e:
    print(f"Error: {e}")
