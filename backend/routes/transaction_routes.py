from flask import Blueprint, request, jsonify, g
from models import db, Transaction, Account
from utils.auth import token_required
from datetime import datetime, date
from sqlalchemy import func, and_

transaction_bp = Blueprint('transactions', __name__)


@transaction_bp.route('', methods=['GET'])
@token_required
def get_transactions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    tx_type = request.args.get('type')
    category = request.args.get('category')
    account_id = request.args.get('account_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    search = request.args.get('search')
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'desc')
    family_member = request.args.get('family_member')

    query = Transaction.query.filter_by(user_id=g.current_user.id)

    if tx_type:
        query = query.filter(Transaction.type == tx_type)
    if category:
        query = query.filter(Transaction.category == category)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if family_member:
        query = query.filter(Transaction.family_member_name == family_member)
    if start_date:
        try:
            sd = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Transaction.date >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Transaction.date <= ed)
        except ValueError:
            pass
    if search:
        query = query.filter(Transaction.description.ilike(f'%{search}%'))

    if sort_by == 'amount':
        order_col = Transaction.amount
    elif sort_by == 'category':
        order_col = Transaction.category
    else:
        order_col = Transaction.date

    if sort_order == 'asc':
        query = query.order_by(order_col.asc(), Transaction.id.asc())
    else:
        query = query.order_by(order_col.desc(), Transaction.id.desc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'transactions': [t.to_dict() for t in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': paginated.page,
        'per_page': per_page,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev
    }), 200


@transaction_bp.route('/<int:transaction_id>', methods=['GET'])
@token_required
def get_transaction(transaction_id):
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=g.current_user.id).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    return jsonify({'transaction': transaction.to_dict()}), 200


@transaction_bp.route('', methods=['POST'])
@token_required
def create_transaction():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['account_id', 'type', 'category', 'amount', 'description']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400

    if data['type'] not in ('income', 'expense'):
        return jsonify({'error': 'Type must be income or expense'}), 400

    account = Account.query.filter_by(id=data['account_id'], user_id=g.current_user.id).first()
    if not account:
        return jsonify({'error': 'Account not found'}), 404

    tx_date = date.today()
    if data.get('date'):
        try:
            tx_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    transaction = Transaction(
        user_id=g.current_user.id,
        account_id=data['account_id'],
        type=data['type'],
        category=data['category'],
        amount=float(data['amount']),
        description=data['description'],
        date=tx_date,
        payment_method=data.get('payment_method', 'cash'),
        status=data.get('status', 'completed'),
        family_member_name=data.get('family_member_name', '')
    )

    # Update account balance
    if transaction.status == 'completed':
        if transaction.type == 'income':
            account.balance += transaction.amount
        else:
            account.balance -= transaction.amount

    db.session.add(transaction)
    db.session.commit()
    return jsonify({'transaction': transaction.to_dict()}), 201


@transaction_bp.route('/<int:transaction_id>', methods=['PUT'])
@token_required
def update_transaction(transaction_id):
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=g.current_user.id).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    old_amount = transaction.amount
    old_type = transaction.type
    old_account_id = transaction.account_id
    old_status = transaction.status

    # Reverse the old balance change if old status was completed
    old_account = Account.query.get(old_account_id)
    if old_account and old_status == 'completed':
        if old_type == 'income':
            old_account.balance -= old_amount
        else:
            old_account.balance += old_amount

    # Apply updates
    if 'type' in data:
        transaction.type = data['type']
    if 'category' in data:
        transaction.category = data['category']
    if 'amount' in data:
        transaction.amount = float(data['amount'])
    if 'description' in data:
        transaction.description = data['description']
    if 'date' in data:
        try:
            transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    if 'payment_method' in data:
        transaction.payment_method = data['payment_method']
    if 'status' in data:
        transaction.status = data['status']
    if 'family_member_name' in data:
        transaction.family_member_name = data['family_member_name']
    if 'account_id' in data:
        new_account = Account.query.filter_by(id=data['account_id'], user_id=g.current_user.id).first()
        if not new_account:
            return jsonify({'error': 'New account not found'}), 404
        transaction.account_id = data['account_id']

    # Apply the new balance change if new status is completed
    new_account = Account.query.get(transaction.account_id)
    if new_account and transaction.status == 'completed':
        if transaction.type == 'income':
            new_account.balance += transaction.amount
        else:
            new_account.balance -= transaction.amount

    db.session.commit()
    return jsonify({'transaction': transaction.to_dict()}), 200


@transaction_bp.route('/<int:transaction_id>', methods=['DELETE'])
@token_required
def delete_transaction(transaction_id):
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=g.current_user.id).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404

    # Reverse balance change if transaction was completed
    if transaction.status == 'completed':
        account = Account.query.get(transaction.account_id)
        if account:
            if transaction.type == 'income':
                account.balance -= transaction.amount
            else:
                account.balance += transaction.amount

    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': 'Transaction deleted'}), 200


@transaction_bp.route('/categories', methods=['GET'])
@token_required
def get_categories():
    tx_type = request.args.get('type')
    query = db.session.query(Transaction.category).filter_by(user_id=g.current_user.id)
    if tx_type:
        query = query.filter(Transaction.type == tx_type)
    categories = query.distinct().all()
    return jsonify({'categories': [c[0] for c in categories]}), 200


@transaction_bp.route('/summary', methods=['GET'])
@token_required
def get_transaction_summary():
    today = date.today()
    first_of_month = today.replace(day=1)

    month_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'income',
        Transaction.status == 'completed',
        Transaction.date >= first_of_month,
        Transaction.date <= today
    ).scalar()

    month_expense = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= first_of_month,
        Transaction.date <= today
    ).scalar()

    total_transactions = Transaction.query.filter(
        Transaction.user_id == g.current_user.id,
        Transaction.date >= first_of_month,
        Transaction.date <= today
    ).count()

    return jsonify({
        'monthly_income': float(month_income),
        'monthly_expense': float(month_expense),
        'net': float(month_income) - float(month_expense),
        'total_transactions': total_transactions
    }), 200
