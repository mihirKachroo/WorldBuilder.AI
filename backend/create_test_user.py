#!/usr/bin/env python3
"""
Create a test user for development.
"""

from app import app, db
from models import User, Project

def create_test_user():
    """Create a test user and a sample project"""
    with app.app_context():
        # Check if test user already exists
        test_user = User.query.filter_by(email='test@example.com').first()
        if test_user:
            print("Test user already exists!")
            return
        
        # Create test user
        user = User(name='Test User', email='test@example.com')
        user.set_password('testpassword123')
        db.session.add(user)
        db.session.commit()
        
        print(f"✓ Test user created:")
        print(f"  Email: test@example.com")
        print(f"  Password: testpassword123")
        
        # Create a sample project
        project = Project(user_id=user.id, name='Eldoria', description='Sample world project')
        db.session.add(project)
        db.session.commit()
        
        print(f"✓ Sample project 'Eldoria' created")
        print("\nYou can now log in with these credentials!")

if __name__ == '__main__':
    create_test_user()

