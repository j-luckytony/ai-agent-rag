# AI Agent for Document Retrieval

A RAG-based AI agent that retrieves information from military field manuals and form templates.

## Quick Start

### Environment Setup

1. **Backend Configuration**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

2. **Frontend Configuration**:
   ```bash
   cd frontend  
   cp .env.example .env
   # Default API URL is http://localhost:5000
   ```

### Installation & Running

1. **Install dependencies**:
   ```bash
   make install
   ```

2. **Start backend**:
   ```bash
   make run-backend
   ```

3. **Start frontend** (in another terminal):
   ```bash
   make run-frontend
   ```

4. **Open in browser**: http://localhost:3000
