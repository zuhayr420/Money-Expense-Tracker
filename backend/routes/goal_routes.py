from flask import Blueprint, request, jsonify, g
from models import db, Goal, GoalContribution
from utils.auth import token_required
from datetime import datetime, date

goal_bp = Blueprint('goals', __name__)


@goal_bp.route('', methods=['GET'])
@token_required
def get_goals():
    status = request.args.get('status')
    query = Goal.query.filter_by(user_id=g.current_user.id)
    if status:
        query = query.filter(Goal.status == status)
    goals = query.order_by(Goal.created_at.desc()).all()
    return jsonify({'goals': [g_item.to_dict() for g_item in goals]}), 200


@goal_bp.route('', methods=['POST'])
@token_required
def create_goal():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['name', 'target_amount']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400

    target_date = None
    if data.get('target_date'):
        try:
            target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    goal = Goal(
        user_id=g.current_user.id,
        name=data['name'],
        target_amount=float(data['target_amount']),
        current_amount=float(data.get('current_amount', 0)),
        target_date=target_date,
        icon=data.get('icon', 'target'),
        color=data.get('color', '#4ade80'),
        status=data.get('status', 'active')
    )

    db.session.add(goal)
    db.session.commit()
    return jsonify({'goal': goal.to_dict()}), 201


@goal_bp.route('/<int:goal_id>', methods=['GET'])
@token_required
def get_goal(goal_id):
    goal = Goal.query.filter_by(id=goal_id, user_id=g.current_user.id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    goal_dict = goal.to_dict()
    contributions = GoalContribution.query.filter_by(goal_id=goal.id).order_by(GoalContribution.date.desc()).all()
    goal_dict['contributions'] = [c.to_dict() for c in contributions]
    return jsonify({'goal': goal_dict}), 200


@goal_bp.route('/<int:goal_id>', methods=['PUT'])
@token_required
def update_goal(goal_id):
    goal = Goal.query.filter_by(id=goal_id, user_id=g.current_user.id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'name' in data:
        goal.name = data['name']
    if 'target_amount' in data:
        goal.target_amount = float(data['target_amount'])
    if 'current_amount' in data:
        goal.current_amount = float(data['current_amount'])
    if 'target_date' in data:
        if data['target_date']:
            try:
                goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            goal.target_date = None
    if 'icon' in data:
        goal.icon = data['icon']
    if 'color' in data:
        goal.color = data['color']
    if 'status' in data:
        goal.status = data['status']

    # Auto-complete if target reached
    if goal.current_amount >= goal.target_amount:
        goal.status = 'completed'

    db.session.commit()
    return jsonify({'goal': goal.to_dict()}), 200


@goal_bp.route('/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_goal(goal_id):
    goal = Goal.query.filter_by(id=goal_id, user_id=g.current_user.id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Goal deleted'}), 200


@goal_bp.route('/<int:goal_id>/contributions', methods=['GET'])
@token_required
def get_contributions(goal_id):
    goal = Goal.query.filter_by(id=goal_id, user_id=g.current_user.id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    contributions = GoalContribution.query.filter_by(goal_id=goal.id).order_by(GoalContribution.date.desc()).all()
    return jsonify({'contributions': [c.to_dict() for c in contributions]}), 200


@goal_bp.route('/<int:goal_id>/contributions', methods=['POST'])
@token_required
def add_contribution(goal_id):
    goal = Goal.query.filter_by(id=goal_id, user_id=g.current_user.id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    data = request.get_json()
    if not data or not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400

    contrib_date = date.today()
    if data.get('date'):
        try:
            contrib_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    contribution = GoalContribution(
        goal_id=goal.id,
        amount=float(data['amount']),
        date=contrib_date,
        note=data.get('note', '')
    )

    goal.current_amount += float(data['amount'])

    # Auto-complete if target reached
    if goal.current_amount >= goal.target_amount:
        goal.status = 'completed'

    db.session.add(contribution)
    db.session.commit()
    return jsonify({'contribution': contribution.to_dict(), 'goal': goal.to_dict()}), 201


@goal_bp.route('/<int:goal_id>/contributions/<int:contribution_id>', methods=['DELETE'])
@token_required
def delete_contribution(goal_id, contribution_id):
    goal = Goal.query.filter_by(id=goal_id, user_id=g.current_user.id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    contribution = GoalContribution.query.filter_by(id=contribution_id, goal_id=goal.id).first()
    if not contribution:
        return jsonify({'error': 'Contribution not found'}), 404

    goal.current_amount -= contribution.amount
    if goal.current_amount < 0:
        goal.current_amount = 0

    # Revert status if un-completed
    if goal.current_amount < goal.target_amount and goal.status == 'completed':
        goal.status = 'active'

    db.session.delete(contribution)
    db.session.commit()
    return jsonify({'message': 'Contribution deleted', 'goal': goal.to_dict()}), 200
