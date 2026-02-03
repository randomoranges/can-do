import requests
import sys
import json
from datetime import datetime

class TodoAPITester:
    def __init__(self, base_url="https://stylish-tasks.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_task_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_tasks_personal(self):
        """Test getting personal tasks"""
        return self.run_test("Get Personal Tasks", "GET", "tasks/personal", 200)

    def test_get_tasks_work(self):
        """Test getting work tasks"""
        return self.run_test("Get Work Tasks", "GET", "tasks/work", 200)

    def test_create_personal_task(self):
        """Test creating a personal task"""
        task_data = {
            "title": f"Test Personal Task {datetime.now().strftime('%H%M%S')}",
            "profile": "personal",
            "section": "today"
        }
        success, response = self.run_test("Create Personal Task", "POST", "tasks", 200, data=task_data)
        if success and 'id' in response:
            self.created_task_ids.append(response['id'])
            return True, response
        return False, {}

    def test_create_work_task(self):
        """Test creating a work task"""
        task_data = {
            "title": f"Test Work Task {datetime.now().strftime('%H%M%S')}",
            "profile": "work",
            "section": "tomorrow"
        }
        success, response = self.run_test("Create Work Task", "POST", "tasks", 200, data=task_data)
        if success and 'id' in response:
            self.created_task_ids.append(response['id'])
            return True, response
        return False, {}

    def test_create_someday_task(self):
        """Test creating a task in someday section"""
        task_data = {
            "title": f"Test Someday Task {datetime.now().strftime('%H%M%S')}",
            "profile": "personal",
            "section": "someday"
        }
        success, response = self.run_test("Create Someday Task", "POST", "tasks", 200, data=task_data)
        if success and 'id' in response:
            self.created_task_ids.append(response['id'])
            return True, response
        return False, {}

    def test_update_task(self, task_id):
        """Test updating a task"""
        update_data = {
            "title": f"Updated Task {datetime.now().strftime('%H%M%S')}",
            "section": "tomorrow",
            "completed": True
        }
        return self.run_test("Update Task", "PATCH", f"tasks/{task_id}", 200, data=update_data)

    def test_update_task_completion(self, task_id):
        """Test toggling task completion"""
        update_data = {"completed": False}
        return self.run_test("Toggle Task Completion", "PATCH", f"tasks/{task_id}", 200, data=update_data)

    def test_delete_task(self, task_id):
        """Test deleting a task"""
        return self.run_test("Delete Task", "DELETE", f"tasks/{task_id}", 200)

    def test_invalid_profile(self):
        """Test creating task with invalid profile"""
        task_data = {
            "title": "Invalid Profile Task",
            "profile": "invalid",
            "section": "today"
        }
        return self.run_test("Invalid Profile", "POST", "tasks", 422, data=task_data)

    def test_invalid_section(self):
        """Test creating task with invalid section"""
        task_data = {
            "title": "Invalid Section Task",
            "profile": "personal",
            "section": "invalid"
        }
        return self.run_test("Invalid Section", "POST", "tasks", 422, data=task_data)

    def test_missing_title(self):
        """Test creating task without title"""
        task_data = {
            "profile": "personal",
            "section": "today"
        }
        return self.run_test("Missing Title", "POST", "tasks", 422, data=task_data)

    def test_update_nonexistent_task(self):
        """Test updating non-existent task"""
        fake_id = "nonexistent-task-id"
        update_data = {"title": "Updated"}
        return self.run_test("Update Non-existent Task", "PATCH", f"tasks/{fake_id}", 404, data=update_data)

    def test_delete_nonexistent_task(self):
        """Test deleting non-existent task"""
        fake_id = "nonexistent-task-id"
        return self.run_test("Delete Non-existent Task", "DELETE", f"tasks/{fake_id}", 404)

    def cleanup_created_tasks(self):
        """Clean up tasks created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_task_ids)} created tasks...")
        for task_id in self.created_task_ids:
            try:
                response = requests.delete(f"{self.api_url}/tasks/{task_id}")
                if response.status_code == 200:
                    print(f"   ✅ Deleted task {task_id}")
                else:
                    print(f"   ⚠️ Failed to delete task {task_id}")
            except Exception as e:
                print(f"   ❌ Error deleting task {task_id}: {str(e)}")

def main():
    print("🚀 Starting Todo API Tests...")
    tester = TodoAPITester()

    # Test API availability
    success, _ = tester.test_api_root()
    if not success:
        print("❌ API is not accessible, stopping tests")
        return 1

    # Test basic CRUD operations
    print("\n📋 Testing Basic CRUD Operations...")
    
    # Test getting tasks (should work even if empty)
    tester.test_get_tasks_personal()
    tester.test_get_tasks_work()

    # Test creating tasks
    personal_success, personal_task = tester.test_create_personal_task()
    work_success, work_task = tester.test_create_work_task()
    later_success, later_task = tester.test_create_later_task()

    # Test updating tasks if creation was successful
    if personal_success:
        tester.test_update_task(personal_task['id'])
        tester.test_update_task_completion(personal_task['id'])

    # Test error cases
    print("\n🚫 Testing Error Cases...")
    tester.test_invalid_profile()
    tester.test_invalid_section()
    tester.test_missing_title()
    tester.test_update_nonexistent_task()
    tester.test_delete_nonexistent_task()

    # Test deletion (using one of the created tasks)
    if personal_success:
        tester.test_delete_task(personal_task['id'])
        # Remove from cleanup list since we already deleted it
        if personal_task['id'] in tester.created_task_ids:
            tester.created_task_ids.remove(personal_task['id'])

    # Cleanup remaining tasks
    tester.cleanup_created_tasks()

    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())