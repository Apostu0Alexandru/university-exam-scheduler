# Development Guide

This guide provides instructions for setting up the development environment for the University Exam Scheduling Web Application.

## Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- Git

## Initial Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/university-exam-scheduler.git
cd university-exam-scheduler
```

2. Create environment files
```bash
cp .env.example .env
# Edit .env with your configuration, especially Clerk keys
```

3. Start the database services
```bash
docker-compose up -d
```

4. Install dependencies
```bash
cd frontend && npm install
cd ../backend && npm install
```

5. Run database migrations
```bash
cd backend && npm run migrate
```

## Development Workflow

1. Start the backend server
```bash
cd backend && npm run dev
```

2. Start the frontend development server
```bash
cd frontend && npm start
```

## Git Workflow

We follow a modified GitFlow branching strategy:

- `main`: Production-ready code
- `develop`: Latest development changes
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `release/*`: Release candidates

### Creating a new feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
# Make your changes
git add .
git commit -m "feat: Description of your feature"
git push origin feature/your-feature-name
# Create a Pull Request to merge into develop
```
