from flask import Blueprint, request, jsonify, g
from models import db, Card, Account
from utils.auth import token_required

card_bp = Blueprint('cards', __name__)


@card_bp.route('', methods=['GET'])
@token_required
def get_cards():
    cards = Card.query.filter_by(user_id=g.current_user.id).order_by(Card.created_at.desc()).all()
    return jsonify({'cards': [c.to_dict() for c in cards]}), 200


@card_bp.route('', methods=['POST'])
@token_required
def create_card():
    data = request.get_json()
    if not data or not data.get('card_number') or not data.get('expiry_date'):
        return jsonify({'error': 'Card number and expiry date are required'}), 400

    cardholder_name = data.get('cardholder_name') or g.current_user.full_name or g.current_user.username
    account_id = data.get('account_id')
    if account_id:
        acc = Account.query.filter_by(id=account_id, user_id=g.current_user.id).first()
        if not acc:
            account_id = None

    card = Card(
        user_id=g.current_user.id,
        account_id=account_id,
        cardholder_name=cardholder_name.strip(),
        card_number=data['card_number'].strip(),
        expiry_date=data['expiry_date'].strip(),
        card_label=data.get('card_label', 'Verdela Card').strip(),
        network=data.get('network', 'mastercard').lower(),
        color_theme=data.get('color_theme', 'emerald').lower(),
        is_locked=data.get('is_locked', False)
    )
    db.session.add(card)
    db.session.commit()
    return jsonify({'card': card.to_dict()}), 201


@card_bp.route('/<int:card_id>', methods=['GET'])
@token_required
def get_card(card_id):
    card = Card.query.filter_by(id=card_id, user_id=g.current_user.id).first()
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    return jsonify({'card': card.to_dict()}), 200


@card_bp.route('/<int:card_id>', methods=['PUT'])
@token_required
def update_card(card_id):
    card = Card.query.filter_by(id=card_id, user_id=g.current_user.id).first()
    if not card:
        return jsonify({'error': 'Card not found'}), 404

    data = request.get_json()
    if 'cardholder_name' in data and data['cardholder_name']:
        card.cardholder_name = data['cardholder_name'].strip()
    if 'card_number' in data and data['card_number']:
        card.card_number = data['card_number'].strip()
    if 'expiry_date' in data and data['expiry_date']:
        card.expiry_date = data['expiry_date'].strip()
    if 'card_label' in data:
        card.card_label = data['card_label'].strip()
    if 'network' in data:
        card.network = data['network'].lower()
    if 'color_theme' in data:
        card.color_theme = data['color_theme'].lower()
    if 'is_locked' in data:
        card.is_locked = bool(data['is_locked'])
    if 'account_id' in data:
        card.account_id = data['account_id']

    db.session.commit()
    return jsonify({'card': card.to_dict()}), 200


@card_bp.route('/<int:card_id>/toggle-lock', methods=['POST'])
@token_required
def toggle_card_lock(card_id):
    card = Card.query.filter_by(id=card_id, user_id=g.current_user.id).first()
    if not card:
        return jsonify({'error': 'Card not found'}), 404

    card.is_locked = not card.is_locked
    db.session.commit()
    return jsonify({'card': card.to_dict(), 'is_locked': card.is_locked}), 200


@card_bp.route('/<int:card_id>', methods=['DELETE'])
@token_required
def delete_card(card_id):
    card = Card.query.filter_by(id=card_id, user_id=g.current_user.id).first()
    if not card:
        return jsonify({'error': 'Card not found'}), 404

    db.session.delete(card)
    db.session.commit()
    return jsonify({'message': 'Card deleted'}), 200
