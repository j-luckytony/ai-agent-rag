import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from agent import RAGAgent

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
CORS(app, origins=[frontend_url])


# Initialize RAG agent
def initialize_agent():
    """Initialize RAG Agent"""
    global rag_agent
    try:
        rag_agent = RAGAgent()
        # Load data during startup for better performance
        rag_agent.load_data()
        print("RAG Agent initialized successfully with data loaded")
    except Exception as e:
        print(f"Failed to initialize RAG Agent: {e}")
        rag_agent = None


initialize_agent()


@app.route("/health")
def health():
    return jsonify({"status": "ok", "message": "AI Agent backend is running"})


@app.route("/files/<filename>")
def serve_file(filename):
    """Serve static files (PDF, CSV) from the data directory"""
    try:
        # Get the data directory path (one level up from backend)
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        return send_from_directory(data_dir, filename)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404


@app.route("/query", methods=["POST"])
def query():
    if not rag_agent:
        return (
            jsonify(
                {"error": "RAG Agent not initialized. Please check OpenAI API key."}
            ),
            500,
        )

    data = request.get_json()
    question = data.get("question", "")

    if not question.strip():
        return jsonify({"error": "Question is required"}), 400

    try:
        # Process query using RAG agent
        result = rag_agent.process_query(question)
        return jsonify(result)

    except Exception as e:
        print(f"Error processing query: {e}")
        return (
            jsonify({"error": "An error occurred while processing your question"}),
            500,
        )


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
