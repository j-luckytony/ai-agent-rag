# AI Agent for Reasoning-Based Retrieval

A sophisticated RAG (Retrieval-Augmented Generation) system that intelligently selects between PDF and CSV data sources to answer military-related questions. Features vector embeddings, conversation memory, and real-time streaming responses.

## Features

- Automatically decides which documents to search based on your question
- Finds relevant information using advanced semantic search
- Remembers previous conversations for better context
- Streams responses in real-time as they're generated
- Shows you exactly which sources were used for each answer
- Clean, modern interface with helpful controls

## Quick Start

### Prerequisites

**Required:**
- Python 3.10 or higher
- Node.js 18 or higher
- GNU Make
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ai-agent-rag
   ```

2. **Install all dependencies**:
   ```bash
   make install
   ```

3. **Setup development environment**:
   ```bash
   make setup
   ```

4. **Configure OpenAI API Key**:
   ```bash
   # Edit backend/.env and add your API key
   echo "OPENAI_API_KEY=your_openai_api_key_here" > backend/.env
   echo "FRONTEND_URL=http://localhost:3000" >> backend/.env
   ```

### Running the Application

1. **Start the Backend** (Terminal 1):
   ```bash
   make run-backend
   ```
   Backend will start at: http://localhost:5000

2. **Start the Frontend** (Terminal 2):
   ```bash
   make run-frontend
   ```
   Frontend will start at: http://localhost:3000

3. **Open your browser** and navigate to: http://localhost:3000

**Alternative**: Run `make run-dev` for instructions on running both servers.

## Development

### Quick Development Commands:
```bash
# Setup development environment
make setup

# Start backend with hot reload
make run-backend

# Start frontend with hot reload
make run-frontend

# Get help with all available commands
make help
```

### Code Quality:
```bash
# Format backend code
make format

# Run backend linting
make lint

# Format frontend code
make format-frontend

# Run frontend linting
make lint-frontend

# Run pre-commit hooks on all files
make format-all
```

### Maintenance:
```bash
# Clean build artifacts and cache
make clean
```

## Project Structure

```
ai-agent-rag/
├── backend/
│   ├── agent.py              # Core RAG agent logic
│   ├── main.py               # Flask application
│   ├── pyproject.toml        # Python dependencies
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API integration
│   │   └── types/           # TypeScript interfaces
│   ├── package.json         # Node dependencies
│   └── .env                 # Environment variables
├── data/
│   ├── ARN42404-FM_5-0-000-WEB-1.pdf  # Military manual
│   └── template_fields.csv             # Form templates
├── Makefile                 # Development commands
└── README.md
```

## Environment Variables

### Backend (.env):
```bash
OPENAI_API_KEY=your_openai_api_key_here
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env):
```bash
VITE_API_URL=http://localhost:5000  # Optional: Backend URL
```

## References

### Core Technologies
- **[Flask](https://flask.palletsprojects.com/)**
- **[React](https://react.dev/)**
- **[LangChain](https://python.langchain.com/)**
- **[ChromaDB](https://www.trychroma.com/)**
- **[OpenAI API](https://platform.openai.com/)**

### Development Tools
- **[Poetry](https://python-poetry.org/)**
- **[Vite](https://vitejs.dev/)**
- **[Tailwind CSS](https://tailwindcss.com/)**

### Code Quality
- **[Black](https://black.readthedocs.io/)**
- **[Prettier](https://prettier.io/)**
- **[pre-commit](https://pre-commit.com/)**

---

**Built with Flask, React, LangChain, and ChromaDB**
