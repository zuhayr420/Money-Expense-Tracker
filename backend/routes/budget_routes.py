from flask import Blueprint, request, jsonify, g
from models import db, Budget, Transaction
from utils.auth import token_required
from datetime import datetime, date
from sqlalchemy import func

budget_bp = Blueprint('budgets', __name__)


@budget_bp.route('', methods=['GET'])
@token_required
def get_budgets():
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)

    budgets = Budget.query.filter_by(
        user_id=g.current_user.id,
        month=month,
        year=year
    ).all()

    result = []
    for budget in budgets:
        # Dynamically calculate spent from transactions
        first_of_month = date(year, month, 1)
        if month == 12:
            last_of_month = date(year + 1, 1, 1)
        else:
            last_of_month = date(year, month + 1, 1)

        spent = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == g.current_user.id,
            Transaction.type == 'expense',
            Transaction.status == 'completed',
            Transaction.category == budget.category,
            Transaction.date >= first_of_month,
            Transaction.date < last_of_month
        ).scalar()

        budget_dict = budget.to_dict()
        budget_dict['spent'] = float(spent)
        budget_dict['remaining'] = budget.allocated - float(spent)
        budget_dict['percentage'] = round((float(spent) / budget.allocated * 100), 1) if budget.allocated > 0 else 0
        result.append(budget_dict)

    # Also compute overall totals
    total_allocated = sum(b['allocated'] for b in result)
    total_spent = sum(b['spent'] for b in result)

    return jsonify({
        'budgets': result,
        'total_allocated': total_allocated,
        'total_spent': total_spent,
        'total_remaining': total_allocated - total_spent
    }), 200


@budget_bp.route('', methods=['POST'])
@token_required
def create_budget():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['category', 'allocated']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    month = data.get('month', date.today().month)
    year = data.get('year', date.today().year)

    # Check if budget already exists for this category/month/year
    existing = Budget.query.filter_by(
        user_id=g.current_user.id,
        category=data['category'],
        month=month,
        year=year
    ).first()

    if existing:
        return jsonify({'error': 'Budget for this category already exists for the given month'}), 409

    budget = Budget(
        user_id=g.current_user.id,
        category=data['category'],
        allocated=float(data['allocated']),
        month=month,
        year=year
    )

    db.session.add(budget)
    db.session.commit()

    budget_dict = budget.to_dict()
    budget_dict['spent'] = 0
    budget_dict['remaining'] = budget.allocated
    budget_dict['percentage'] = 0

    return jsonify({'budget': budget_dict}), 201


@budget_bp.route('/<int:budget_id>', methods=['GET'])
@token_required
def get_budget(budget_id):
    budget = Budget.query.filter_by(id=budget_id, user_id=g.current_user.id).first()
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    first_of_month = date(budget.year, budget.month, 1)
    if budget.month == 12:
        last_of_month = date(budget.year + 1, 1, 1)
    else:
        last_of_month = date(budget.year, budget.month + 1, 1)

    spent = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.category == budget.category,
        Transaction.date >= first_of_month,
        Transaction.date < last_of_month
    ).scalar()

    budget_dict = budget.to_dict()
    budget_dict['spent'] = float(spent)
    budget_dict['remaining'] = budget.allocated - float(spent)
    budget_dict['percentage'] = round((float(spent) / budget.allocated * 100), 1) if budget.allocated > 0 else 0

    # Get related transactions
    transactions = Transaction.query.filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.category == budget.category,
        Transaction.date >= first_of_month,
        Transaction.date < last_of_month
    ).order_by(Transaction.date.desc()).all()

    budget_dict['transactions'] = [t.to_dict() for t in transactions]

    return jsonify({'budget': budget_dict}), 200


@budget_bp.route('/<int:budget_id>', methods=['PUT'])
@token_required
def update_budget(budget_id):
    budget = Budget.query.filter_by(id=budget_id, user_id=g.current_user.id).first()
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'category' in data:
        budget.category = data['category']
    if 'allocated' in data:
        budget.allocated = float(data['allocated'])
    if 'month' in data:
        budget.month = data['month']
    if 'year' in data:
        budget.year = data['year']

    db.session.commit()

    # Recompute spent
    first_of_month = date(budget.year, budget.month, 1)
    if budget.month == 12:
        last_of_month = date(budget.year + 1, 1, 1)
    else:
        last_of_month = date(budget.year, budget.month + 1, 1)

    spent = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.category == budget.category,
        Transaction.date >= first_of_month,
        Transaction.date < last_of_month
    ).scalar()

    budget_dict = budget.to_dict()
    budget_dict['spent'] = float(spent)
    budget_dict['remaining'] = budget.allocated - float(spent)
    budget_dict['percentage'] = round((float(spent) / budget.allocated * 100), 1) if budget.allocated > 0 else 0

    return jsonify({'budget': budget_dict}), 200


@budget_bp.route('/<int:budget_id>', methods=['DELETE'])
@token_required
def delete_budget(budget_id):
    budget = Budget.query.filter_by(id=budget_id, user_id=g.current_user.id).first()
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    db.session.delete(budget)
    db.session.commit()
    return jsonify({'message': 'Budget deleted'}), 200
