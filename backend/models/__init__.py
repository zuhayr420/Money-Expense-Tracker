from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date, timezone
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    avatar_color = db.Column(db.String(7), default='#4ade80')
    currency = db.Column(db.String(10), default='INR')
    currency_symbol = db.Column(db.String(5), default='₹')
    created_at = db.Column(db.DateTime, default=utcnow)

    # Relationships
    accounts = db.relationship('Account', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    budgets = db.relationship('Budget', backref='user', lazy=True, cascade='all, delete-orphan')
    goals = db.relationship('Goal', backref='user', lazy=True, cascade='all, delete-orphan')
    bills = db.relationship('Bill', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'avatar_color': self.avatar_color,
            'currency': self.currency,
            'currency_symbol': self.currency_symbol,
            'created_at': self.created_at.isoformat()
        }


class Family(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)
    monthly_budget = db.Column(db.Float, default=0)

    members = db.relationship('FamilyMember', backref='family', lazy=True, cascade='all, delete-orphan')
    creator = db.relationship('User', backref='created_families')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_by': self.created_by,
            'monthly_budget': self.monthly_budget,
            'created_at': self.created_at.isoformat(),
            'members': [m.to_dict() for m in self.members]
        }


class FamilyMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('family.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), default='member')  # admin, member, viewer
    spending_limit = db.Column(db.Float, default=0)
    joined_at = db.Column(db.DateTime, default=utcnow)

    user = db.relationship('User', backref='family_memberships')

    def to_dict(self):
        return {
            'id': self.id,
            'family_id': self.family_id,
            'user_id': self.user_id,
            'role': self.role,
            'spending_limit': self.spending_limit,
            'joined_at': self.joined_at.isoformat(),
            'user': self.user.to_dict() if self.user else None
        }


class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # savings, current, cash, credit_card, joint
    balance = db.Column(db.Float, default=0)
    icon = db.Column(db.String(50), default='wallet')
    color = db.Column(db.String(7), default='#4ade80')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    transactions = db.relationship('Transaction', backref='account', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'account_type': self.account_type,
            'balance': self.balance,
            'icon': self.icon,
            'color': self.color,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False, index=True)
    type = db.Column(db.String(20), nullable=False, index=True)  # income, expense
    category = db.Column(db.String(50), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    payment_method = db.Column(db.String(50), default='cash')
    status = db.Column(db.String(20), default='completed', index=True)  # completed, pending, failed
    family_member_name = db.Column(db.String(120), default='')
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'account_id': self.account_id,
            'type': self.type,
            'category': self.category,
            'amount': self.amount,
            'description': self.description,
            'date': self.date.isoformat(),
            'payment_method': self.payment_method,
            'status': self.status,
            'family_member_name': self.family_member_name,
            'created_at': self.created_at.isoformat(),
            'account_name': self.account.name if self.account else None
        }


class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False)
    allocated = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False, index=True)
    year = db.Column(db.Integer, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category,
            'allocated': self.allocated,
            'month': self.month,
            'year': self.year,
            'created_at': self.created_at.isoformat()
        }


class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0)
    target_date = db.Column(db.Date, nullable=True)
    icon = db.Column(db.String(50), default='target')
    color = db.Column(db.String(7), default='#4ade80')
    status = db.Column(db.String(20), default='active', index=True)  # active, completed, paused
    created_at = db.Column(db.DateTime, default=utcnow)

    contributions = db.relationship('GoalContribution', backref='goal', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'target_amount': self.target_amount,
            'current_amount': self.current_amount,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'icon': self.icon,
            'color': self.color,
            'status': self.status,
            'progress': round((self.current_amount / self.target_amount * 100), 1) if self.target_amount > 0 else 0,
            'created_at': self.created_at.isoformat()
        }


class GoalContribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('goal.id'), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=date.today)
    note = db.Column(db.String(255), default='')

    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'amount': self.amount,
            'date': self.date.isoformat(),
            'note': self.note
        }


class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    due_date = db.Column(db.Date, nullable=False, index=True)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence = db.Column(db.String(20), default='monthly')  # weekly, monthly, quarterly, yearly
    status = db.Column(db.String(20), default='pending', index=True)  # paid, pending, overdue
    auto_pay = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'amount': self.amount,
            'category': self.category,
            'due_date': self.due_date.isoformat(),
            'is_recurring': self.is_recurring,
            'recurrence': self.recurrence,
            'status': self.status,
            'auto_pay': self.auto_pay,
            'created_at': self.created_at.isoformat()
        }


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=True, index=True)
    cardholder_name = db.Column(db.String(120), nullable=False)
    card_number = db.Column(db.String(30), nullable=False)
    expiry_date = db.Column(db.String(10), nullable=False)
    card_label = db.Column(db.String(80), default='Verdela Card')
    network = db.Column(db.String(30), default='mastercard')  # mastercard, visa, amex, rupay
    color_theme = db.Column(db.String(30), default='emerald')  # emerald, obsidian, royal, gold
    is_locked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    account = db.relationship('Account', backref='cards')

    def to_dict(self):
        clean_num = ''.join(c for c in self.card_number if c.isdigit())
        last4 = clean_num[-4:] if len(clean_num) >= 4 else clean_num
        masked = f"••••  ••••  ••••  {last4}" if len(clean_num) >= 4 else (self.card_number or '••••  ••••  ••••  ••••')
        formatted_chunks = [clean_num[i:i+4] for i in range(0, len(clean_num), 4)]
        formatted = "  ".join(formatted_chunks) if formatted_chunks else self.card_number

        return {
            'id': self.id,
            'user_id': self.user_id,
            'account_id': self.account_id,
            'cardholder_name': self.cardholder_name,
            'card_number': self.card_number,
            'card_number_masked': masked,
            'card_number_formatted': formatted,
            'last4': last4,
            'expiry_date': self.expiry_date,
            'card_label': self.card_label or 'Verdela Card',
            'network': self.network or 'mastercard',
            'color_theme': self.color_theme or 'emerald',
            'is_locked': self.is_locked,
            'created_at': self.created_at.isoformat()
        }

