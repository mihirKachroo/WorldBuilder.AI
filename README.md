# WorldBuilder.AI

A web application for building and managing world lore, characters, and story elements with AI-powered assistance.

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Flask (Python)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pip (Python package manager)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python app.py
```

The backend will run on [http://localhost:5000](http://localhost:5000)

## Project Structure

```
WorldBuilder.AI/
├── app/                 # Next.js app directory
│   ├── page.tsx        # Home/landing page
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   └── globals.css     # Global styles
├── backend/            # Flask backend
│   ├── app.py         # Main Flask application
│   └── requirements.txt
├── package.json        # Node.js dependencies
└── tailwind.config.js # Tailwind configuration
```

## Features

- **Home Page**: Landing page with feature highlights
- **Authentication**: Login and signup pages
- **Clean UI**: Modern design matching the WorldBuilder.AI aesthetic

## Color Scheme

- Primary: Purple/Blue (#5B21B6, #4F46E5)
- Background: White (#FFFFFF)
- UI Elements: Light Gray (#F5F5F5)
- Text: Dark Gray (#333333)
- Secondary Text: Gray (#888888)

## Development Notes

- The backend currently uses an in-memory user store. Replace with a database (e.g., PostgreSQL, MongoDB) for production.
- JWT tokens are used for authentication.
- CORS is enabled for development. Configure appropriately for production.

