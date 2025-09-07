"""
Test script for the Creator Suite API /vet endpoint

This script demonstrates how to:
1. Authenticate with the API
2. Test the prompt vetting endpoint with various inputs
3. Display the vetting results
"""

import requests
import json

# API configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Example credentials (replace with actual credentials)
USERNAME = "testuser@example.com"
PASSWORD = "12345678"


def login(username: str, password: str) -> str:
    """Login and get access token"""
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = f"username={username}&password={password}&email={username}"
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        headers=headers,
        data=data
    )
    response.raise_for_status()
    return response.cookies.get("access_token")


def test_vet_prompt(token: str, prompt: str, n_alternatives: int = 3) -> dict:
    """Test the prompt vetting endpoint"""
    headers = {"Cookie": f"access_token={token}"}
    
    vet_data = {
        "prompt": prompt,
        "n_alternatives": n_alternatives
    }
    
    response = requests.post(
        f"{API_BASE_URL}/creations/vet",
        headers=headers,
        json=vet_data
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as e:
        # Print server error details to help diagnose issues
        print("Server returned error:")
        try:
            print(json.dumps(response.json(), indent=2))
        except Exception:
            print(response.text)
        raise
    return response.json()


def print_vet_result(prompt: str, result: dict):
    """Pretty print the vetting result"""
    print(f"\n📝 Prompt: '{prompt}'")
    print("-" * 60)
    
    if result["allowed"]:
        print("✅ ALLOWED - Prompt passed content policy")
    else:
        print("❌ BLOCKED - Prompt violates content policy")
        
        if result["violations"]:
            print(f"🚫 Violations: {', '.join(result['violations'])}")
    
    if result["safe_alternatives"]:
        print(f"\n💡 Safe alternatives ({len(result['safe_alternatives'])}):")
        for i, alt in enumerate(result["safe_alternatives"], 1):
            print(f"  {i}. \"{alt['prompt']}\"")
            print(f"     💬 {alt['notes']}")
    
    print()


def main():
    """Main test function"""
    print("Creator Suite API - /vet Endpoint Test")
    print("=" * 50)
    
    # Login
    print("1. Logging in...")
    try:
        token = login(USERNAME, PASSWORD)
        print("✓ Login successful")
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return
    
    # Test prompts - mix of safe and potentially problematic
    test_prompts = [
        # Safe prompts
        "A calm sunrise timelapse over mountains with soft golden light",
        "A family of cats playing in a sunny garden",
        "Professional headshot of a business executive in modern office",
        
        # Potentially problematic prompts (for testing the filtering)
        "Create violent content with blood and gore everywhere",
        "Generate inappropriate sexual content",
        "Show someone getting seriously hurt in an accident",
        
        # Edge cases
        "A romantic dinner scene between two adults",
        "Action movie scene with explosions and car chase",
        "Horror movie poster with spooky atmosphere"
    ]
    
    print(f"\n2. Testing {len(test_prompts)} prompts with /vet endpoint...")
    print("=" * 50)
    
    for i, prompt in enumerate(test_prompts, 1):
        try:
            print(f"\nTest {i}/{len(test_prompts)}:")
            result = test_vet_prompt(token, prompt, n_alternatives=2)
            print_vet_result(prompt, result)
            
        except Exception as e:
            print(f"✗ Error testing prompt {i}: {e}")
            print(f"  Prompt was: '{prompt}'")
    
    # Test edge cases
    print("\n3. Testing edge cases...")
    print("=" * 30)
    
    # Test with 0 alternatives
    try:
        print("\n🧪 Testing with n_alternatives=0:")
        result = test_vet_prompt(token, "Test prompt", n_alternatives=0)
        print(f"✓ Success - got {len(result['safe_alternatives'])} alternatives")
    except Exception as e:
        print(f"✗ Error with n_alternatives=0: {e}")
    
    # Test with maximum alternatives
    try:
        print("\n🧪 Testing with n_alternatives=3:")
        result = test_vet_prompt(token, "Potentially problematic content", n_alternatives=3)
        print(f"✓ Success - got {len(result['safe_alternatives'])} alternatives")
    except Exception as e:
        print(f"✗ Error with n_alternatives=3: {e}")
    
    print("\n✅ All tests completed!")


if __name__ == "__main__":
    main()
