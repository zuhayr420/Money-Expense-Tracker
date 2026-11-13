from flask import Blueprint, request, jsonify, g
from models import db, User, Family, FamilyMember
from utils.auth import token_required
import jwt
import os
from datetime import datetime, timedelta, timezone

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        username=data['username'],
        email=data['email'],
        full_name=data.get('full_name', data['username']),
        currency=data.get('currency', 'INR'),
        currency_symbol=data.get('currency_symbol', '₹')
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.flush()

    # Automatically create their own Family group
    fam_name = data.get('family_name') or f"{user.full_name}'s Family"
    family = Family(name=fam_name, created_by=user.id, monthly_budget=0)
    db.session.add(family)
    db.session.flush()

    # Add user as admin of their family
    member = FamilyMember(family_id=family.id, user_id=user.id, role='admin', spending_limit=0)
    db.session.add(member)
    db.session.commit()

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }, os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-finance-app-family-management-platform-2024-secure-token'), algorithm='HS256')

    return jsonify({'token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }, os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-finance-app-family-management-platform-2024-secure-token'), algorithm='HS256')

    return jsonify({'token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    return jsonify({'user': g.current_user.to_dict()}), 200


@auth_bp.route('/profile', methods=['PUT', 'POST'])
@token_required
def update_profile():
    data = request.get_json() or {}
    user = g.current_user

    if 'full_name' in data and data['full_name']:
        user.full_name = data['full_name'].strip()
    if 'email' in data and data['email']:
        existing = User.query.filter(User.email == data['email'].strip(), User.id != user.id).first()
        if existing:
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email'].strip()
    if 'currency' in data:
        user.currency = data['currency']
    if 'currency_symbol' in data:
        user.currency_symbol = data['currency_symbol']
    if 'avatar_color' in data:
        user.avatar_color = data['avatar_color']
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200
    return jsonify({'user': user.to_dict()}), 200
