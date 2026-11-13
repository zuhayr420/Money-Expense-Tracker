from flask import Blueprint, request, jsonify, g
from models import db, Transaction, Account, Budget
from utils.auth import token_required
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_, extract
import calendar

analytics_bp = Blueprint('analytics', __name__)


def get_month_range(year, month):
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)
    return first_day, last_day


def get_month_start_end(year, month):
    first_day = date(year, month, 1)
    if month == 12:
        next_month_start = date(year + 1, 1, 1)
    else:
        next_month_start = date(year, month + 1, 1)
    return first_day, next_month_start


@analytics_bp.route('/summary', methods=['GET'])
@token_required
def get_summary():
    today = date.today()
    current_month_start, current_month_end = get_month_start_end(today.year, today.month)

    # Current month income
    current_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'income',
        Transaction.status == 'completed',
        Transaction.date >= current_month_start,
        Transaction.date < current_month_end
    ).scalar()

    # Current month expenses
    current_expenses = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= current_month_start,
        Transaction.date < current_month_end
    ).scalar()

    # Previous month
    if today.month == 1:
        prev_month = 12
        prev_year = today.year - 1
    else:
        prev_month = today.month - 1
        prev_year = today.year

    prev_month_start, prev_month_end = get_month_start_end(prev_year, prev_month)

    prev_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'income',
        Transaction.status == 'completed',
        Transaction.date >= prev_month_start,
        Transaction.date < prev_month_end
    ).scalar()

    prev_expenses = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= prev_month_start,
        Transaction.date < prev_month_end
    ).scalar()

    # Total balance across all active accounts
    total_balance = db.session.query(func.coalesce(func.sum(Account.balance), 0)).filter(
        Account.user_id == g.current_user.id,
        Account.is_active == True
    ).scalar()

    # Budget allocated for this month
    total_budget = db.session.query(func.coalesce(func.sum(Budget.allocated), 0)).filter(
        Budget.user_id == g.current_user.id,
        Budget.month == today.month,
        Budget.year == today.year
    ).scalar()

    current_income = float(current_income)
    current_expenses = float(current_expenses)
    prev_income = float(prev_income)
    prev_expenses = float(prev_expenses)
    total_balance = float(total_balance)
    total_budget = float(total_budget)

    savings_rate = round(((current_income - current_expenses) / current_income * 100), 1) if current_income > 0 else 0

    # Comparison percentages
    income_change = round(((current_income - prev_income) / prev_income * 100), 1) if prev_income > 0 else 0
    expense_change = round(((current_expenses - prev_expenses) / prev_expenses * 100), 1) if prev_expenses > 0 else 0

    available_budget = total_budget - current_expenses

    return jsonify({
        'total_balance': total_balance,
        'monthly_income': current_income,
        'monthly_expenses': current_expenses,
        'available_budget': available_budget,
        'total_budget': total_budget,
        'savings_rate': savings_rate,
        'net_savings': current_income - current_expenses,
        'comparison': {
            'income_change': income_change,
            'expense_change': expense_change,
            'prev_income': prev_income,
            'prev_expenses': prev_expenses
        }
    }), 200


@analytics_bp.route('/monthly', methods=['GET'])
@token_required
def get_monthly():
    months_count = request.args.get('months', 6, type=int)
    today = date.today()

    monthly_data = []
    for i in range(months_count - 1, -1, -1):
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1

        month_start, month_end = get_month_start_end(year, month)

        income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == g.current_user.id,
            Transaction.type == 'income',
            Transaction.status == 'completed',
            Transaction.date >= month_start,
            Transaction.date < month_end
        ).scalar()

        expenses = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == g.current_user.id,
            Transaction.type == 'expense',
            Transaction.status == 'completed',
            Transaction.date >= month_start,
            Transaction.date < month_end
        ).scalar()

        month_name = calendar.month_abbr[month]

        monthly_data.append({
            'month': month_name,
            'month_num': month,
            'year': year,
            'income': float(income),
            'expenses': float(expenses),
            'net': float(income) - float(expenses)
        })

    return jsonify({'monthly_data': monthly_data, 'trends': monthly_data}), 200


@analytics_bp.route('/categories', methods=['GET'])
@token_required
def get_category_spending():
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)
    tx_type = request.args.get('type', 'expense')

    month_start, month_end = get_month_start_end(year, month)

    categories = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount),
        func.count(Transaction.id)
    ).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == tx_type,
        Transaction.status == 'completed',
        Transaction.date >= month_start,
        Transaction.date < month_end
    ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).all()

    total = sum(float(amount) for _, amount, _ in categories)

    # Colors for categories
    colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
              '#14b8a6', '#f59e0b', '#6366f1', '#10b981']

    result = []
    for idx, (category, amount, count) in enumerate(categories):
        percentage = round((float(amount) / total * 100), 1) if total > 0 else 0
        result.append({
            'category': category,
            'amount': float(amount),
            'count': count,
            'percentage': percentage,
            'color': colors[idx % len(colors)]
        })

    return jsonify({
        'categories': result,
        'total': total,
        'month': month,
        'year': year
    }), 200


