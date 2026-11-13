import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from models import db
from routes.auth_routes import auth_bp
from routes.account_routes import account_bp
from routes.transaction_routes import transaction_bp
from routes.budget_routes import budget_bp
from routes.goal_routes import goal_bp
from routes.bill_routes import bill_bp
from routes.family_routes import family_bp
from routes.analytics_routes import analytics_bp
from routes.card_routes import card_bp

load_dotenv()

# Structured Logging Configuration
log_level = logging.DEBUG if os.environ.get('FLASK_DEBUG') == '1' else logging.INFO
logging.basicConfig(
    level=log_level,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
logger = logging.getLogger('verdela')

app = Flask(__name__)

# Application Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'family-finance-secret-key-production-grade-2024')
database_url = os.environ.get('DATABASE_URL', 'sqlite:///family_finance.db')
# Handle postgres:// vs postgresql:// protocol alias common in cloud hosts (Render, Heroku)
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Database engine options for connection pool resilience
if not database_url.startswith('sqlite'):
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

# Allowed CORS Origins
env_origins = os.environ.get('CORS_ORIGINS', '')
allowed_origins = [orig.strip() for orig in env_origins.split(',') if orig.strip()]
if not allowed_origins:
    allowed_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
    ]

# If CORS_ORIGINS is explicitly '*', allow all origins without credentials conflict
if env_origins.strip() == '*':
    CORS(app, resources={r"/api/*": {"origins": "*"}})
else:
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

# Initialize database
db.init_app(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(account_bp, url_prefix='/api/accounts')
app.register_blueprint(transaction_bp, url_prefix='/api/transactions')
app.register_blueprint(budget_bp, url_prefix='/api/budgets')
app.register_blueprint(goal_bp, url_prefix='/api/goals')
app.register_blueprint(bill_bp, url_prefix='/api/bills')
app.register_blueprint(family_bp, url_prefix='/api/family')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(card_bp, url_prefix='/api/cards')

# Security Headers Middleware
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if os.environ.get('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Standard Health-Check Endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Verdela Family Finance API',
        'environment': os.environ.get('FLASK_ENV', 'development'),
        'database': 'connected'
    }), 200

# Global JSON Error Handlers (Standard API Responses)
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request', 'message': str(getattr(error, 'description', error))}), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized', 'message': 'Authentication token is missing or invalid'}), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden', 'message': 'You do not have permission to access this resource'}), 403

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found', 'message': 'The requested resource was not found on the server'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed', 'message': 'HTTP method is not allowed on this endpoint'}), 405

@app.errorhandler(429)
def ratelimit_handler(error):
    return jsonify({'error': 'Too many requests', 'message': 'Rate limit exceeded. Please retry later.'}), 429

@app.errorhandler(500)
def internal_server_error(error):
    logger.error(f"Internal Server Error: {error}", exc_info=True)
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred. The technical team has been notified.'
    }), 500

# Initialize DB on startup
with app.app_context():
    db.create_all()
    logger.info("Database schema verified and initialized.")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    is_debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    logger.info(f"Starting Verdela API server on port {port} (debug={is_debug})")
    app.run(host='0.0.0.0', port=port, debug=is_debug)
