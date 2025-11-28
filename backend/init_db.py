#!/usr/bin/env python3
"""
Database initialization script.
Run this to create the database and tables.
"""

import os
from app import app, db
from models import User, Project, Character, CharacterRelationship, RelationshipType

def init_database():
    """Initialize the database with tables"""
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✓ Database tables created successfully")
        
        # Create some default relationship types
        default_types = [
            {'name': 'family', 'description': 'Family relationships', 'color': '#3B82F6'},
            {'name': 'alliance', 'description': 'Alliances and partnerships', 'color': '#10B981'},
            {'name': 'rivalry', 'description': 'Rivalries and conflicts', 'color': '#EF4444'},
            {'name': 'command', 'description': 'Command and authority', 'color': '#5B21B6'},
            {'name': 'friendship', 'description': 'Friendships', 'color': '#F59E0B'},
        ]
        
        for type_data in default_types:
            existing = RelationshipType.query.filter_by(name=type_data['name']).first()
            if not existing:
                rel_type = RelationshipType(**type_data)
                db.session.add(rel_type)
        
        db.session.commit()
        print("✓ Default relationship types created")
        print("\nDatabase initialized successfully!")
        print("\nTo create a test user, run:")
        print("  python create_test_user.py")

if __name__ == '__main__':
    init_database()

