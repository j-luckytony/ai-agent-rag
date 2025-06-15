/**
 * A simple React hook for basic RAG agent interactions.
 */
import { v4 as uuidv4 } from 'uuid';

import { useCallback, useState } from 'react';

import { APIError, ragService } from '../services/ragService';
import type { ChatMessage } from '../types';

export interface UseRAGAgentReturn {
  /** List of chat messages */
  messages: ChatMessage[];
  /** Current loading state */
  isLoading: boolean;
  /** Current error state */
  error: APIError | null;
  /** Function to send a question */
  sendQuestion: (question: string) => Promise<void>;
  /** Function to clear the conversation */
  clearConversation: () => void;
  /** Function to retry the last failed request */
  retry: () => Promise<void>;
}

/**
 * useRAGAgent hook for managing RAG agent interactions
 *
 * @returns {UseRAGAgentReturn} Hook interface with state and actions
 * @returns {ChatMessage[]} return.messages - Array of chat messages
 * @returns {boolean} return.isLoading - Whether a request is in progress
 * @returns {APIError | null} return.error - Current error state
 * @returns {(question: string) => Promise<void>} return.sendQuestion - Send a question to the agent
 * @returns {() => void} return.clearConversation - Clear all messages
 * @returns {() => Promise<void>} return.retry - Retry the last question
 */
export const useRAGAgent = (): UseRAGAgentReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const sendQuestion = useCallback(async (question: string): Promise<void> => {
    if (!question.trim()) return;

    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: question.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await ragService.askQuestion(question.trim());

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        content: response.answer,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          sources_used: response.sources_used,
          reasoning: response.reasoning,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const apiError = new APIError(
        err.message || 'Unknown error',
        err.status || 0,
        err.details
      );
      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearConversation = useCallback((): void => {
    setMessages([]);
    setError(null);
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    const lastUserMessage = messages.filter((msg) => msg.role === 'user').pop();

    if (lastUserMessage) {
      await sendQuestion(lastUserMessage.content);
    }
  }, [messages, sendQuestion]);

  return {
    messages,
    isLoading,
    error,
    sendQuestion,
    clearConversation,
    retry,
  };
};
