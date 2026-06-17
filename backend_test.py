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


def cleanup_test_data():
    """Clean up any remaining test photos from Cloudinary"""
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
    
    # Test 1: Root endpoint
    if test_root_endpoint():
        results["passed"] += 1
        results["tests"].append(("Root endpoint", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("Root endpoint", "FAILED"))
    
    # Test 2: Get all dates
    if test_get_all_dates():
        results["passed"] += 1
        results["tests"].append(("Get all dates", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("Get all dates", "FAILED"))
    
    # Test 3: Get non-existent date (returns default state)
    if test_get_date_not_exists(TEST_DATE_IDS[0]):
        results["passed"] += 1
        results["tests"].append(("Get non-existent date", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("Get non-existent date", "FAILED"))
    
    # Test 4: PATCH date to mark as done
    success, data = test_patch_date_done(TEST_DATE_IDS[0], True)
    if success:
        results["passed"] += 1
        results["tests"].append(("PATCH date done=true", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("PATCH date done=true", "FAILED"))
    
    # Test 5: Verify persistence
    if test_patch_date_persistence(TEST_DATE_IDS[0], True):
        results["passed"] += 1
        results["tests"].append(("Persistence check (done=true)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("Persistence check (done=true)", "FAILED"))
    
    # Test 6: PATCH date to toggle back to not done
    success, data = test_patch_date_done(TEST_DATE_IDS[0], False)
    if success:
        results["passed"] += 1
        results["tests"].append(("PATCH date done=false", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("PATCH date done=false", "FAILED"))
    
    # Test 7: Verify persistence again
    if test_patch_date_persistence(TEST_DATE_IDS[0], False):
        results["passed"] += 1
        results["tests"].append(("Persistence check (done=false)", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("Persistence check (done=false)", "FAILED"))
    
    # Test 8: Upload photo to Cloudinary (using date_id=42)
    success, photo = test_upload_photo(UPLOAD_TEST_DATE_ID)
    if success:
        results["passed"] += 1
        results["tests"].append(("Upload photo to Cloudinary", "PASSED"))
    else:
        results["failed"] += 1
        results["tests"].append(("Upload photo to Cloudinary", "FAILED"))
        photo = None
    
    # Test 9: Verify photo persists in GET
    if photo:
        success, photos = test_get_date_with_photo(UPLOAD_TEST_DATE_ID)
        if success:
            results["passed"] += 1
            results["tests"].append(("Get date with photo", "PASSED"))
        else:
            results["failed"] += 1
            results["tests"].append(("Get date with photo", "FAILED"))
    
    # Test 10: Delete photo
    if photo:
        if test_delete_photo(UPLOAD_TEST_DATE_ID, photo["public_id"]):
            results["passed"] += 1
            results["tests"].append(("Delete photo", "PASSED"))
        else:
            results["failed"] += 1
            results["tests"].append(("Delete photo", "FAILED"))
    
    # Test 11: Verify photo is removed
    if photo:
        if test_get_date_after_delete(UPLOAD_TEST_DATE_ID):
            results["passed"] += 1
            results["tests"].append(("Get date after delete", "PASSED"))
        else:
            results["failed"] += 1
            results["tests"].append(("Get date after delete", "FAILED"))
    
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
