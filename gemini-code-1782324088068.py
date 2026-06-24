import requests
import json

def fetch_scholar_citations(author_id, api_key):
    # SerpApi universal HTTP endpoint
    url = "https://serpapi.com/search"
    
    params = {
        "engine": "google_scholar_author",
        "author_id": author_id,     # Replace with your Scholar ID
        "api_key": api_key          # Replace with your SerpApi key
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status() # Raise error for bad status codes
        data = response.json()
        
        # Extract the 'cited_by' block from SerpApi response
        citation_table = data.get("cited_by", {})
        matrix = citation_table.get("table", [])
        
        if matrix:
            # The first item in the matrix array contains overall totals: 
            # [{"citations": {"all": 1240, "since_2021": 890}}, ...]
            total_citations = matrix[0].get("citations", {}).get("all", 0)
            h_index = matrix[1].get("h_index", {}).get("all", 0)
            i10_index = matrix[2].get("i10_index", {}).get("all", 0)
            
            print(f"Total Citations: {total_citations}")
            print(f"h-index: {h_index}")
            print(f"i10-index: {i10_index}")
            
            return {
                "citations": total_citations,
                "h_index": h_index,
                "i10_index": i10_index
            }
            
    except requests.exceptions.RequestException as e:
        print(f"Error calling SerpApi: {e}")
        return None

    # Append this to the Python script above to save a data file for app.js
output_data = fetch_scholar_citations(SCHOLAR_ID, SERPAPI_KEY)
with open("scholar-stats.json", "w") as f:
    json.dump(output_data, f)

# Example Usage:
# Replace 'SMq_99wAAAAJ' with your actual Google Scholar identifier string
SERPAPI_KEY = "63115785bf7be5b43e8a3b27ad4212849f612f67d3dea20c234f0e2dcc43c5fb"
SCHOLAR_ID = "SMq_99wAAAAJ" 

stats = fetch_scholar_citations(SCHOLAR_ID, SERPAPI_KEY)