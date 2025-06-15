import { MessageCircle, RefreshCw, Settings, Trash2 } from 'lucide-react';

import React, { useEffect, useRef } from 'react';

import { useRAGAgent } from '../hooks/useRAGAgent';
import { cn } from '../lib/utils';
import { MessageList } from './ChatMessage';
import { QuestionForm, QuickQuestions } from './QuestionForm';
import { Button } from './ui';

interface ChatInterfaceProps {
  placeholder?: string;
  showSources?: boolean;
  showReasoning?: boolean;
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
 * @param showSources - Whether to show source attribution
 * @param showReasoning - Whether to show AI reasoning
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  placeholder,
  showSources = true,
  showReasoning = false,
}) => {
  const { messages, isLoading, error, sendQuestion, clearConversation, retry } =
    useRAGAgent();

  const [currentQuestion, setCurrentQuestion] = React.useState('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [localShowSources, setLocalShowSources] = React.useState(showSources);
  const [localShowReasoning, setLocalShowReasoning] =
    React.useState(showReasoning);
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

  // Sync local settings with props
  useEffect(() => {
    setLocalShowSources(showSources);
    setLocalShowReasoning(showReasoning);
  }, [showSources, showReasoning]);

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
            <h2 className="text-lg font-semibold text-gray-900">AI Agent</h2>
            <p className="text-sm text-gray-600">
              Ask about military procedures or forms
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
                checked={localShowSources}
                onChange={() => setLocalShowSources(!localShowSources)}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Reasoning</label>
              <input
                type="checkbox"
                checked={localShowReasoning}
                onChange={() => setLocalShowReasoning(!localShowReasoning)}
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
              showSources={localShowSources}
              showReasoning={localShowReasoning}
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
