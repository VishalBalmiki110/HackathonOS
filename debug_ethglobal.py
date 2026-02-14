import json
from bs4 import BeautifulSoup

def parse_ethglobal():
    with open("ethglobal.html", "r") as f:
        html = f.read()

    soup = BeautifulSoup(html, "lxml")
    next_data = soup.find("script", {"id": "__NEXT_DATA__"})
    
    if next_data:
        try:
            data = json.loads(next_data.string)
            print("Keys in top level:", list(data.keys()))
            
            # Usually data is in props -> pageProps -> ...
            props = data.get("props", {})
            page_props = props.get("pageProps", {})
            print("Keys in pageProps:", list(page_props.keys()))
            
            # Look for events in likely places
            if "events" in page_props:
                print(f"Found {len(page_props['events'])} events in pageProps['events']")
                print(json.dumps(page_props['events'][0], indent=2))
            elif "initialApolloState" in page_props:
                 print("Found initialApolloState. Exploring keys...")
                 apollo_state = page_props["initialApolloState"]
                 # Apollo state is usually normalized. We might find objects with "Event" in key.
                 event_keys = [k for k in apollo_state.keys() if "Event" in k]
                 print(f"Found {len(event_keys)} event references in Apollo state")
                 if event_keys:
                     print(json.dumps(apollo_state[event_keys[0]], indent=2))

        except Exception as e:
            print(f"Error parsing JSON: {e}")
    else:
        print("No __NEXT_DATA__ found")

if __name__ == "__main__":
    parse_ethglobal()
