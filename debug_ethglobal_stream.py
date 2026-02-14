import re

def parse_stream():
    with open("ethglobal.html", "r") as f:
        html = f.read()

    # Split by script tag boundaries or just scan line by line if they are separate lines
    # Usually Next.js inlines scripts, so one long line might be possible or many script tags.
    # But self.__next_f.push calls are typically inside <script>...</script>
    
    # Let's just regex for the push call content directly across the whole file
    # Pattern: self.__next_f.push([1,"..."])
    # We want the string content inside the array.
    
    # We'll use a simple regex to find the start of push calls
    starts = [m.start() for m in re.finditer(r'self\.__next_f\.push', html)]
    print(f"Found {len(starts)} push calls")
    
    for start in starts:
        # Extract a chunk around it
        chunk = html[start:start+10000] # large chunk to capture the whole array if possible
        
        # Look for "events" inside this chunk
        if "events" in chunk:
            print(f"Found 'events' in push call at index {start}")
            # Try to extract the JSON string part: [1, "STRING"]
            # The string starts after `[1, "` or `[0, "` etc.
            
            # Find the opening quote of the string
            quote_start = chunk.find('"')
            if quote_start != -1:
                # The string continues until the next unescaped quote? No, it's a JS string literal.
                # It accepts escaped quotes \".
                # This is hard to parse with regex perfectly without a proper parser.
                # But we can look for `\"events\":[` inside the chunk
                
                events_idx = chunk.find('events\\":')
                if events_idx == -1:
                     events_idx = chunk.find('events":')
                
                if events_idx != -1:
                    print("Found events key at relative index", events_idx)
                    snippet = chunk[events_idx:events_idx+200]
                    print("Snippet:", snippet)
                    
                    # If we see `events":[`, we can try to find the closing `]`.
                    # But since it's inside a string literal, we need to unescape first ideally.
                    pass

if __name__ == "__main__":
    parse_stream()
