import { MessageCircle } from 'lucide-react';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer('Error: Could not connect to backend');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            AI Agent for Document Retrieval
          </h1>
          <p className="text-gray-600">
            Ask questions about military field manuals and form templates
          </p>
        </div>

        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="question"
                className="text-sm font-medium text-gray-700"
              >
                Your Question
              </label>
              <Input
                id="question"
                type="text"
                value={question}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQuestion(e.target.value)
                }
                placeholder="Ask a question about military procedures or forms..."
                disabled={loading}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Submit Question'}
            </Button>
          </form>
        </div>

        {answer && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Answer:
            </h3>
            <div className="prose prose-gray max-w-none">
              <p className="leading-relaxed text-gray-700">{answer}</p>
            </div>
          </div>
        )}

        {!answer && !loading && (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <MessageCircle className="mx-auto h-12 w-12" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Ready to help
            </h3>
            <p className="text-gray-500">
              Ask any question about military procedures or forms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