@analytics_bp.route('/daily', methods=['GET'])
@token_required
def get_daily_spending():
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)

    month_start, month_end = get_month_start_end(year, month)

    daily = db.session.query(
        Transaction.date,
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= month_start,
        Transaction.date < month_end
    ).group_by(Transaction.date).order_by(Transaction.date.asc()).all()

    # Fill all days of the month
    days_in_month = calendar.monthrange(year, month)[1]
    daily_map = {d.isoformat(): float(amount) for d, amount in daily}

    result = []
    for day in range(1, days_in_month + 1):
        d = date(year, month, day)
        result.append({
            'date': d.isoformat(),
            'day': day,
            'amount': daily_map.get(d.isoformat(), 0)
        })

    total_spending = sum(item['amount'] for item in result)
    days_with_data = len([item for item in result if item['amount'] > 0])
    avg_daily = round(total_spending / days_with_data, 2) if days_with_data > 0 else 0

    return jsonify({
        'daily_spending': result,
        'daily': result,
        'total': total_spending,
        'average_daily': avg_daily,
        'month': month,
        'year': year
    }), 200


@analytics_bp.route('/savings', methods=['GET'])
@token_required
def get_savings_trend():
    months_count = request.args.get('months', 6, type=int)
    today = date.today()

    savings_data = []
    cumulative = 0

    for i in range(months_count - 1, -1, -1):
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1

        month_start, month_end = get_month_start_end(year, month)

        income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == g.current_user.id,
            Transaction.type == 'income',
            Transaction.status == 'completed',
            Transaction.date >= month_start,
            Transaction.date < month_end
        ).scalar()

        expenses = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == g.current_user.id,
            Transaction.type == 'expense',
            Transaction.status == 'completed',
            Transaction.date >= month_start,
            Transaction.date < month_end
        ).scalar()

        monthly_savings = float(income) - float(expenses)
        cumulative += monthly_savings
        month_name = calendar.month_abbr[month]

        savings_data.append({
            'month': month_name,
            'month_num': month,
            'year': year,
            'income': float(income),
            'expenses': float(expenses),
            'savings': monthly_savings,
            'savings_rate': round((monthly_savings / float(income) * 100), 1) if float(income) > 0 else 0,
            'cumulative_savings': cumulative
        })

    return jsonify({'savings_data': savings_data, 'savings': savings_data}), 200


