import { AlertCircle, Loader2, Send } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { cn } from '../lib/utils';
import { Button, Textarea } from './ui';

interface QuestionFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (question: string) => void;
  loading?: boolean;
  placeholder?: string;
}

/**
 * QuestionForm component for inputting questions to the RAG agent
 *
 * @param value - Current input value
 * @param onChange - Callback when input changes
 * @param onSubmit - Callback when form is submitted
 * @param loading - Whether the form is in loading state
 * @param placeholder - Placeholder text for input
 */
export const QuestionForm: React.FC<QuestionFormProps> = ({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder = 'Ask me anything...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) {
      setValidationError('Please enter a question');
      return;
    }

    onSubmit(value.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }

    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();

      if (!value.trim()) {
        setValidationError('Please enter a question');
        return;
      }

      onSubmit(value.trim());
    }

    autoResizeTextarea();
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Auto-resize on value change
  useEffect(() => {
    autoResizeTextarea();
  }, [value]);

  const remainingChars = 500 - value.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars < 50 && remainingChars >= 0;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2')}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className={cn(
            'max-h-[200px] min-h-[80px] resize-none pr-12',
            validationError && 'border-red-500 focus:border-red-500',
            isOverLimit && 'border-red-500 focus:border-red-500'
          )}
        />

        <Button
          type="submit"
          size="sm"
          disabled={loading || !value.trim() || isOverLimit}
          className="absolute bottom-2 right-2 h-8 w-8 p-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          {validationError && (
            <div
              id="validation-error"
              className="flex items-center gap-1 text-red-600"
              role="alert"
            >
              <AlertCircle size={12} />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'text-gray-500',
            isOverLimit && 'text-red-600',
            isNearLimit && 'text-yellow-600'
          )}
        >
          {value.length}/500
        </div>
      </div>
    </form>
  );
};

interface QuickQuestionsProps {
  questions: string[];
  onQuestionSelect: (question: string) => void;
  className?: string;
}

/**
 * QuickQuestions component for displaying suggested questions
 *
 * @param questions - Array of suggested questions
 * @param onQuestionSelect - Callback when a question is selected
 * @param className - Additional CSS classes
 */
export const QuickQuestions: React.FC<QuickQuestionsProps> = ({
  questions,
  onQuestionSelect,
  className,
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-gray-700">Quick Questions:</h3>
      <div className="flex flex-wrap gap-2">
        {questions.map((question: string, index: number) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onQuestionSelect(question)}
            className="h-auto justify-start whitespace-normal px-3 py-2 text-left"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
};
