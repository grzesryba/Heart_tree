#!/usr/bin/env python3
"""
Backend API Tests for Drzewko Randek
Tests all endpoints with real Cloudinary integration
"""
import requests
import io
import os
from PIL import Image
from urllib.parse import quote
import time

# Base URL from frontend/.env
BASE_URL = "https://love-tree-dates.preview.emergentagent.com/api"

# Test date IDs
TEST_DATE_IDS = [1, 5, 42]
UPLOAD_TEST_DATE_ID = 42  # Use 42 for upload tests as specified

# Track uploaded photos for cleanup
uploaded_photos = []

# Track created ideas for cleanup
created_idea_ids = []


def create_test_image():
    """Create a small test image in memory"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


def test_root_endpoint():
    """Test GET /api/ - health check"""
    print("\n=== Testing GET /api/ ===")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Response missing 'message' field"
        assert data["message"] == "Drzewko Randek API", f"Unexpected message: {data['message']}"
        
        print("✅ Root endpoint test PASSED")
        return True
    except Exception as e:
        print(f"❌ Root endpoint test FAILED: {e}")
        return False


def test_get_all_dates():
    """Test GET /api/dates - should return list (may be empty initially)"""
    print("\n=== Testing GET /api/dates ===")
    try:
        response = requests.get(f"{BASE_URL}/dates")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        
        print(f"✅ Get all dates test PASSED (found {len(data)} dates)")
        return True
    except Exception as e:
        print(f"❌ Get all dates test FAILED: {e}")
        return False


def test_get_date_not_exists(date_id):
    """Test GET /api/dates/{date_id} for non-existent date - should return default state"""
    print(f"\n=== Testing GET /api/dates/{date_id} (non-existent) ===")
    try:
        response = requests.get(f"{BASE_URL}/dates/{date_id}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["date_id"] == date_id, f"Expected date_id {date_id}, got {data['date_id']}"
        assert data["done"] == False, f"Expected done=False, got {data['done']}"
        assert data["photos"] == [], f"Expected empty photos, got {data['photos']}"
        
        print(f"✅ Get non-existent date test PASSED")
        return True
    except Exception as e:
        print(f"❌ Get non-existent date test FAILED: {e}")
        return False


def test_patch_date_done(date_id, done_value):
    """Test PATCH /api/dates/{date_id} to update done status"""
    print(f"\n=== Testing PATCH /api/dates/{date_id} (done={done_value}) ===")
    try:
        response = requests.patch(
            f"{BASE_URL}/dates/{date_id}",
            json={"done": done_value}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["date_id"] == date_id, f"Expected date_id {date_id}, got {data['date_id']}"
        assert data["done"] == done_value, f"Expected done={done_value}, got {data['done']}"
        
        print(f"✅ Patch date done={done_value} test PASSED")
        return True, data
    except Exception as e:
        print(f"❌ Patch date done={done_value} test FAILED: {e}")
        return False, None


def test_patch_date_persistence(date_id, expected_done):
    """Verify PATCH changes persist by doing a GET"""
    print(f"\n=== Testing persistence of done={expected_done} for date {date_id} ===")
    try:
        response = requests.get(f"{BASE_URL}/dates/{date_id}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["done"] == expected_done, f"Expected done={expected_done}, got {data['done']}"
        
        print(f"✅ Persistence test PASSED")
        return True
    except Exception as e:
        print(f"❌ Persistence test FAILED: {e}")
        return False


def test_upload_photo(date_id):
    """Test POST /api/dates/{date_id}/photos - upload image to Cloudinary"""
    print(f"\n=== Testing POST /api/dates/{date_id}/photos (upload) ===")
    try:
        img_bytes = create_test_image()
        files = {'file': ('test_image.png', img_bytes, 'image/png')}
        
        response = requests.post(
            f"{BASE_URL}/dates/{date_id}/photos",
            files=files
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["date_id"] == date_id, f"Expected date_id {date_id}, got {data['date_id']}"
        assert len(data["photos"]) > 0, "Expected at least one photo in response"
        
        photo = data["photos"][-1]  # Get the last uploaded photo
        assert "public_id" in photo, "Photo missing public_id"
        assert "url" in photo, "Photo missing url"
        assert photo["url"].startswith("https://res.cloudinary.com/"), f"Invalid Cloudinary URL: {photo['url']}"
        
        # Verify folder structure
        expected_folder = f"drzewko-randek/randka-{date_id}"
        assert expected_folder in photo["public_id"], f"Photo not in correct folder. Expected '{expected_folder}' in '{photo['public_id']}'"
        
        # Track for cleanup
        uploaded_photos.append(photo["public_id"])
        
        print(f"✅ Photo upload test PASSED")
        print(f"   Public ID: {photo['public_id']}")
        print(f"   URL: {photo['url']}")
        return True, photo
    except Exception as e:
        print(f"❌ Photo upload test FAILED: {e}")
        return False, None


def test_get_date_with_photo(date_id):
    """Verify uploaded photo persists in GET request"""
    print(f"\n=== Testing GET /api/dates/{date_id} (with photo) ===")
    try:
        response = requests.get(f"{BASE_URL}/dates/{date_id}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert len(data["photos"]) > 0, "Expected photos array to have at least one photo"
        
        photo = data["photos"][-1]
        assert "public_id" in photo, "Photo missing public_id"
        assert "url" in photo, "Photo missing url"
        
        print(f"✅ Get date with photo test PASSED")
        return True, data["photos"]
    except Exception as e:
        print(f"❌ Get date with photo test FAILED: {e}")
        return False, None


def test_delete_photo(date_id, public_id):
    """Test DELETE /api/dates/{date_id}/photos/{public_id}"""
    print(f"\n=== Testing DELETE /api/dates/{date_id}/photos/{public_id} ===")
    try:
        # URL encode the public_id (contains slashes)
        encoded_public_id = quote(public_id, safe='')
        
        response = requests.delete(f"{BASE_URL}/dates/{date_id}/photos/{encoded_public_id}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify photo is removed from photos array
        for photo in data["photos"]:
            assert photo["public_id"] != public_id, f"Photo {public_id} still in photos array"
        
        print(f"✅ Delete photo test PASSED")
        return True
    except Exception as e:
        print(f"❌ Delete photo test FAILED: {e}")
        return False


def test_get_date_after_delete(date_id):
    """Verify photo is removed after DELETE"""
    print(f"\n=== Testing GET /api/dates/{date_id} (after delete) ===")
    try:
        response = requests.get(f"{BASE_URL}/dates/{date_id}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Photos array should be empty or not contain the deleted photo
        print(f"   Photos count after delete: {len(data['photos'])}")
        
        print(f"✅ Get date after delete test PASSED")
        return True
    except Exception as e:
        print(f"❌ Get date after delete test FAILED: {e}")
        return False


def test_get_all_ideas():
    """Test GET /api/ideas - should return list of ~100 seeded ideas"""
    print("\n=== Testing GET /api/ideas ===")
    try:
        response = requests.get(f"{BASE_URL}/ideas")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: Found {len(data)} ideas")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) >= 100, f"Expected at least 100 seeded ideas, got {len(data)}"
        
        # Verify structure of first idea
        if len(data) > 0:
            idea = data[0]
            assert "id" in idea, "Idea missing 'id' field"
            assert "title" in idea, "Idea missing 'title' field"
            assert "description" in idea, "Idea missing 'description' field"
            assert "categories" in idea, "Idea missing 'categories' field"
            assert isinstance(idea["id"], int), f"Expected id to be int, got {type(idea['id'])}"
            assert isinstance(idea["title"], str), f"Expected title to be str, got {type(idea['title'])}"
            assert isinstance(idea["description"], str), f"Expected description to be str, got {type(idea['description'])}"
            assert isinstance(idea["categories"], list), f"Expected categories to be list, got {type(idea['categories'])}"
            print(f"   Sample idea: {idea['title']} (id={idea['id']}, categories={idea['categories']})")
        
        print(f"✅ Get all ideas test PASSED")
        return True, len(data)
    except Exception as e:
        print(f"❌ Get all ideas test FAILED: {e}")
        return False, 0


def test_get_categories():
    """Test GET /api/ideas/categories - should return dict with 8 category keys"""
    print("\n=== Testing GET /api/ideas/categories ===")
    try:
        response = requests.get(f"{BASE_URL}/ideas/categories")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        
        expected_keys = ["dom", "poza", "dzien", "wieczor", "cieplo", "zima", "czas", "pieniadze"]
        assert len(data) == 8, f"Expected 8 categories, got {len(data)}"
        
        for key in expected_keys:
            assert key in data, f"Missing category key: {key}"
            assert "label" in data[key], f"Category {key} missing 'label' field"
            assert "color" in data[key], f"Category {key} missing 'color' field"
        
        print(f"✅ Get categories test PASSED")
        return True
    except Exception as e:
        print(f"❌ Get categories test FAILED: {e}")
        return False


def test_create_idea_valid():
    """Test POST /api/ideas with valid data - should auto-assign next id"""
    print("\n=== Testing POST /api/ideas (valid data) ===")
    try:
        payload = {
            "title": "Test randka",
            "description": "Opis testowy",
            "categories": ["dom", "wieczor"]
        }
        response = requests.post(f"{BASE_URL}/ideas", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "id" in data, "Response missing 'id' field"
        assert data["title"] == payload["title"], f"Expected title '{payload['title']}', got '{data['title']}'"
        assert data["description"] == payload["description"], f"Expected description '{payload['description']}', got '{data['description']}'"
        assert data["categories"] == payload["categories"], f"Expected categories {payload['categories']}, got {data['categories']}"
        
        # Track for cleanup
        created_idea_ids.append(data["id"])
        
        print(f"✅ Create idea (valid) test PASSED - Created idea with id={data['id']}")
        return True, data
    except Exception as e:
        print(f"❌ Create idea (valid) test FAILED: {e}")
        return False, None


def test_create_idea_empty_title():
    """Test POST /api/ideas with empty title - should return 400"""
    print("\n=== Testing POST /api/ideas (empty title) ===")
    try:
        payload = {
            "title": "",
            "description": "Opis testowy",
            "categories": ["dom"]
        }
        response = requests.post(f"{BASE_URL}/ideas", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print(f"✅ Create idea (empty title) test PASSED - Correctly rejected")
        return True
    except Exception as e:
        print(f"❌ Create idea (empty title) test FAILED: {e}")
        return False


def test_create_idea_empty_categories():
    """Test POST /api/ideas with empty categories - should return 400"""
    print("\n=== Testing POST /api/ideas (empty categories) ===")
    try:
        payload = {
            "title": "Test randka",
            "description": "Opis testowy",
            "categories": []
        }
        response = requests.post(f"{BASE_URL}/ideas", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print(f"✅ Create idea (empty categories) test PASSED - Correctly rejected")
        return True
    except Exception as e:
        print(f"❌ Create idea (empty categories) test FAILED: {e}")
        return False


def test_create_idea_invalid_category():
    """Test POST /api/ideas with invalid category - should return 400"""
    print("\n=== Testing POST /api/ideas (invalid category) ===")
    try:
        payload = {
            "title": "Test randka",
            "description": "Opis testowy",
            "categories": ["xxx"]
        }
        response = requests.post(f"{BASE_URL}/ideas", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print(f"✅ Create idea (invalid category) test PASSED - Correctly rejected")
        return True
    except Exception as e:
        print(f"❌ Create idea (invalid category) test FAILED: {e}")
        return False


def test_update_idea_title(idea_id):
    """Test PATCH /api/ideas/{id} with title update"""
    print(f"\n=== Testing PATCH /api/ideas/{idea_id} (title update) ===")
    try:
        payload = {"title": "Test zmieniony"}
        response = requests.patch(f"{BASE_URL}/ideas/{idea_id}", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert data["title"] == payload["title"], f"Expected title '{payload['title']}', got '{data['title']}'"
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/ideas")
        ideas = get_response.json()
        updated_idea = next((i for i in ideas if i["id"] == idea_id), None)
        assert updated_idea is not None, f"Could not find idea with id={idea_id}"
        assert updated_idea["title"] == payload["title"], f"Title not persisted. Expected '{payload['title']}', got '{updated_idea['title']}'"
        
        print(f"✅ Update idea title test PASSED")
        return True
    except Exception as e:
        print(f"❌ Update idea title test FAILED: {e}")
        return False


def test_update_idea_categories(idea_id):
    """Test PATCH /api/ideas/{id} with categories update"""
    print(f"\n=== Testing PATCH /api/ideas/{idea_id} (categories update) ===")
    try:
        payload = {"categories": ["dzien"]}
        response = requests.patch(f"{BASE_URL}/ideas/{idea_id}", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert data["categories"] == payload["categories"], f"Expected categories {payload['categories']}, got {data['categories']}"
        
        print(f"✅ Update idea categories test PASSED")
        return True
    except Exception as e:
        print(f"❌ Update idea categories test FAILED: {e}")
        return False


def test_update_idea_not_found():
    """Test PATCH /api/ideas/99999 - should return 404"""
    print("\n=== Testing PATCH /api/ideas/99999 (not found) ===")
    try:
        payload = {"title": "Test"}
        response = requests.patch(f"{BASE_URL}/ideas/99999", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✅ Update idea (not found) test PASSED")
        return True
    except Exception as e:
        print(f"❌ Update idea (not found) test FAILED: {e}")
        return False


def test_delete_idea(idea_id):
    """Test DELETE /api/ideas/{id}"""
    print(f"\n=== Testing DELETE /api/ideas/{idea_id} ===")
    try:
        response = requests.delete(f"{BASE_URL}/ideas/{idea_id}")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert data.get("ok") == True, f"Expected ok=True, got {data}"
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/ideas")
        ideas = get_response.json()
        deleted_idea = next((i for i in ideas if i["id"] == idea_id), None)
        assert deleted_idea is None, f"Idea with id={idea_id} still exists after deletion"
        
        print(f"✅ Delete idea test PASSED")
        return True
    except Exception as e:
        print(f"❌ Delete idea test FAILED: {e}")
        return False


def test_delete_idea_not_found():
    """Test DELETE /api/ideas/99999 - should return 404"""
    print("\n=== Testing DELETE /api/ideas/99999 (not found) ===")
    try:
        response = requests.delete(f"{BASE_URL}/ideas/99999")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✅ Delete idea (not found) test PASSED")
        return True
    except Exception as e:
        print(f"❌ Delete idea (not found) test FAILED: {e}")
        return False


def test_delete_idea_cleans_up_state():
    """Test that deleting an idea cleans up related date_states entry"""
    print("\n=== Testing DELETE /api/ideas cleans up date_states ===")
    try:
        # Create a new idea
        payload = {
            "title": "Test cleanup randka",
            "description": "Test cleanup",
            "categories": ["dom"]
        }
        create_response = requests.post(f"{BASE_URL}/ideas", json=payload)
        assert create_response.status_code == 200, f"Failed to create idea: {create_response.status_code}"
        idea = create_response.json()
        idea_id = idea["id"]
        print(f"   Created idea with id={idea_id}")
        
        # Mark it as done
        patch_response = requests.patch(f"{BASE_URL}/dates/{idea_id}", json={"done": True})
        assert patch_response.status_code == 200, f"Failed to mark as done: {patch_response.status_code}"
        print(f"   Marked idea {idea_id} as done")
        
        # Upload a photo
        img_bytes = create_test_image()
        files = {'file': ('test_cleanup.png', img_bytes, 'image/png')}
        upload_response = requests.post(f"{BASE_URL}/dates/{idea_id}/photos", files=files)
        assert upload_response.status_code == 200, f"Failed to upload photo: {upload_response.status_code}"
        photo_data = upload_response.json()
        print(f"   Uploaded photo to idea {idea_id}")
        
        # Verify state exists
        get_state_response = requests.get(f"{BASE_URL}/dates/{idea_id}")
        assert get_state_response.status_code == 200
        state = get_state_response.json()
        assert state["done"] == True, "State should be marked as done"
        assert len(state["photos"]) > 0, "State should have photos"
        print(f"   Verified state exists with done=True and {len(state['photos'])} photo(s)")
        
        # Delete the idea
        delete_response = requests.delete(f"{BASE_URL}/ideas/{idea_id}")
        assert delete_response.status_code == 200, f"Failed to delete idea: {delete_response.status_code}"
        print(f"   Deleted idea {idea_id}")
        
        # Verify state is cleaned up (should return default state)
        get_state_after_response = requests.get(f"{BASE_URL}/dates/{idea_id}")
        assert get_state_after_response.status_code == 200
        state_after = get_state_after_response.json()
        assert state_after["done"] == False, "State should be reset to default (done=False)"
        assert len(state_after["photos"]) == 0, "State should have no photos"
        print(f"   Verified state was cleaned up (done=False, photos=[])")
        
        print(f"✅ Delete idea cleans up state test PASSED")
        return True
    except Exception as e:
        print(f"❌ Delete idea cleans up state test FAILED: {e}")
        return False


def cleanup_test_data():
    """Clean up any remaining test photos and ideas"""
    print("\n=== Cleaning up test data ===")
    
    # Delete any remaining photos from test dates
    for date_id in TEST_DATE_IDS:
        try:
            response = requests.get(f"{BASE_URL}/dates/{date_id}")
            if response.status_code == 200:
                data = response.json()
                for photo in data.get("photos", []):
                    public_id = photo["public_id"]
                    encoded_public_id = quote(public_id, safe='')
                    print(f"   Deleting photo: {public_id}")
                    requests.delete(f"{BASE_URL}/dates/{date_id}/photos/{encoded_public_id}")
        except Exception as e:
            print(f"   Warning: Could not clean up date {date_id}: {e}")
    
    # Delete any created test ideas
    for idea_id in created_idea_ids:
        try:
            print(f"   Deleting test idea: {idea_id}")
            requests.delete(f"{BASE_URL}/ideas/{idea_id}")
        except Exception as e:
            print(f"   Warning: Could not clean up idea {idea_id}: {e}")
    
    print("✅ Cleanup complete")


def run_all_tests():
    """Run all backend tests in sequence"""
    print("=" * 80)
    print("BACKEND API TESTS FOR DRZEWKO RANDEK")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Date IDs: {TEST_DATE_IDS}")
    print(f"Upload Test Date ID: {UPLOAD_TEST_DATE_ID}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "tests": []
    }
    
    # ===== NEW DateIdeas CRUD Tests =====
    print("\n" + "=" * 80)
    print("TESTING NEW DATEIDEAS CRUD ENDPOINTS")
    print("=" * 80)
    
    # Test 1: Get all ideas
    success, count = test_get_all_ideas()
    if success:
        results["passed"] += 1
        results["tests"].append(("GET /api/ideas", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("GET /api/ideas", "FAILED"))
    
    # Test 2: Get categories
    if test_get_categories():
        results["passed"] += 1
        results["tests"].append(("GET /api/ideas/categories", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("GET /api/ideas/categories", "FAILED"))
    
    # Test 3: Create idea with valid data
    success, created_idea = test_create_idea_valid()
    if success:
        results["passed"] += 1
        results["tests"].append(("POST /api/ideas (valid)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("POST /api/ideas (valid)", "FAILED"))
        created_idea = None
    
    # Test 4: Create idea with empty title
    if test_create_idea_empty_title():
        results["passed"] += 1
        results["tests"].append(("POST /api/ideas (empty title)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("POST /api/ideas (empty title)", "FAILED"))
    
    # Test 5: Create idea with empty categories
    if test_create_idea_empty_categories():
        results["passed"] += 1
        results["tests"].append(("POST /api/ideas (empty categories)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("POST /api/ideas (empty categories)", "FAILED"))
    
    # Test 6: Create idea with invalid category
    if test_create_idea_invalid_category():
        results["passed"] += 1
        results["tests"].append(("POST /api/ideas (invalid category)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("POST /api/ideas (invalid category)", "FAILED"))
    
    # Test 7: Update idea title
    if created_idea:
        if test_update_idea_title(created_idea["id"]):
            results["passed"] += 1
            results["tests"].append(("PATCH /api/ideas/{id} (title)", "PASSED"))
        else:
            results["failed"] += 1
            results["tests"].append(("PATCH /api/ideas/{id} (title)", "FAILED"))
    
    # Test 8: Update idea categories
    if created_idea:
        if test_update_idea_categories(created_idea["id"]):
            results["passed"] += 1
            results["tests"].append(("PATCH /api/ideas/{id} (categories)", "PASSED"))
        else:
            results["failed"] += 1
            results["tests"].append(("PATCH /api/ideas/{id} (categories)", "FAILED"))
    
    # Test 9: Update non-existent idea
    if test_update_idea_not_found():
        results["passed"] += 1
        results["tests"].append(("PATCH /api/ideas/99999 (404)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("PATCH /api/ideas/99999 (404)", "FAILED"))
    
    # Test 10: Delete idea
    if created_idea:
        if test_delete_idea(created_idea["id"]):
            results["passed"] += 1
            results["tests"].append(("DELETE /api/ideas/{id}", "PASSED"))
        else:
            results["failed"] += 1
            results["tests"].append(("DELETE /api/ideas/{id}", "FAILED"))
    
    # Test 11: Delete non-existent idea
    if test_delete_idea_not_found():
        results["passed"] += 1
        results["tests"].append(("DELETE /api/ideas/99999 (404)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("DELETE /api/ideas/99999 (404)", "FAILED"))
    
    # Test 12: Delete idea cleans up state
    if test_delete_idea_cleans_up_state():
        results["passed"] += 1
        results["tests"].append(("DELETE /api/ideas cleans up state", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("DELETE /api/ideas cleans up state", "FAILED"))
    
    # ===== EXISTING Date States + Photos Tests =====
    print("\n" + "=" * 80)
    print("TESTING EXISTING DATE STATES + PHOTOS ENDPOINTS")
    print("=" * 80)
    
    # Test 13: Root endpoint
    if test_root_endpoint():
        results["passed"] += 1
        results["tests"].append(("GET /api/", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("GET /api/", "FAILED"))
    
    # Test 14: Get all dates
    if test_get_all_dates():
        results["passed"] += 1
        results["tests"].append(("GET /api/dates", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("GET /api/dates", "FAILED"))
    
    # Test 15: PATCH date to mark as done
    success, data = test_patch_date_done(1, True)
    if success:
        results["passed"] += 1
        results["tests"].append(("PATCH /api/dates/1 (done=true)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("PATCH /api/dates/1 (done=true)", "FAILED"))
    
    # Test 16: Verify persistence
    if test_patch_date_persistence(1, True):
        results["passed"] += 1
        results["tests"].append(("GET /api/dates/1 (done=true)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("GET /api/dates/1 (done=true)", "FAILED"))
    
    # Test 17: Upload photo to Cloudinary
    success, photo = test_upload_photo(1)
    if success:
        results["passed"] += 1
        results["tests"].append(("POST /api/dates/1/photos", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("POST /api/dates/1/photos", "FAILED"))
        photo = None
    
    # Test 18: Delete photo
    if photo:
        if test_delete_photo(1, photo["public_id"]):
            results["passed"] += 1
            results["tests"].append(("DELETE /api/dates/1/photos/{id}", "PASSED"))
        else:
            results["failed"] += 1
            results["tests"].append(("DELETE /api/dates/1/photos/{id}", "FAILED"))
    
    # Test 19: Reset date to done=false
    success, data = test_patch_date_done(1, False)
    if success:
        results["passed"] += 1
        results["tests"].append(("PATCH /api/dates/1 (done=false)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("PATCH /api/dates/1 (done=false)", "FAILED"))
    
    # Cleanup
    cleanup_test_data()
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    for test_name, status in results["tests"]:
        symbol = "✅" if status == "PASSED" else "❌"
        print(f"{symbol} {test_name}: {status}")
    
    print("\n" + "-" * 80)
    print(f"Total: {results['passed'] + results['failed']} tests")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print("=" * 80)
    
    return results


if __name__ == "__main__":
    results = run_all_tests()
    exit(0 if results["failed"] == 0 else 1)
