from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/query', methods=['POST'])
def query():
    data = request.get_json()
    question = data.get('question', '')
    
    # TODO: implement AI agent logic
    return jsonify({
        "answer": f"You asked: {question}. AI agent not implemented yet.",
        "sources": []
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
