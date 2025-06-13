import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
CORS(app, origins=[frontend_url])


@app.route("/health")
def health():
    return jsonify({"status": "ok", "message": "AI Agent backend is running"})


@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()
    question = data.get("question", "")

    # TODO: implement AI agent logic
    return jsonify(
        {
            "answer": f"You asked: {question}. AI agent not implemented yet.",
            "sources": [],
        }
    )


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
