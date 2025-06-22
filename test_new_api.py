import os
import requests
import json
from dotenv import load_dotenv

def test_new_api_key():
    """Test the new API key with gemini-2.0-flash model"""
    print("=== Testing New API Key with Gemini 2.0 Flash ===")
    
    # Load environment variables
    load_dotenv()
    
    # Get API key
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("❌ ERROR: GOOGLE_API_KEY not found in .env file")
        return
    
    print(f"✅ API Key found: {api_key[:10]}...{api_key[-10:]}")
    
    # Test with the same request as your curl command
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Explain how AI works in a few words"
                    }
                ]
            }
        ]
    }
    
    try:
        print("🔄 Sending test request...")
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                text = result['candidates'][0]['content']['parts'][0]['text']
                print("✅ SUCCESS! API key is working with gemini-2.0-flash")
                print(f"✅ Response: {text}")
            else:
                print("❌ Unexpected response format")
                print(f"Response: {result}")
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

if __name__ == "__main__":
    test_new_api_key() 