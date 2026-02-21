#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class CRMAPITester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.test_customer_id = None
        self.test_lead_id = None
        self.test_team_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def run_api_test(self, name, method, endpoint, expected_status, data=None, check_auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                try:
                    error_details = response.json()
                    print(f"   Response: {error_details}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        test_phone = f"9876543{datetime.now().strftime('%H%M')}"  # Unique phone
        test_data = {
            "name": "Test User",
            "phone": test_phone,
            "pin": "1234"
        }
        
        success, response = self.run_api_test(
            "User Registration",
            "POST",
            "register",
            201,
            test_data
        )
        
        if success:
            self.test_phone = test_phone
            self.test_pin = "1234"
        
        return success

    def test_user_login(self):
        """Test user login"""
        if not hasattr(self, 'test_phone'):
            return False
            
        login_data = {
            "phone": self.test_phone,
            "pin": self.test_pin
        }
        
        success, response = self.run_api_test(
            "User Login",
            "POST",
            "login",
            200,
            login_data
        )
        
        # Debug: Check if cookies are set
        if success:
            cookies = self.session.cookies
            print(f"   Cookies after login: {dict(cookies)}")
        
        return success

    def test_session_check(self):
        """Test session validation"""
        success, response = self.run_api_test(
            "Session Check",
            "GET",
            "session",
            200
        )
        
        if success and 'user' in response:
            self.user_id = response['user']['_id']
        
        return success

    def test_add_customer(self):
        """Test adding a customer"""
        customer_data = {
            "name": "Test Customer",
            "phone": "9876543210",
            "productPlan": "Premium Plan",
            "subscriptionStatus": "Active",
            "renewalDate": "2024-12-31",
            "monthlyVolume": 1000
        }
        
        success, response = self.run_api_test(
            "Add Customer",
            "POST",
            "customers",
            201,
            customer_data
        )
        
        if success and 'customer' in response:
            self.test_customer_id = response['customer']['_id']
        
        return success

    def test_get_customers(self):
        """Test getting customers list"""
        success, response = self.run_api_test(
            "Get Customers",
            "GET",
            "customers",
            200
        )
        
        if success:
            customers = response.get('customers', [])
            print(f"   Found {len(customers)} customers")
        
        return success

    def test_delete_customer(self):
        """Test deleting a customer"""
        if not self.test_customer_id:
            self.log_test("Delete Customer", False, "No customer ID available")
            return False
            
        success, response = self.run_api_test(
            "Delete Customer",
            "DELETE",
            f"customers/{self.test_customer_id}",
            200
        )
        
        return success

    def test_add_lead(self):
        """Test adding a lead"""
        lead_data = {
            "name": "Test Lead",
            "source": "WhatsApp",
            "status": "Hot",
            "followUpDate": "2024-12-25",
            "notes": "Interested in premium plan"
        }
        
        success, response = self.run_api_test(
            "Add Lead",
            "POST",
            "leads",
            201,
            lead_data
        )
        
        if success and 'lead' in response:
            self.test_lead_id = response['lead']['_id']
        
        return success

    def test_get_leads(self):
        """Test getting leads list"""
        success, response = self.run_api_test(
            "Get Leads",
            "GET",
            "leads",
            200
        )
        
        if success:
            leads = response.get('leads', [])
            print(f"   Found {len(leads)} leads")
        
        return success

    def test_update_lead(self):
        """Test updating a lead"""
        if not self.test_lead_id:
            self.log_test("Update Lead", False, "No lead ID available")
            return False
            
        update_data = {
            "status": "Warm",
            "notes": "Updated notes - follow up next week"
        }
        
        success, response = self.run_api_test(
            "Update Lead",
            "PATCH",
            f"leads/{self.test_lead_id}",
            200,
            update_data
        )
        
        return success

    def test_delete_lead(self):
        """Test deleting a lead"""
        if not self.test_lead_id:
            self.log_test("Delete Lead", False, "No lead ID available")
            return False
            
        success, response = self.run_api_test(
            "Delete Lead",
            "DELETE",
            f"leads/{self.test_lead_id}",
            200
        )
        
        return success

    def test_add_team_member(self):
        """Test adding a team member"""
        team_data = {
            "name": "Test Team Member",
            "phone": "9876543211",
            "role": "Senior Partner",
            "rank": "Supervisor",
            "joiningDate": "2024-01-15",
            "personalVolume": 500,
            "teamVolume": 1500,
            "level": 2,
            "performanceTag": "Star",
            "sponsor": "Main Sponsor"
        }
        
        success, response = self.run_api_test(
            "Add Team Member",
            "POST",
            "team",
            201,
            team_data
        )
        
        if success and 'member' in response:
            self.test_team_id = response['member']['_id']
        
        return success

    def test_get_team(self):
        """Test getting team list"""
        success, response = self.run_api_test(
            "Get Team",
            "GET",
            "team",
            200
        )
        
        if success:
            members = response.get('members', [])
            stats = response.get('stats', {})
            print(f"   Found {len(members)} team members")
            print(f"   Stats: {stats}")
        
        return success

    def test_update_team_member(self):
        """Test updating a team member"""
        if not self.test_team_id:
            self.log_test("Update Team Member", False, "No team member ID available")
            return False
            
        update_data = {
            "role": "Executive Partner",
            "personalVolume": 750,
            "performanceTag": "Top Performer"
        }
        
        success, response = self.run_api_test(
            "Update Team Member",
            "PATCH",
            f"team/{self.test_team_id}",
            200,
            update_data
        )
        
        return success

    def test_delete_team_member(self):
        """Test deleting a team member"""
        if not self.test_team_id:
            self.log_test("Delete Team Member", False, "No team member ID available")
            return False
            
        success, response = self.run_api_test(
            "Delete Team Member",
            "DELETE",
            f"team/{self.test_team_id}",
            200
        )
        
        return success

    def test_get_journey(self):
        """Test getting journey data"""
        success, response = self.run_api_test(
            "Get Journey",
            "GET",
            "journey",
            200
        )
        
        if success:
            journey = response.get('journey', {})
            print(f"   Journey data: {journey}")
        
        return success

    def test_update_journey(self):
        """Test updating journey goals"""
        journey_data = {
            "currentRank": "Supervisor",
            "targetRank": "Senior Supervisor",
            "monthlyGoal": 5000,
            "yearlyGoal": 60000,
            "personalVolume": 2500
        }
        
        success, response = self.run_api_test(
            "Update Journey",
            "PUT",
            "journey",
            200,
            journey_data
        )
        
        return success

    def test_add_milestone(self):
        """Test adding a milestone"""
        milestone_data = {
            "milestone": {
                "title": "First 1000 PV",
                "date": "2024-12-31",
                "description": "Achieved first 1000 personal volume"
            }
        }
        
        success, response = self.run_api_test(
            "Add Milestone",
            "POST",
            "journey",
            201,
            milestone_data
        )
        
        return success

    def test_get_club(self):
        """Test getting club data"""
        success, response = self.run_api_test(
            "Get Club",
            "GET",
            "club",
            200
        )
        
        if success:
            club = response.get('club', {})
            print(f"   Club data: {club}")
        
        return success

    def test_update_club(self):
        """Test updating club progress"""
        club_data = {
            "currentLevel": "Bronze",
            "targetLevel": "Silver",
            "qualificationProgress": 65,
            "monthlyRequirement": 3000,
            "currentMonthlyVolume": 1950
        }
        
        success, response = self.run_api_test(
            "Update Club",
            "PUT",
            "club",
            200,
            club_data
        )
        
        return success

    def test_get_organization(self):
        """Test getting organization tree"""
        success, response = self.run_api_test(
            "Get Organization",
            "GET",
            "organization",
            200
        )
        
        if success:
            members = response.get('members', [])
            level_groups = response.get('levelGroups', {})
            stats = response.get('stats', {})
            print(f"   Organization members: {len(members)}")
            print(f"   Level groups: {len(level_groups)}")
            print(f"   Stats: {stats}")
        
        return success

    def test_get_settings(self):
        """Test getting settings"""
        success, response = self.run_api_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        
        if success:
            settings = response.get('settings', {})
            user = response.get('user', {})
            print(f"   Settings: {settings}")
            print(f"   User: {user}")
        
        return success

    def test_update_profile_settings(self):
        """Test updating profile settings"""
        profile_data = {
            "type": "profile",
            "data": {
                "name": "Updated Test User"
            }
        }
        
        success, response = self.run_api_test(
            "Update Profile Settings",
            "PUT",
            "settings",
            200,
            profile_data
        )
        
        return success

    def test_update_business_settings(self):
        """Test updating business settings"""
        business_data = {
            "type": "business",
            "data": {
                "businessName": "Test Business",
                "businessPhone": "9876543210",
                "businessAddress": "123 Test Street"
            }
        }
        
        success, response = self.run_api_test(
            "Update Business Settings",
            "PUT",
            "settings",
            200,
            business_data
        )
        
        return success

    def test_export_data(self):
        """Test data export"""
        success, response = self.run_api_test(
            "Export Data",
            "GET",
            "settings/export",
            200
        )
        
        if success:
            export_data = response
            print(f"   Export contains: {list(export_data.keys())}")
        
        return success

    def test_get_reports(self):
        """Test getting reports data"""
        success, response = self.run_api_test(
            "Get Reports",
            "GET",
            "reports",
            200
        )
        
        if success:
            expected_fields = ['totalTeam', 'totalCustomers', 'totalLeads', 
                             'activeCustomers', 'monthlyNewMembers', 'monthlyNewLeads']
            
            for field in expected_fields:
                if field not in response:
                    self.log_test(f"Reports - {field} field", False, f"Missing field: {field}")
                else:
                    print(f"   {field}: {response[field]}")
        
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # Create a new session without authentication
        temp_session = requests.Session()
        
        endpoints_to_test = [
            ("customers", "GET"),
            ("leads", "GET"),
            ("reports", "GET")
        ]
        
        all_passed = True
        
        for endpoint, method in endpoints_to_test:
            url = f"{self.base_url}/api/{endpoint}"
            
            try:
                if method == 'GET':
                    response = temp_session.get(url)
                
                if response.status_code == 401:
                    self.log_test(f"Unauthorized Access - {endpoint}", True)
                else:
                    self.log_test(f"Unauthorized Access - {endpoint}", False, 
                                f"Expected 401, got {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Unauthorized Access - {endpoint}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CRM API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Session Check", self.test_session_check),
            ("Add Customer", self.test_add_customer),
            ("Get Customers", self.test_get_customers),
            ("Delete Customer", self.test_delete_customer),
            ("Add Lead", self.test_add_lead),
            ("Get Leads", self.test_get_leads),
            ("Update Lead", self.test_update_lead),
            ("Delete Lead", self.test_delete_lead),
            ("Get Reports", self.test_get_reports),
            ("Unauthorized Access", self.test_unauthorized_access),
        ]
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            try:
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Exception: {str(e)}")
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = CRMAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Fatal error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())