@analytics_bp.route('/insights', methods=['GET'])
@token_required
def get_insights():
    today = date.today()
    current_month_start, current_month_end = get_month_start_end(today.year, today.month)

    if today.month == 1:
        prev_month = 12
        prev_year = today.year - 1
    else:
        prev_month = today.month - 1
        prev_year = today.year
    prev_month_start, prev_month_end = get_month_start_end(prev_year, prev_month)

    insights = []

    # 1. Category comparison with previous month
    current_categories = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= current_month_start,
        Transaction.date < current_month_end
    ).group_by(Transaction.category).all()

    prev_categories = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= prev_month_start,
        Transaction.date < prev_month_end
    ).group_by(Transaction.category).all()

    current_cat_map = {cat: float(amt) for cat, amt in current_categories}
    prev_cat_map = {cat: float(amt) for cat, amt in prev_categories}

    for cat, cur_amt in current_cat_map.items():
        prev_amt = prev_cat_map.get(cat, 0)
        if prev_amt > 0:
            change = round(((cur_amt - prev_amt) / prev_amt * 100), 1)
            if change > 15:
                insights.append({
                    'type': 'warning',
                    'icon': 'trending-up',
                    'title': f'{cat} spending increased',
                    'description': f'You spent {change}% more on {cat} this month (₹{cur_amt:,.0f}) compared to last month (₹{prev_amt:,.0f}).',
                    'category': cat
                })
            elif change < -15:
                insights.append({
                    'type': 'success',
                    'icon': 'trending-down',
                    'title': f'{cat} spending decreased',
                    'description': f'Great! You spent {abs(change)}% less on {cat} this month (₹{cur_amt:,.0f}) compared to last month (₹{prev_amt:,.0f}).',
                    'category': cat
                })

    # 2. Total spending comparison
    current_total_expense = sum(current_cat_map.values())
    prev_total_expense = sum(prev_cat_map.values())
    if prev_total_expense > 0:
        total_change = round(((current_total_expense - prev_total_expense) / prev_total_expense * 100), 1)
        if total_change > 10:
            insights.append({
                'type': 'warning',
                'icon': 'alert-circle',
                'title': 'Overall spending is up',
                'description': f'Your total spending increased by {total_change}% this month. Consider reviewing your expenses.',
                'category': 'overall'
            })
        elif total_change < -5:
            insights.append({
                'type': 'success',
                'icon': 'check-circle',
                'title': 'Spending is down!',
                'description': f'Your total spending decreased by {abs(total_change)}% this month. Keep it up!',
                'category': 'overall'
            })

    # 3. Income trend
    current_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'income',
        Transaction.status == 'completed',
        Transaction.date >= current_month_start,
        Transaction.date < current_month_end
    ).scalar()
    current_income = float(current_income)

    if current_income > 0 and current_total_expense > 0:
        savings_rate = round(((current_income - current_total_expense) / current_income * 100), 1)
        if savings_rate >= 20:
            insights.append({
                'type': 'success',
                'icon': 'piggy-bank',
                'title': f'Savings rate: {savings_rate}%',
                'description': f'You\'re saving ₹{(current_income - current_total_expense):,.0f} this month. Excellent financial discipline!',
                'category': 'savings'
            })
        elif savings_rate < 10 and savings_rate >= 0:
            insights.append({
                'type': 'warning',
                'icon': 'alert-triangle',
                'title': f'Low savings rate: {savings_rate}%',
                'description': f'Your savings rate is only {savings_rate}%. Try to reduce discretionary spending.',
                'category': 'savings'
            })
        elif savings_rate < 0:
            insights.append({
                'type': 'danger',
                'icon': 'alert-octagon',
                'title': 'Spending exceeds income',
                'description': f'You\'re spending ₹{abs(current_income - current_total_expense):,.0f} more than your income this month.',
                'category': 'savings'
            })

    # 4. Budget alerts
    budgets = Budget.query.filter_by(
        user_id=g.current_user.id,
        month=today.month,
        year=today.year
    ).all()

    for budget in budgets:
        spent = current_cat_map.get(budget.category, 0)
        if budget.allocated > 0:
            usage = round((spent / budget.allocated * 100), 1)
            if usage >= 100:
                insights.append({
                    'type': 'danger',
                    'icon': 'x-circle',
                    'title': f'{budget.category} budget exceeded',
                    'description': f'You\'ve exceeded your {budget.category} budget by ₹{(spent - budget.allocated):,.0f} ({usage}% used).',
                    'category': budget.category
                })
            elif usage >= 80:
                insights.append({
                    'type': 'warning',
                    'icon': 'alert-triangle',
                    'title': f'{budget.category} budget nearly used',
                    'description': f'You\'ve used {usage}% of your {budget.category} budget (₹{spent:,.0f} of ₹{budget.allocated:,.0f}).',
                    'category': budget.category
                })

    # 5. Largest expense this month
    largest_tx = Transaction.query.filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= current_month_start,
        Transaction.date < current_month_end
    ).order_by(Transaction.amount.desc()).first()

    if largest_tx:
        insights.append({
            'type': 'info',
            'icon': 'credit-card',
            'title': 'Largest expense this month',
            'description': f'Your biggest expense was ₹{largest_tx.amount:,.0f} on "{largest_tx.description}" ({largest_tx.category}).',
            'category': largest_tx.category
        })

    # 6. Top spending category
    if current_categories:
        top_cat = max(current_categories, key=lambda x: x[1])
        insights.append({
            'type': 'info',
            'icon': 'bar-chart',
            'title': f'Top spending: {top_cat[0]}',
            'description': f'{top_cat[0]} is your highest spending category at ₹{float(top_cat[1]):,.0f} this month.',
            'category': top_cat[0]
        })

    return jsonify({'insights': insights}), 200


@analytics_bp.route('/family-spending', methods=['GET'])
@token_required
def get_family_spending():
    today = date.today()
    month = request.args.get('month', today.month, type=int)
    year = request.args.get('year', today.year, type=int)

    month_start, month_end = get_month_start_end(year, month)

    # Get spending by family member name
    member_spending = db.session.query(
        Transaction.family_member_name,
        func.sum(Transaction.amount),
        func.count(Transaction.id)
    ).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= month_start,
        Transaction.date < month_end,
        Transaction.family_member_name != '',
        Transaction.family_member_name.isnot(None)
    ).group_by(Transaction.family_member_name).order_by(func.sum(Transaction.amount).desc()).all()

    colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

    result = []
    total = sum(float(amt) for _, amt, _ in member_spending)

    for idx, (name, amount, count) in enumerate(member_spending):
        percentage = round((float(amount) / total * 100), 1) if total > 0 else 0
        result.append({
            'name': name,
            'amount': float(amount),
            'count': count,
            'percentage': percentage,
            'color': colors[idx % len(colors)]
        })

    # Also include transactions not tagged to any member under the user's own name
    untagged_spent = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == g.current_user.id,
        Transaction.type == 'expense',
        Transaction.status == 'completed',
        Transaction.date >= month_start,
        Transaction.date < month_end,
        db.or_(Transaction.family_member_name == '', Transaction.family_member_name.is_(None))
    ).scalar()

    if float(untagged_spent) > 0:
        total += float(untagged_spent)
        result.append({
            'name': g.current_user.full_name,
            'amount': float(untagged_spent),
            'count': 0,
            'percentage': round((float(untagged_spent) / total * 100), 1) if total > 0 else 0,
            'color': '#6b7280'
        })

    return jsonify({
        'family_spending': result,
        'total': total,
        'month': month,
        'year': year
    }), 200
