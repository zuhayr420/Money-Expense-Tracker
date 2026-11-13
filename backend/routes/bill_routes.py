from flask import Blueprint, request, jsonify, g
from models import db, Bill
from utils.auth import token_required
from datetime import datetime, date

bill_bp = Blueprint('bills', __name__)


@bill_bp.route('', methods=['GET'])
@token_required
def get_bills():
    status = request.args.get('status')
    category = request.args.get('category')
    is_recurring = request.args.get('is_recurring')

    query = Bill.query.filter_by(user_id=g.current_user.id)

    if status:
        query = query.filter(Bill.status == status)
    if category:
        query = query.filter(Bill.category == category)
    if is_recurring is not None:
        query = query.filter(Bill.is_recurring == (is_recurring.lower() == 'true'))

    bills = query.order_by(Bill.due_date.asc()).all()

    # Compute summary stats
    total_monthly = sum(b.amount for b in bills if b.is_recurring and b.recurrence == 'monthly')
    total_pending = sum(b.amount for b in bills if b.status == 'pending')
    total_overdue = sum(b.amount for b in bills if b.status == 'overdue')
    upcoming_count = sum(1 for b in bills if b.status == 'pending' and b.due_date >= date.today())

    return jsonify({
        'bills': [b.to_dict() for b in bills],
        'summary': {
            'total_monthly': total_monthly,
            'total_pending': total_pending,
            'total_overdue': total_overdue,
            'upcoming_count': upcoming_count
        }
    }), 200


@bill_bp.route('', methods=['POST'])
@token_required
def create_bill():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['name', 'amount', 'category', 'due_date']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400

    try:
        due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    bill = Bill(
        user_id=g.current_user.id,
        name=data['name'],
        amount=float(data['amount']),
        category=data['category'],
        due_date=due_date,
        is_recurring=data.get('is_recurring', False),
        recurrence=data.get('recurrence', 'monthly'),
        status=data.get('status', 'pending'),
        auto_pay=data.get('auto_pay', False)
    )

    db.session.add(bill)
    db.session.commit()
    return jsonify({'bill': bill.to_dict()}), 201


@bill_bp.route('/<int:bill_id>', methods=['GET'])
@token_required
def get_bill(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=g.current_user.id).first()
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404
    return jsonify({'bill': bill.to_dict()}), 200


@bill_bp.route('/<int:bill_id>', methods=['PUT'])
@token_required
def update_bill(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=g.current_user.id).first()
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'name' in data:
        bill.name = data['name']
    if 'amount' in data:
        bill.amount = float(data['amount'])
    if 'category' in data:
        bill.category = data['category']
    if 'due_date' in data:
        try:
            bill.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    if 'is_recurring' in data:
        bill.is_recurring = data['is_recurring']
    if 'recurrence' in data:
        bill.recurrence = data['recurrence']
    if 'status' in data:
        bill.status = data['status']
    if 'auto_pay' in data:
        bill.auto_pay = data['auto_pay']

    db.session.commit()
    return jsonify({'bill': bill.to_dict()}), 200


@bill_bp.route('/<int:bill_id>', methods=['DELETE'])
@token_required
def delete_bill(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=g.current_user.id).first()
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404

    db.session.delete(bill)
    db.session.commit()
    return jsonify({'message': 'Bill deleted'}), 200


@bill_bp.route('/<int:bill_id>/pay', methods=['POST'])
@token_required
def mark_paid(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=g.current_user.id).first()
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404

    bill.status = 'paid'
    db.session.commit()
    return jsonify({'bill': bill.to_dict(), 'message': 'Bill marked as paid'}), 200


@bill_bp.route('/<int:bill_id>/unpay', methods=['POST'])
@token_required
def mark_unpaid(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=g.current_user.id).first()
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404

    if bill.due_date < date.today():
        bill.status = 'overdue'
    else:
        bill.status = 'pending'

    db.session.commit()
    return jsonify({'bill': bill.to_dict(), 'message': 'Bill marked as unpaid'}), 200
