from flask import Blueprint, request, jsonify, g
from models import db, Family, FamilyMember, User, Transaction
from utils.auth import token_required
from datetime import datetime, date
from sqlalchemy import func

family_bp = Blueprint('family', __name__)


@family_bp.route('', methods=['GET'])
@token_required
def get_families():
    memberships = FamilyMember.query.filter_by(user_id=g.current_user.id).all()
    family_ids = [m.family_id for m in memberships]
    families = Family.query.filter(Family.id.in_(family_ids)).all() if family_ids else []
    return jsonify({'families': [f.to_dict() for f in families]}), 200


@family_bp.route('', methods=['POST'])
@token_required
def create_family():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Family name is required'}), 400

    family = Family(
        name=data['name'],
        created_by=g.current_user.id,
        monthly_budget=data.get('monthly_budget', 0)
    )
    db.session.add(family)
    db.session.flush()

    # Add creator as admin member
    member = FamilyMember(
        family_id=family.id,
        user_id=g.current_user.id,
        role='admin',
        spending_limit=data.get('spending_limit', 0)
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({'family': family.to_dict()}), 201


@family_bp.route('/<int:family_id>', methods=['GET'])
@token_required
def get_family(family_id):
    membership = FamilyMember.query.filter_by(family_id=family_id, user_id=g.current_user.id).first()
    if not membership:
        return jsonify({'error': 'Family not found or access denied'}), 404

    family = Family.query.get(family_id)
    if not family:
        return jsonify({'error': 'Family not found'}), 404

    return jsonify({'family': family.to_dict()}), 200


@family_bp.route('/<int:family_id>', methods=['PUT'])
@token_required
def update_family(family_id):
    membership = FamilyMember.query.filter_by(family_id=family_id, user_id=g.current_user.id).first()
    if not membership or membership.role != 'admin':
        return jsonify({'error': 'Only admins can update family details'}), 403

    family = Family.query.get(family_id)
    if not family:
        return jsonify({'error': 'Family not found'}), 404

    data = request.get_json()
    if 'name' in data:
        family.name = data['name']
    if 'monthly_budget' in data:
        family.monthly_budget = float(data['monthly_budget'])

    db.session.commit()
    return jsonify({'family': family.to_dict()}), 200


@family_bp.route('/<int:family_id>', methods=['DELETE'])
@token_required
def delete_family(family_id):
    family = Family.query.get(family_id)
    if not family:
        return jsonify({'error': 'Family not found'}), 404
    if family.created_by != g.current_user.id:
        return jsonify({'error': 'Only the creator can delete the family'}), 403

    db.session.delete(family)
    db.session.commit()
    return jsonify({'message': 'Family deleted'}), 200


@family_bp.route('/<int:family_id>/members', methods=['GET'])
@token_required
def get_members(family_id):
    membership = FamilyMember.query.filter_by(family_id=family_id, user_id=g.current_user.id).first()
    if not membership:
        return jsonify({'error': 'Family not found or access denied'}), 404

    members = FamilyMember.query.filter_by(family_id=family_id).all()
    return jsonify({'members': [m.to_dict() for m in members]}), 200


@family_bp.route('/<int:family_id>/members', methods=['POST'])
@token_required
def add_member(family_id):
    membership = FamilyMember.query.filter_by(family_id=family_id, user_id=g.current_user.id).first()
    if not membership or membership.role not in ('admin',):
        return jsonify({'error': 'Only admins can add members'}), 403

    data = request.get_json()
    if not data or not data.get('username'):
        return jsonify({'error': 'Username is required'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    existing = FamilyMember.query.filter_by(family_id=family_id, user_id=user.id).first()
    if existing:
        return jsonify({'error': 'User is already a member'}), 409

    member = FamilyMember(
        family_id=family_id,
        user_id=user.id,
        role=data.get('role', 'member'),
        spending_limit=data.get('spending_limit', 0)
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({'member': member.to_dict()}), 201


@family_bp.route('/<int:family_id>/members/<int:member_id>', methods=['PUT'])
@token_required
def update_member(family_id, member_id):
    admin_membership = FamilyMember.query.filter_by(family_id=family_id, user_id=g.current_user.id).first()
    if not admin_membership or admin_membership.role != 'admin':
        return jsonify({'error': 'Only admins can update members'}), 403

    member = FamilyMember.query.filter_by(id=member_id, family_id=family_id).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404

    data = request.get_json()
    if 'role' in data:
        member.role = data['role']
    if 'spending_limit' in data:
        member.spending_limit = float(data['spending_limit'])

    db.session.commit()
    return jsonify({'member': member.to_dict()}), 200


@family_bp.route('/<int:family_id>/members/<int:member_id>', methods=['DELETE'])
@token_required
def remove_member(family_id, member_id):
    admin_membership = FamilyMember.query.filter_by(family_id=family_id, user_id=g.current_user.id).first()
    if not admin_membership or admin_membership.role != 'admin':
        return jsonify({'error': 'Only admins can remove members'}), 403

    member = FamilyMember.query.filter_by(id=member_id, family_id=family_id).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404

    if member.user_id == g.current_user.id:
        return jsonify({'error': 'Cannot remove yourself from the family'}), 400

    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Member removed'}), 200


@family_bp.route('/<int:family_id>/spending', methods=['GET'])
@token_required
def get_family_spending(family_id):
    membership = FamilyMember.query.filter_by(family_id=family_id, user_id=g.current_user.id).first()
    if not membership:
        return jsonify({'error': 'Family not found or access denied'}), 404

    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)

    first_of_month = date(year, month, 1)
    if month == 12:
        last_of_month = date(year + 1, 1, 1)
    else:
        last_of_month = date(year, month + 1, 1)

    # Get all family member user ids
    members = FamilyMember.query.filter_by(family_id=family_id).all()
    member_user_ids = [m.user_id for m in members]

    # Get spending by member
    member_spending = []
    for m in members:
        spent = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == m.user_id,
            Transaction.type == 'expense',
            Transaction.status == 'completed',
            Transaction.date >= first_of_month,
            Transaction.date < last_of_month
        ).scalar()

        # Also check for transactions tagged to this member by name
        tagged_spent = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.family_member_name == m.user.full_name,
            Transaction.type == 'expense',
            Transaction.status == 'completed',
            Transaction.date >= first_of_month,
            Transaction.date < last_of_month
        ).scalar()

        total_spent = max(float(spent), float(tagged_spent))

        member_spending.append({
            'user_id': m.user_id,
            'name': m.user.full_name if m.user else 'Unknown',
            'role': m.role,
            'spending_limit': m.spending_limit,
            'spent': total_spent,
            'remaining_limit': m.spending_limit - total_spent if m.spending_limit > 0 else None
        })

    # Category breakdown for the family
    category_spending = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id.in_(member_user_ids),
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= first_of_month,
        Transaction.date < last_of_month
    ).group_by(Transaction.category).all()

    total_family_spent = sum(float(amount) for _, amount in category_spending)

    family = Family.query.get(family_id)

    return jsonify({
        'family_name': family.name if family else '',
        'monthly_budget': family.monthly_budget if family else 0,
        'total_spent': total_family_spent,
        'remaining_budget': (family.monthly_budget - total_family_spent) if family else 0,
        'member_spending': member_spending,
        'category_breakdown': [
            {'category': cat, 'amount': float(amount)}
            for cat, amount in category_spending
        ],
        'month': month,
        'year': year
    }), 200
