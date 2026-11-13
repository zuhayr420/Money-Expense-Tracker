import jwt
import os
from functools import wraps
from flask import request, jsonify, g
from models import User


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(
                token,
                os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-finance-app-family-management-platform-2024-secure-token'),
                algorithms=['HS256']
            )
            from models import db
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
            g.current_user = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated
