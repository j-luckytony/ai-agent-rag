import { MessageCircle, RefreshCw, Settings, Trash2, Zap } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useRAGAgent } from '../hooks/useRAGAgent';
import { cn } from '../lib/utils';
import { MessageList } from './ChatMessage';
import { QuestionForm, QuickQuestions } from './QuestionForm';
import { Button } from './ui';

interface ChatInterfaceProps {
  placeholder?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the basic military procedures?',
  'How do I fill out form DD-214?',
  'What documents do I need for deployment?',
];

/**
 * ChatInterface component providing a complete conversational experience
 *
 * @param placeholder - Custom placeholder text for input
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  placeholder,
}) => {
  const {
    messages,
    isLoading,
    error,
    streamingMode,
    sendQuestion,
    clearConversation,
    retry,
    toggleStreamingMode,
  } = useRAGAgent();

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const userMessageCount = messages.filter((msg) => msg.role === 'user').length;
  const assistantMessageCount = messages.filter(
    (msg) => msg.role === 'assistant'
  ).length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuestionSubmit = async (question: string) => {
    setCurrentQuestion('');
    await sendQuestion(question);
  };

  const handleQuickQuestion = (question: string) => {
    setCurrentQuestion(question);
    handleQuestionSubmit(question);
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border bg-white shadow-sm'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              AI Agent{' '}
              {streamingMode && (
                <span className="text-sm text-blue-600">(Streaming)</span>
              )}
            </h2>
            <p className="text-sm text-gray-600">
              Ask about military procedures or forms
              {streamingMode
                ? ' • Real-time responses'
                : ' • Standard responses'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toggleStreamingMode();
            }}
            disabled={isLoading}
            className={cn(
              'h-8 w-8 p-0 transition-colors',
              isLoading
                ? 'cursor-not-allowed opacity-50'
                : streamingMode
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'text-gray-600 hover:text-gray-700'
            )}
            title={
              isLoading
                ? 'Cannot change streaming mode while processing'
                : streamingMode
                  ? 'Streaming Mode: ON'
                  : 'Streaming Mode: OFF'
            }
          >
            <Zap
              className={cn(
                'h-4 w-4',
                streamingMode && !isLoading && 'text-blue-600'
              )}
            />
          </Button>
          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-gray-50 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Sources</label>
              <input
                type="checkbox"
                checked={showSources}
                onChange={() => setShowSources(!showSources)}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Reasoning</label>
              <input
                type="checkbox"
                checked={showReasoning}
                onChange={() => setShowReasoning(!showReasoning)}
                className="rounded"
              />
            </div>
            <div className="text-xs text-gray-500">
              Messages: {userMessageCount} questions, {assistantMessageCount}{' '}
              responses
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Welcome to AI Agent
            </h3>
            <p className="mb-6 max-w-md text-gray-600">
              Ask me about military procedures, forms, or any other questions
              you have.
            </p>
            <QuickQuestions
              questions={SUGGESTED_QUESTIONS}
              onQuestionSelect={handleQuickQuestion}
            />
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              showSources={showSources}
              showReasoning={showReasoning}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-t bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <span className="font-medium">Error:</span>
              <span>{error.message}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={retry}
              className="text-red-600 hover:text-red-700"
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <QuestionForm
          value={currentQuestion}
          onChange={setCurrentQuestion}
          onSubmit={handleQuestionSubmit}
          loading={isLoading}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
