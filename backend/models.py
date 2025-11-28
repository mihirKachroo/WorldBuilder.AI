from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import JSON
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    projects = db.relationship('Project', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if password matches"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Project(db.Model):
    """Project/World model"""
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    characters = db.relationship('Character', backref='project', lazy=True, cascade='all, delete-orphan')
    relationships = db.relationship('CharacterRelationship', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert project to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Character(db.Model):
    """Character model"""
    __tablename__ = 'characters'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    position_x = db.Column(db.Float)
    position_y = db.Column(db.Float)
    bg_color = db.Column(db.String(50))
    border_color = db.Column(db.String(50))
    text_color = db.Column(db.String(50))
    icon_color = db.Column(db.String(50))
    extra_data = db.Column(JSON)  # For flexible additional attributes (renamed from metadata - reserved word)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    outgoing_relationships = db.relationship(
        'CharacterRelationship',
        foreign_keys='CharacterRelationship.source_character_id',
        backref='source_character',
        lazy=True,
        cascade='all, delete-orphan'
    )
    incoming_relationships = db.relationship(
        'CharacterRelationship',
        foreign_keys='CharacterRelationship.target_character_id',
        backref='target_character',
        lazy=True,
        cascade='all, delete-orphan'
    )
    
    __table_args__ = (
        db.UniqueConstraint('project_id', 'name', name='unique_character_name_per_project'),
        db.Index('idx_characters_project', 'project_id'),
        db.Index('idx_characters_name', 'name'),
    )
    
    def to_dict(self, include_relationships=False):
        """Convert character to dictionary"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'description': self.description,
            'position': {
                'x': self.position_x,
                'y': self.position_y
            } if self.position_x is not None and self.position_y is not None else None,
            'colors': {
                'bg': self.bg_color,
                'border': self.border_color,
                'text': self.text_color,
                'icon': self.icon_color
            },
            'metadata': self.extra_data or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_relationships:
            data['relationships'] = {
                'outgoing': [rel.to_dict() for rel in self.outgoing_relationships],
                'incoming': [rel.to_dict() for rel in self.incoming_relationships]
            }
        
        return data


class RelationshipType(db.Model):
    """Relationship type model (optional, for predefined relationship types)"""
    __tablename__ = 'relationship_types'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(50))
    
    def to_dict(self):
        """Convert relationship type to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color
        }


class CharacterRelationship(db.Model):
    """Character relationship model (edges in the graph)"""
    __tablename__ = 'character_relationships'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    source_character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), nullable=False)
    target_character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), nullable=False)
    relationship_type_id = db.Column(db.Integer, db.ForeignKey('relationship_types.id', ondelete='SET NULL'), nullable=True)
    label = db.Column(db.String(255))  # Custom label (e.g., "son of", "commands")
    extra_data = db.Column(JSON)  # For additional relationship data (renamed from metadata - reserved word)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.CheckConstraint('source_character_id != target_character_id', name='no_self_relationship'),
        db.Index('idx_relationships_source', 'source_character_id'),
        db.Index('idx_relationships_target', 'target_character_id'),
        db.Index('idx_relationships_project', 'project_id'),
    )
    
    def to_dict(self):
        """Convert relationship to dictionary"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'source_character_id': self.source_character_id,
            'target_character_id': self.target_character_id,
            'source_character_name': self.source_character.name if self.source_character else None,
            'target_character_name': self.target_character.name if self.target_character else None,
            'label': self.label,
            'relationship_type_id': self.relationship_type_id,
            'metadata': self.extra_data or {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

