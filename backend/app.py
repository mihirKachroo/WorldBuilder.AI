from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta
import jwt
from functools import wraps
from models import db, User, Project, Character, CharacterRelationship, RelationshipType

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Database configuration - defaults to SQLite for easy development
# Set DATABASE_URL environment variable to use PostgreSQL:
# DATABASE_URL=postgresql://localhost/worldbuilder
database_url = os.environ.get('DATABASE_URL')
if database_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Default to SQLite for development (no PostgreSQL installation needed)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///worldbuilder.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(int(data['user_id']))
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# ==================== AUTH ENDPOINTS ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'message': 'Missing required fields'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already registered'}), 400

        if len(password) < 8:
            return jsonify({'message': 'Password must be at least 8 characters'}), 400

        # Create user
        user = User(name=name, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Generate token
        token = generate_token(user.id)

        return jsonify({
            'message': 'Account created successfully',
            'token': token,
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Missing email or password'}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({'message': 'Invalid email or password'}), 401

        # Generate token
        token = generate_token(user.id)

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ==================== PROJECT ENDPOINTS ====================

@app.route('/api/projects', methods=['GET'])
@verify_token
def get_projects(current_user):
    """Get all projects for the current user"""
    try:
        projects = Project.query.filter_by(user_id=current_user.id).all()
        return jsonify([project.to_dict() for project in projects]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects', methods=['POST'])
@verify_token
def create_project(current_user):
    """Create a new project"""
    try:
        data = request.get_json()
        name = data.get('name')
        description = data.get('description', '')

        if not name:
            return jsonify({'message': 'Project name is required'}), 400

        project = Project(user_id=current_user.id, name=name, description=description)
        db.session.add(project)
        db.session.commit()

        return jsonify(project.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['GET'])
@verify_token
def get_project(current_user, project_id):
    """Get a specific project"""
    try:
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        return jsonify(project.to_dict()), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ==================== CHARACTER ENDPOINTS ====================

@app.route('/api/projects/<int:project_id>/characters', methods=['GET'])
@verify_token
def get_characters(current_user, project_id):
    """Get all characters in a project"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        characters = Character.query.filter_by(project_id=project_id).all()
        return jsonify([char.to_dict() for char in characters]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>/characters', methods=['POST'])
@verify_token
def create_character(current_user, project_id):
    """Create a new character"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'message': 'Character name is required'}), 400

        # Check if character with same name already exists in project
        existing = Character.query.filter_by(project_id=project_id, name=name).first()
        if existing:
            return jsonify({'message': 'Character with this name already exists in this project'}), 400

        position = data.get('position', {})
        colors = data.get('colors', {})
        
        character = Character(
            project_id=project_id,
            name=name,
            description=data.get('description', ''),
            position_x=position.get('x'),
            position_y=position.get('y'),
            bg_color=colors.get('bg'),
            border_color=colors.get('border'),
            text_color=colors.get('text'),
            icon_color=colors.get('icon'),
            metadata=data.get('metadata', {})
        )
        
        db.session.add(character)
        db.session.commit()

        return jsonify(character.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>/characters/<int:character_id>', methods=['GET'])
@verify_token
def get_character(current_user, project_id, character_id):
    """Get a specific character with relationships"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        character = Character.query.filter_by(id=character_id, project_id=project_id).first_or_404()
        return jsonify(character.to_dict(include_relationships=True)), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>/characters/<int:character_id>', methods=['PUT'])
@verify_token
def update_character(current_user, project_id, character_id):
    """Update a character"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        character = Character.query.filter_by(id=character_id, project_id=project_id).first_or_404()
        
        data = request.get_json()
        
        if 'name' in data:
            # Check if new name conflicts with existing character
            existing = Character.query.filter_by(project_id=project_id, name=data['name']).first()
            if existing and existing.id != character_id:
                return jsonify({'message': 'Character with this name already exists in this project'}), 400
            character.name = data['name']
        
        if 'description' in data:
            character.description = data['description']
        
        if 'position' in data:
            character.position_x = data['position'].get('x')
            character.position_y = data['position'].get('y')
        
        if 'colors' in data:
            character.bg_color = data['colors'].get('bg')
            character.border_color = data['colors'].get('border')
            character.text_color = data['colors'].get('text')
            character.icon_color = data['colors'].get('icon')
        
        if 'metadata' in data:
            character.extra_data = data['metadata']
        
        character.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify(character.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>/characters/<int:character_id>', methods=['DELETE'])
@verify_token
def delete_character(current_user, project_id, character_id):
    """Delete a character (and all its relationships)"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        character = Character.query.filter_by(id=character_id, project_id=project_id).first_or_404()
        
        db.session.delete(character)  # Cascade will delete relationships
        db.session.commit()

        return jsonify({'message': 'Character deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ==================== RELATIONSHIP ENDPOINTS ====================

@app.route('/api/projects/<int:project_id>/relationships', methods=['GET'])
@verify_token
def get_relationships(current_user, project_id):
    """Get all relationships in a project"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        relationships = CharacterRelationship.query.filter_by(project_id=project_id).all()
        return jsonify([rel.to_dict() for rel in relationships]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>/relationships', methods=['POST'])
@verify_token
def create_relationship(current_user, project_id):
    """Create a new relationship between characters"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        data = request.get_json()
        source_id = data.get('source_character_id')
        target_id = data.get('target_character_id')
        label = data.get('label', '')
        
        if not source_id or not target_id:
            return jsonify({'message': 'Source and target character IDs are required'}), 400
        
        if source_id == target_id:
            return jsonify({'message': 'Cannot create relationship to self'}), 400

        # Verify both characters exist and belong to the project
        source_char = Character.query.filter_by(id=source_id, project_id=project_id).first_or_404()
        target_char = Character.query.filter_by(id=target_id, project_id=project_id).first_or_404()

        # Check if relationship already exists
        existing = CharacterRelationship.query.filter_by(
            project_id=project_id,
            source_character_id=source_id,
            target_character_id=target_id
        ).first()
        
        if existing:
            return jsonify({'message': 'Relationship already exists'}), 400

        relationship = CharacterRelationship(
            project_id=project_id,
            source_character_id=source_id,
            target_character_id=target_id,
            label=label,
            relationship_type_id=data.get('relationship_type_id'),
            metadata=data.get('metadata', {})
        )
        
        db.session.add(relationship)
        db.session.commit()

        return jsonify(relationship.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>/relationships/<int:relationship_id>', methods=['PUT'])
@verify_token
def update_relationship(current_user, project_id, relationship_id):
    """Update a relationship"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        relationship = CharacterRelationship.query.filter_by(
            id=relationship_id,
            project_id=project_id
        ).first_or_404()
        
        data = request.get_json()
        
        if 'label' in data:
            relationship.label = data['label']
        
        if 'relationship_type_id' in data:
            relationship.relationship_type_id = data['relationship_type_id']
        
        if 'metadata' in data:
            relationship.extra_data = data['metadata']
        
        db.session.commit()

        return jsonify(relationship.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/projects/<int:project_id>/relationships/<int:relationship_id>', methods=['DELETE'])
@verify_token
def delete_relationship(current_user, project_id, relationship_id):
    """Delete a relationship"""
    try:
        # Verify project belongs to user
        project = Project.query.filter_by(id=project_id, user_id=current_user.id).first_or_404()
        
        relationship = CharacterRelationship.query.filter_by(
            id=relationship_id,
            project_id=project_id
        ).first_or_404()
        
        db.session.delete(relationship)
        db.session.commit()

        return jsonify({'message': 'Relationship deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

# ==================== INITIALIZE DATABASE ====================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
