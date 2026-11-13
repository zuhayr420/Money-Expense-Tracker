from flask import Blueprint, request, jsonify, g
from models import db, Account, Transaction
from utils.auth import token_required

account_bp = Blueprint('accounts', __name__)


@account_bp.route('', methods=['GET'])
@token_required
def get_accounts():
    accounts = Account.query.filter_by(user_id=g.current_user.id, is_active=True).all()
    return jsonify({'accounts': [a.to_dict() for a in accounts]}), 200


@account_bp.route('', methods=['POST'])
@token_required
def create_account():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('account_type'):
        return jsonify({'error': 'Missing required fields'}), 400

    account = Account(
        user_id=g.current_user.id,
        name=data['name'],
        account_type=data['account_type'],
        balance=data.get('balance', 0),
        icon=data.get('icon', 'wallet'),
        color=data.get('color', '#4ade80')
    )
    db.session.add(account)
    db.session.commit()
    return jsonify({'account': account.to_dict()}), 201


@account_bp.route('/<int:account_id>', methods=['GET'])
@token_required
def get_account(account_id):
    account = Account.query.filter_by(id=account_id, user_id=g.current_user.id).first()
    if not account:
        return jsonify({'error': 'Account not found'}), 404

    transactions = Transaction.query.filter_by(account_id=account_id).order_by(Transaction.date.desc()).limit(10).all()
    result = account.to_dict()
    result['recent_transactions'] = [t.to_dict() for t in transactions]
    return jsonify({'account': result}), 200


@account_bp.route('/<int:account_id>', methods=['PUT'])
@token_required
def update_account(account_id):
    account = Account.query.filter_by(id=account_id, user_id=g.current_user.id).first()
    if not account:
        return jsonify({'error': 'Account not found'}), 404

    data = request.get_json()
    if 'name' in data:
        account.name = data['name']
    if 'account_type' in data:
        account.account_type = data['account_type']
    if 'balance' in data:
        account.balance = data['balance']
    if 'icon' in data:
        account.icon = data['icon']
    if 'color' in data:
        account.color = data['color']

    db.session.commit()
    return jsonify({'account': account.to_dict()}), 200


@account_bp.route('/<int:account_id>', methods=['DELETE'])
@token_required
def delete_account(account_id):
    account = Account.query.filter_by(id=account_id, user_id=g.current_user.id).first()
    if not account:
        return jsonify({'error': 'Account not found'}), 404

    account.is_active = False
    db.session.commit()
    return jsonify({'message': 'Account deleted'}), 200
