.PHONY: install setup run-backend run-frontend run-dev clean lint format format-all lint-frontend lint-frontend-fix format-frontend format-frontend-check help

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd backend && poetry install
	cd frontend && npm install

# Setup development environment
setup: install
	@echo "Setting up development environment..."
	cd backend && poetry run pre-commit install
	@echo "Development environment ready!"

# Run backend server with hot reload
run-backend:
	@echo "Starting backend server..."
	cd backend && poetry run flask --app main.py --debug run --port 5000

# Run frontend server
run-frontend:
	@echo "Starting frontend server..."
	cd frontend && npm run dev

# Run both servers (requires terminal multiplexer or two terminals)
run-dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:5000"
	@echo "Frontend: http://localhost:3000"
	@echo "Run 'make run-backend' and 'make run-frontend' in separate terminals"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	cd frontend && rm -rf build dist node_modules/.cache

# Run linting
lint:
	@echo "Running linting..."
	cd backend && poetry run flake8 .

# Format code
format:
	@echo "Formatting code..."
	cd backend && poetry run black .

# Run pre-commit on all files
format-all:
	@echo "Running pre-commit on all files..."
	cd backend && poetry run pre-commit run --all-files

# Frontend code quality
lint-frontend:
	@echo "Running frontend linting..."
	cd frontend && npm run lint

lint-frontend-fix:
	@echo "Fixing frontend linting issues..."
	cd frontend && npm run lint:fix

format-frontend:
	@echo "Formatting frontend code..."
	cd frontend && npm run format

format-frontend-check:
	@echo "Checking frontend formatting..."
	cd frontend && npm run format:check

# Help
help:
	@echo "AI Agent RAG Development Commands:"
	@echo ""
	@echo "Setup Commands:"
	@echo "  install       - Install all dependencies"
	@echo "  setup         - Setup development environment with pre-commit hooks"
	@echo ""
	@echo "Development Commands:"
	@echo "  run-backend   - Start Flask backend with hot reload"
	@echo "  run-frontend  - Start React frontend dev server"
	@echo "  run-dev       - Instructions for running both servers"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint          - Run linting for backend"
	@echo "  format        - Format backend code with black"
	@echo "  format-all    - Run pre-commit hooks on all files"
	@echo "  lint-frontend - Run linting for frontend"
	@echo "  lint-frontend-fix - Fix frontend linting issues"
	@echo "  format-frontend - Format frontend code"
	@echo "  format-frontend-check - Check frontend formatting"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean         - Clean build artifacts and cache"
	@echo "  help          - Show this help message"
