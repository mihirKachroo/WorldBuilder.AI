from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta
import jwt

app = Flask(__name__)
CORS(app)

# In production, use environment variable
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# In-memory user store (replace with database in production)
users = {}

def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'message': 'Missing required fields'}), 400

        if email in users:
            return jsonify({'message': 'Email already registered'}), 400

        if len(password) < 8:
            return jsonify({'message': 'Password must be at least 8 characters'}), 400

        # Hash password
        hashed_password = generate_password_hash(password)

        # Create user
        user_id = str(len(users) + 1)
        users[email] = {
            'id': user_id,
            'name': name,
            'email': email,
            'password': hashed_password
        }

        # Generate token
        token = generate_token(user_id)

        return jsonify({
            'message': 'Account created successfully',
            'token': token,
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            }
        }), 201

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Missing email or password'}), 400

        user = users.get(email)

        if not user or not check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid email or password'}), 401

        # Generate token
        token = generate_token(user['id'])

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email']
            }
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

