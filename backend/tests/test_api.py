import os
import unittest
import json
import tempfile
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import db, User, Account, Transaction, Budget, Goal, Bill, Card

class FamilyFinanceTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for isolated test database
        self.db_fd, self.db_path = tempfile.mkstemp(suffix='.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{self.db_path}"
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key-123'
        app.config['JWT_SECRET_KEY'] = 'test-jwt-secret-key-456'

        self.client = app.test_client()

        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()
        try:
            os.close(self.db_fd)
            os.unlink(self.db_path)
        except OSError:
            pass

    def register_and_login(self, username="testuser", email="test@example.com", password="password123"):
        # Register
        res = self.client.post('/api/auth/register', json={
            'username': username,
            'email': email,
            'password': password,
            'full_name': 'Test User'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        token = data['token']
        headers = {'Authorization': f'Bearer {token}'}
        return token, headers

    def test_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('service', data)

    def test_auth_flow(self):
        # Register
        res = self.client.post('/api/auth/register', json={
            'username': 'alice',
            'email': 'alice@example.com',
            'password': 'mypassword',
            'full_name': 'Alice Smith'
        })
        self.assertEqual(res.status_code, 201)
        self.assertIn('token', res.get_json())

        # Duplicate register should fail with 409
        dup_res = self.client.post('/api/auth/register', json={
            'username': 'alice',
            'email': 'alice2@example.com',
            'password': 'mypassword'
        })
        self.assertEqual(dup_res.status_code, 409)

        # Login
        login_res = self.client.post('/api/auth/login', json={
            'username': 'alice',
            'password': 'mypassword'
        })
        self.assertEqual(login_res.status_code, 200)
        token = login_res.get_json()['token']

        # Get profile
        prof_res = self.client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(prof_res.status_code, 200)
        self.assertEqual(prof_res.get_json()['user']['username'], 'alice')

        # Update profile via PUT and POST
        upd_res = self.client.post('/api/auth/profile', headers={'Authorization': f'Bearer {token}'}, json={
            'full_name': 'Alice Updated',
            'currency': 'USD',
            'currency_symbol': '$'
        })
        self.assertEqual(upd_res.status_code, 200)
        self.assertEqual(upd_res.get_json()['user']['full_name'], 'Alice Updated')

    def test_account_and_balance_flow(self):
        _, headers = self.register_and_login()

        # Create Savings Account
        res = self.client.post('/api/accounts', headers=headers, json={
            'name': 'Primary Vault',
            'account_type': 'savings',
            'balance': 50000.0,
            'icon': 'building-2',
            'color': '#10b981'
        })
        self.assertEqual(res.status_code, 201)
        acc_id = res.get_json()['account']['id']

        # List accounts
        list_res = self.client.get('/api/accounts', headers=headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.get_json()['accounts']), 1)

        # Add Expense Transaction (should deduct from balance)
        tx_res = self.client.post('/api/transactions', headers=headers, json={
            'account_id': acc_id,
            'type': 'expense',
            'category': 'Food',
            'amount': 2500.0,
            'description': 'Grocery run',
            'date': '2026-11-12',
            'payment_method': 'card'
        })
        self.assertEqual(tx_res.status_code, 201)

        # Verify Account balance decreased to 47500
        acc_check = self.client.get(f'/api/accounts/{acc_id}', headers=headers)
        self.assertEqual(acc_check.status_code, 200)
        self.assertEqual(acc_check.get_json()['account']['balance'], 47500.0)

        # Add Income Transaction (should increase balance)
        inc_res = self.client.post('/api/transactions', headers=headers, json={
            'account_id': acc_id,
            'type': 'income',
            'category': 'Salary',
            'amount': 10000.0,
            'description': 'Consulting retainer',
            'date': '2026-11-12'
        })
        self.assertEqual(inc_res.status_code, 201)

        # Verify Account balance increased to 57500
        acc_check2 = self.client.get(f'/api/accounts/{acc_id}', headers=headers)
        self.assertEqual(acc_check2.get_json()['account']['balance'], 57500.0)

    def test_budget_and_spending_utilization(self):
        _, headers = self.register_and_login()

        # Create account
        acc = self.client.post('/api/accounts', headers=headers, json={
            'name': 'Everyday Account',
            'account_type': 'current',
            'balance': 20000.0
        }).get_json()['account']

        # Create Budget for Food: 10000
        b_res = self.client.post('/api/budgets', headers=headers, json={
            'category': 'Food',
            'allocated': 10000.0,
            'month': 11,
            'year': 2026
        })
        self.assertEqual(b_res.status_code, 201)

        # Add Food expense of 4000
        self.client.post('/api/transactions', headers=headers, json={
            'account_id': acc['id'],
            'type': 'expense',
            'category': 'Food',
            'amount': 4000.0,
            'description': 'Dining out',
            'date': '2026-11-10'
        })

        # Fetch Budgets: spent should be 4000, remaining 6000, utilization 40%
        b_list = self.client.get('/api/budgets?month=11&year=2026', headers=headers).get_json()
        self.assertEqual(len(b_list['budgets']), 1)
        food_b = b_list['budgets'][0]
        self.assertEqual(food_b['spent'], 4000.0)
        self.assertEqual(food_b['remaining'], 6000.0)
        self.assertEqual(food_b['percentage'], 40.0)

    def test_goal_contributions(self):
        _, headers = self.register_and_login()

        # Create Goal: Emergency Fund (Target 100,000)
        g_res = self.client.post('/api/goals', headers=headers, json={
            'name': 'Emergency Fund',
            'target_amount': 100000.0,
            'current_amount': 10000.0
        })
        self.assertEqual(g_res.status_code, 201)
        goal_id = g_res.get_json()['goal']['id']

        # Add contribution of 15,000
        c_res = self.client.post(f'/api/goals/{goal_id}/contributions', headers=headers, json={
            'amount': 15000.0,
            'note': 'November bonus'
        })
        self.assertEqual(c_res.status_code, 201)
        self.assertEqual(c_res.get_json()['goal']['current_amount'], 25000.0)
        self.assertEqual(c_res.get_json()['goal']['progress'], 25.0)

    def test_card_management(self):
        _, headers = self.register_and_login()

        # Create Card
        c_res = self.client.post('/api/cards', headers=headers, json={
            'cardholder_name': 'Zuhayr Personal',
            'card_number': '4532 8923 1120 4490',
            'expiry_date': '08/29',
            'card_label': 'Verdela Emerald VIP',
            'network': 'visa',
            'color_theme': 'emerald'
        })
        self.assertEqual(c_res.status_code, 201)
        card = c_res.get_json()['card']
        self.assertEqual(card['last4'], '4490')
        self.assertFalse(card['is_locked'])

        # Toggle Lock
        lock_res = self.client.post(f'/api/cards/{card["id"]}/toggle-lock', headers=headers)
        self.assertEqual(lock_res.status_code, 200)
        self.assertTrue(lock_res.get_json()['is_locked'])

    def test_security_headers_and_error_handling(self):
        # Check security headers
        res = self.client.get('/api/health')
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(res.headers.get('X-Frame-Options'), 'SAMEORIGIN')
        self.assertEqual(res.headers.get('X-XSS-Protection'), '1; mode=block')

        # Check 401 Unauthorized returns clean JSON
        unauth_res = self.client.get('/api/accounts')
        self.assertEqual(unauth_res.status_code, 401)
        self.assertIn('error', unauth_res.get_json())

        # Check 404 Not Found returns clean JSON
        not_found_res = self.client.get('/api/non_existent_endpoint')
        self.assertEqual(not_found_res.status_code, 404)
        self.assertIn('error', not_found_res.get_json())

if __name__ == '__main__':
    unittest.main()
