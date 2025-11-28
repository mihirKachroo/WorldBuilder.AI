#!/bin/bash
# Script to fix virtual environment and install dependencies

echo "🔧 Fixing virtual environment..."

cd "$(dirname "$0")"

# Remove old virtual environment
if [ -d "venv" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv
fi

# Create new virtual environment
echo "Creating new virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies (using SQLite-friendly version)
echo "Installing dependencies..."
pip install Flask==3.0.0 Flask-CORS==4.0.0 python-dotenv==1.0.0 Werkzeug==3.0.1 PyJWT==2.8.0 Flask-SQLAlchemy==3.1.1

echo ""
echo "✅ Virtual environment fixed!"
echo ""
echo "To activate the virtual environment in the future, run:"
echo "  source venv/bin/activate"
echo ""
echo "To initialize the database, run:"
echo "  python init_db.py"
echo ""

