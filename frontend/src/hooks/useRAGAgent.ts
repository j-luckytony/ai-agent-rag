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
  /** Whether streaming mode is enabled */
  streamingMode: boolean;
  /** Function to send a question */
  sendQuestion: (question: string) => Promise<void>;
  /** Function to clear the conversation */
  clearConversation: () => void;
  /** Function to retry the last failed request */
  retry: () => Promise<void>;
  /** Function to toggle streaming mode */
  toggleStreamingMode: () => void;
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
 * @returns {() => void} return.toggleStreamingMode - Toggle streaming mode
 */
export const useRAGAgent = (): UseRAGAgentReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [streamingMode, setStreamingMode] = useState(false);

  const sendQuestion = useCallback(
    async (question: string): Promise<void> => {
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

      let assistantId: string | null = null;

      try {
        if (streamingMode) {
          // Create placeholder assistant message for streaming
          assistantId = uuidv4();
          const assistantMessage: ChatMessage = {
            id: assistantId,
            content: '',
            role: 'assistant',
            timestamp: new Date(),
            metadata: {
              sources_used: [],
              reasoning: '',
            },
          };
          setMessages((prev) => [...prev, assistantMessage]);

          let contentBuffer = '';

          await ragService.askQuestionStream(question.trim(), (chunk) => {
            switch (chunk.type) {
              case 'sources':
                // Update message with sources and reasoning
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? {
                          ...msg,
                          metadata: {
                            sources_used: chunk.sources_used || [],
                            reasoning: chunk.reasoning || '',
                          },
                        }
                      : msg
                  )
                );
                break;

              case 'chunk':
                // Append content chunk
                if (chunk.content) {
                  contentBuffer += chunk.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: contentBuffer }
                        : msg
                    )
                  );
                }
                break;

              case 'complete':
                // Final response with complete answer
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? {
                          ...msg,
                          content: chunk.answer || contentBuffer,
                          metadata: {
                            sources_used:
                              chunk.sources_used ||
                              msg.metadata?.sources_used ||
                              [],
                            reasoning:
                              chunk.reasoning || msg.metadata?.reasoning || '',
                          },
                        }
                      : msg
                  )
                );
                break;

              case 'error':
                throw new APIError(chunk.error || 'Streaming error', 500);
            }
          });
        } else {
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
        }
      } catch (err: any) {
        if (streamingMode && assistantId) {
          // Remove the placeholder message on error
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
        }

        const apiError = new APIError(
          err.message || 'Unknown error',
          err.status || 0,
          err.details
        );
        setError(apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [streamingMode]
  );

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

  const toggleStreamingMode = useCallback((): void => {
    setStreamingMode((prev) => !prev);
  }, []);

  return {
    messages,
    isLoading,
    error,
    streamingMode,
    sendQuestion,
    clearConversation,
    retry,
    toggleStreamingMode,
  };
};
