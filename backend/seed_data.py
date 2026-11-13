from models import db, User, Family, FamilyMember, Account, Transaction, Budget, Goal, GoalContribution, Bill
from datetime import date, datetime, timedelta


def seed_database():
    """Create comprehensive seed data for the Family Finance app."""

    # ─────────────────────────────────────────────
    # 1.  DEMO USER
    # ─────────────────────────────────────────────
    demo = User(
        username='demo',
        email='rahul.sharma@email.com',
        full_name='Rahul Sharma',
        avatar_color='#3b82f6',
        currency='INR',
        currency_symbol='₹'
    )
    demo.set_password('demo123')
    db.session.add(demo)
    db.session.flush()

    # Additional family member users
    priya = User(username='priya', email='priya.sharma@email.com', full_name='Priya Sharma', avatar_color='#ec4899')
    priya.set_password('priya123')
    db.session.add(priya)
    db.session.flush()

    aman = User(username='aman', email='aman.sharma@email.com', full_name='Aman Sharma', avatar_color='#22c55e')
    aman.set_password('aman123')
    db.session.add(aman)
    db.session.flush()

    anjali = User(username='anjali', email='anjali.sharma@email.com', full_name='Anjali Sharma', avatar_color='#f59e0b')
    anjali.set_password('anjali123')
    db.session.add(anjali)
    db.session.flush()

    # ─────────────────────────────────────────────
    # 2.  ACCOUNTS
    # ─────────────────────────────────────────────
    hdfc = Account(user_id=demo.id, name='HDFC Savings', account_type='savings', balance=185450.0, icon='building', color='#3b82f6')
    icici = Account(user_id=demo.id, name='ICICI Current', account_type='current', balance=92300.0, icon='briefcase', color='#ef4444')
    cash = Account(user_id=demo.id, name='Cash Wallet', account_type='cash', balance=8750.0, icon='wallet', color='#22c55e')
    sbi_cc = Account(user_id=demo.id, name='SBI Credit Card', account_type='credit_card', balance=-24500.0, icon='credit-card', color='#f97316')
    joint = Account(user_id=demo.id, name='Joint Family Account', account_type='joint', balance=145000.0, icon='users', color='#8b5cf6')

    db.session.add_all([hdfc, icici, cash, sbi_cc, joint])
    db.session.flush()

    # ─────────────────────────────────────────────
    # 3.  FAMILY
    # ─────────────────────────────────────────────
    family = Family(name='Sharma Family', created_by=demo.id, monthly_budget=120000)
    db.session.add(family)
    db.session.flush()

    fm1 = FamilyMember(family_id=family.id, user_id=demo.id, role='admin', spending_limit=50000)
    fm2 = FamilyMember(family_id=family.id, user_id=priya.id, role='member', spending_limit=35000)
    fm3 = FamilyMember(family_id=family.id, user_id=aman.id, role='member', spending_limit=20000)
    fm4 = FamilyMember(family_id=family.id, user_id=anjali.id, role='viewer', spending_limit=15000)
    db.session.add_all([fm1, fm2, fm3, fm4])

    # ─────────────────────────────────────────────
    # 4.  TRANSACTIONS – 3 months of data
    #     Nov 2026, Oct 2026, Sep 2026
    # ─────────────────────────────────────────────
    transactions = []

    # ====== NOVEMBER 2026 ======
    # Income
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Salary', amount=85000, description='Monthly salary - Rahul', date=date(2026, 11, 1), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Salary', amount=45000, description='Monthly salary - Priya', date=date(2026, 11, 1), payment_method='bank_transfer', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=icici.id, type='income', category='Freelance', amount=12000, description='Freelance web development project', date=date(2026, 11, 5), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Investment', amount=3500, description='Mutual fund dividend', date=date(2026, 11, 8), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))

    # Rent
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Housing', amount=18000, description='Monthly rent - November', date=date(2026, 11, 1), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))

    # Groceries
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=3200, description='Weekly groceries - vegetables & fruits', date=date(2026, 11, 2), payment_method='cash', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Food', amount=4500, description='Monthly groceries - BigBasket order', date=date(2026, 11, 7), payment_method='credit_card', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=2800, description='Weekly groceries - dairy & staples', date=date(2026, 11, 9), payment_method='cash', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=1500, description='Fruits and snacks', date=date(2026, 11, 11), payment_method='cash', status='completed', family_member_name='Anjali Sharma'))

    # Shopping
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Shopping', amount=6500, description='Diwali shopping - clothes from Myntra', date=date(2026, 11, 3), payment_method='credit_card', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Shopping', amount=3200, description='Amazon order - electronics accessories', date=date(2026, 11, 6), payment_method='credit_card', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Shopping', amount=2100, description='Home decor items - Flipkart', date=date(2026, 11, 10), payment_method='credit_card', status='completed', family_member_name='Priya Sharma'))

    # Transport
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Transport', amount=2500, description='Petrol for car', date=date(2026, 11, 3), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Transport', amount=850, description='Ola/Uber rides', date=date(2026, 11, 5), payment_method='upi', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Transport', amount=600, description='Metro card recharge', date=date(2026, 11, 8), payment_method='cash', status='completed', family_member_name='Aman Sharma'))

    # Entertainment
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Entertainment', amount=1200, description='PVR movie tickets - family outing', date=date(2026, 11, 4), payment_method='credit_card', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Entertainment', amount=800, description='Restaurant dinner - Barbeque Nation', date=date(2026, 11, 7), payment_method='cash', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Entertainment', amount=1500, description='Weekend bowling outing', date=date(2026, 11, 9), payment_method='credit_card', status='completed', family_member_name='Aman Sharma'))

    # Healthcare
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Healthcare', amount=1800, description='Doctor visit - general check up', date=date(2026, 11, 4), payment_method='upi', status='completed', family_member_name='Anjali Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Healthcare', amount=950, description='Pharmacy - monthly medicines', date=date(2026, 11, 6), payment_method='cash', status='completed', family_member_name='Anjali Sharma'))

    # Education
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Education', amount=4500, description='Aman school tuition fee', date=date(2026, 11, 5), payment_method='bank_transfer', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Education', amount=1200, description='Online course - Udemy', date=date(2026, 11, 8), payment_method='credit_card', status='completed', family_member_name='Rahul Sharma'))

    # Utilities
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=2500, description='Electricity bill - November', date=date(2026, 11, 5), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=999, description='Internet bill - Airtel Fiber', date=date(2026, 11, 5), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=599, description='Phone bill - Jio', date=date(2026, 11, 6), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))

    # ====== OCTOBER 2026 ======
    # Income
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Salary', amount=85000, description='Monthly salary - Rahul', date=date(2026, 10, 1), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Salary', amount=45000, description='Monthly salary - Priya', date=date(2026, 10, 1), payment_method='bank_transfer', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=icici.id, type='income', category='Freelance', amount=8000, description='Logo design project', date=date(2026, 10, 12), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Investment', amount=2800, description='FD interest credit', date=date(2026, 10, 15), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))

    # Rent
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Housing', amount=18000, description='Monthly rent - October', date=date(2026, 10, 1), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))

    # Groceries
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=3500, description='Weekly groceries - vegetables', date=date(2026, 10, 3), payment_method='cash', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Food', amount=4200, description='Monthly groceries - D-Mart', date=date(2026, 10, 8), payment_method='credit_card', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=2600, description='Weekly groceries - fruits and dairy', date=date(2026, 10, 15), payment_method='cash', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=1800, description='Snacks and beverages', date=date(2026, 10, 22), payment_method='cash', status='completed', family_member_name='Anjali Sharma'))

    # Shopping
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Shopping', amount=4500, description='New shoes - Nike store', date=date(2026, 10, 5), payment_method='credit_card', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Shopping', amount=3800, description='Kitchen appliances - Croma', date=date(2026, 10, 10), payment_method='credit_card', status='completed', family_member_name='Priya Sharma'))

    # Transport
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Transport', amount=2200, description='Petrol', date=date(2026, 10, 4), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Transport', amount=1200, description='Cab rides for the week', date=date(2026, 10, 11), payment_method='upi', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Transport', amount=600, description='Metro recharge', date=date(2026, 10, 18), payment_method='cash', status='completed', family_member_name='Aman Sharma'))

    # Entertainment
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Entertainment', amount=2200, description='Concert tickets', date=date(2026, 10, 6), payment_method='credit_card', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Entertainment', amount=1500, description='Family dinner at Haldirams', date=date(2026, 10, 14), payment_method='cash', status='completed', family_member_name='Rahul Sharma'))

    # Healthcare
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Healthcare', amount=3200, description='Dental treatment - Anjali', date=date(2026, 10, 7), payment_method='upi', status='completed', family_member_name='Anjali Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Healthcare', amount=750, description='Pharmacy', date=date(2026, 10, 20), payment_method='cash', status='completed', family_member_name='Anjali Sharma'))

    # Education
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Education', amount=4500, description='Aman school fee - October', date=date(2026, 10, 5), payment_method='bank_transfer', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Education', amount=2500, description='Books and stationery', date=date(2026, 10, 9), payment_method='credit_card', status='completed', family_member_name='Aman Sharma'))

    # Utilities
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=2200, description='Electricity bill - October', date=date(2026, 10, 5), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=999, description='Internet bill - Airtel', date=date(2026, 10, 5), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=599, description='Phone bill', date=date(2026, 10, 7), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))

    # Insurance
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Insurance', amount=3500, description='Life insurance premium', date=date(2026, 10, 10), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))

    # Fitness
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Fitness', amount=2000, description='Gym membership', date=date(2026, 10, 1), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))

    # ====== SEPTEMBER 2026 ======
    # Income
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Salary', amount=85000, description='Monthly salary - Rahul', date=date(2026, 9, 1), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Salary', amount=45000, description='Monthly salary - Priya', date=date(2026, 9, 1), payment_method='bank_transfer', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=icici.id, type='income', category='Freelance', amount=15000, description='Mobile app consulting', date=date(2026, 9, 10), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Investment', amount=4200, description='Stock dividend - TCS', date=date(2026, 9, 20), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='income', category='Other Income', amount=5000, description='Gift from relatives', date=date(2026, 9, 15), payment_method='cash', status='completed', family_member_name='Rahul Sharma'))

    # Rent
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Housing', amount=18000, description='Monthly rent - September', date=date(2026, 9, 1), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))

    # Groceries
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=3800, description='Weekly groceries', date=date(2026, 9, 4), payment_method='cash', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Food', amount=3900, description='Monthly grocery haul - Zepto', date=date(2026, 9, 10), payment_method='credit_card', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=2500, description='Fruits, dairy, eggs', date=date(2026, 9, 17), payment_method='cash', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Food', amount=1400, description='Snacks for kids', date=date(2026, 9, 24), payment_method='cash', status='completed', family_member_name='Anjali Sharma'))

    # Shopping
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Shopping', amount=5200, description='Furniture - small bookshelf', date=date(2026, 9, 6), payment_method='credit_card', status='completed', family_member_name='Priya Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Shopping', amount=2800, description='Clothes - Ajio sale', date=date(2026, 9, 14), payment_method='credit_card', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Shopping', amount=1500, description='Stationery and school supplies', date=date(2026, 9, 20), payment_method='cash', status='completed', family_member_name='Aman Sharma'))

    # Transport
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Transport', amount=2800, description='Petrol', date=date(2026, 9, 5), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Transport', amount=1100, description='Auto and cab rides', date=date(2026, 9, 12), payment_method='cash', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Transport', amount=600, description='Metro card', date=date(2026, 9, 19), payment_method='cash', status='completed', family_member_name='Aman Sharma'))

    # Entertainment
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Entertainment', amount=1800, description='Bowling and pizza outing', date=date(2026, 9, 7), payment_method='credit_card', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Entertainment', amount=2200, description='Weekend trip expenses', date=date(2026, 9, 21), payment_method='cash', status='completed', family_member_name='Rahul Sharma'))

    # Healthcare
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Healthcare', amount=1500, description='Eye checkup - Anjali', date=date(2026, 9, 8), payment_method='upi', status='completed', family_member_name='Anjali Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=cash.id, type='expense', category='Healthcare', amount=600, description='Pharmacy', date=date(2026, 9, 16), payment_method='cash', status='completed', family_member_name='Anjali Sharma'))

    # Education
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Education', amount=4500, description='Aman school fee - September', date=date(2026, 9, 5), payment_method='bank_transfer', status='completed', family_member_name='Aman Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Education', amount=1800, description='Coding bootcamp monthly', date=date(2026, 9, 10), payment_method='credit_card', status='completed', family_member_name='Rahul Sharma'))

    # Utilities
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=2800, description='Electricity bill - September', date=date(2026, 9, 5), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=999, description='Internet bill', date=date(2026, 9, 5), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Utilities', amount=599, description='Phone bill', date=date(2026, 9, 7), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))

    # Insurance
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Insurance', amount=3500, description='Life insurance premium', date=date(2026, 9, 10), payment_method='bank_transfer', status='completed', family_member_name='Rahul Sharma'))

    # Fitness
    transactions.append(Transaction(user_id=demo.id, account_id=hdfc.id, type='expense', category='Fitness', amount=2000, description='Gym membership - September', date=date(2026, 9, 1), payment_method='upi', status='completed', family_member_name='Rahul Sharma'))

    # Subscriptions in September
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Entertainment', amount=649, description='Netflix subscription', date=date(2026, 9, 3), payment_method='credit_card', status='completed', family_member_name='Rahul Sharma'))
    transactions.append(Transaction(user_id=demo.id, account_id=sbi_cc.id, type='expense', category='Entertainment', amount=119, description='Spotify subscription', date=date(2026, 9, 3), payment_method='credit_card', status='completed', family_member_name='Aman Sharma'))

    db.session.add_all(transactions)

    # ─────────────────────────────────────────────
    # 5.  BUDGETS – November 2026
    # ─────────────────────────────────────────────
    budgets = [
        Budget(user_id=demo.id, category='Food', allocated=12000, month=11, year=2026),
        Budget(user_id=demo.id, category='Shopping', allocated=8000, month=11, year=2026),
        Budget(user_id=demo.id, category='Transport', allocated=5000, month=11, year=2026),
        Budget(user_id=demo.id, category='Entertainment', allocated=4000, month=11, year=2026),
        Budget(user_id=demo.id, category='Healthcare', allocated=3000, month=11, year=2026),
        Budget(user_id=demo.id, category='Education', allocated=6000, month=11, year=2026),
    ]
    db.session.add_all(budgets)

    # ─────────────────────────────────────────────
    # 6.  SAVINGS GOALS
    # ─────────────────────────────────────────────
    goal1 = Goal(user_id=demo.id, name='Emergency Fund', target_amount=500000, current_amount=235000, target_date=date(2027, 12, 31), icon='shield', color='#ef4444', status='active')
    goal2 = Goal(user_id=demo.id, name='New Car', target_amount=800000, current_amount=350000, target_date=date(2028, 6, 30), icon='car', color='#3b82f6', status='active')
    goal3 = Goal(user_id=demo.id, name='Vacation', target_amount=150000, current_amount=85000, target_date=date(2027, 5, 15), icon='plane', color='#22c55e', status='active')
    goal4 = Goal(user_id=demo.id, name='House Down Payment', target_amount=2000000, current_amount=600000, target_date=date(2029, 12, 31), icon='home', color='#f59e0b', status='active')
    goal5 = Goal(user_id=demo.id, name='Kids Education', target_amount=1000000, current_amount=450000, target_date=date(2030, 6, 30), icon='graduation-cap', color='#8b5cf6', status='active')

    db.session.add_all([goal1, goal2, goal3, goal4, goal5])
    db.session.flush()

    # Goal contributions
    contributions = [
        GoalContribution(goal_id=goal1.id, amount=25000, date=date(2026, 9, 5), note='Monthly SIP contribution'),
        GoalContribution(goal_id=goal1.id, amount=25000, date=date(2026, 10, 5), note='Monthly SIP contribution'),
        GoalContribution(goal_id=goal1.id, amount=25000, date=date(2026, 11, 5), note='Monthly SIP contribution'),
        GoalContribution(goal_id=goal2.id, amount=30000, date=date(2026, 9, 10), note='Monthly car fund'),
        GoalContribution(goal_id=goal2.id, amount=30000, date=date(2026, 10, 10), note='Monthly car fund'),
        GoalContribution(goal_id=goal2.id, amount=35000, date=date(2026, 11, 10), note='Monthly car fund + bonus'),
        GoalContribution(goal_id=goal3.id, amount=15000, date=date(2026, 9, 15), note='Vacation savings'),
        GoalContribution(goal_id=goal3.id, amount=15000, date=date(2026, 10, 15), note='Vacation savings'),
        GoalContribution(goal_id=goal3.id, amount=10000, date=date(2026, 11, 8), note='Vacation savings'),
        GoalContribution(goal_id=goal4.id, amount=50000, date=date(2026, 9, 1), note='House fund deposit'),
        GoalContribution(goal_id=goal4.id, amount=50000, date=date(2026, 10, 1), note='House fund deposit'),
        GoalContribution(goal_id=goal4.id, amount=50000, date=date(2026, 11, 1), note='House fund deposit'),
        GoalContribution(goal_id=goal5.id, amount=40000, date=date(2026, 9, 20), note='Education fund - RD'),
        GoalContribution(goal_id=goal5.id, amount=40000, date=date(2026, 10, 20), note='Education fund - RD'),
        GoalContribution(goal_id=goal5.id, amount=40000, date=date(2026, 11, 5), note='Education fund - RD'),
    ]
    db.session.add_all(contributions)

    # ─────────────────────────────────────────────
    # 7.  BILLS & SUBSCRIPTIONS
    # ─────────────────────────────────────────────
    bills = [
        Bill(user_id=demo.id, name='Rent', amount=18000, category='Housing', due_date=date(2026, 12, 1), is_recurring=True, recurrence='monthly', status='pending', auto_pay=False),
        Bill(user_id=demo.id, name='Electricity Bill', amount=2500, category='Utilities', due_date=date(2026, 11, 25), is_recurring=True, recurrence='monthly', status='pending', auto_pay=False),
        Bill(user_id=demo.id, name='Airtel Internet', amount=999, category='Utilities', due_date=date(2026, 11, 20), is_recurring=True, recurrence='monthly', status='paid', auto_pay=True),
        Bill(user_id=demo.id, name='Netflix', amount=649, category='Entertainment', due_date=date(2026, 11, 15), is_recurring=True, recurrence='monthly', status='paid', auto_pay=True),
        Bill(user_id=demo.id, name='Spotify', amount=119, category='Entertainment', due_date=date(2026, 11, 15), is_recurring=True, recurrence='monthly', status='paid', auto_pay=True),
        Bill(user_id=demo.id, name='Life Insurance Premium', amount=3500, category='Insurance', due_date=date(2026, 12, 10), is_recurring=True, recurrence='monthly', status='pending', auto_pay=False),
        Bill(user_id=demo.id, name='Gym Membership', amount=2000, category='Fitness', due_date=date(2026, 12, 1), is_recurring=True, recurrence='monthly', status='pending', auto_pay=True),
        Bill(user_id=demo.id, name='Jio Phone Bill', amount=599, category='Utilities', due_date=date(2026, 11, 28), is_recurring=True, recurrence='monthly', status='pending', auto_pay=False),
    ]
    db.session.add_all(bills)

    db.session.commit()
    print('[+] Seed data created successfully!')
    print(f'   Demo user: username=demo, password=demo123')
    print(f'   {len(transactions)} transactions across 3 months')
    print(f'   {len(budgets)} budget categories')
    print(f'   5 savings goals')
    print(f'   {len(bills)} bills/subscriptions')


if __name__ == '__main__':
    from app import app
    with app.app_context():
        db.create_all()
        existing = User.query.filter_by(username='demo').first()
        if existing:
            print("Resetting and reseeding demo database...")
            db.drop_all()
            db.create_all()
        seed_database()

