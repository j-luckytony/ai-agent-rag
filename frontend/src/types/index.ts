/**
 * Represents a single message in the conversation
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** The message content/text */
  content: string;
  /** Whether this message is from the user or AI */
  role: 'user' | 'assistant';
  /** Timestamp when the message was created */
  timestamp: Date;
  /** Optional metadata for the message */
  metadata?: {
    /** Sources used to generate this response (for assistant messages) */
    sources_used?: string[];
    /** AI reasoning for source selection (for assistant messages) */
    reasoning?: string;
    /** Whether this message is currently being streamed */
    isStreaming?: boolean;
    /** Error information if the message failed */
    error?: string;
  };
}
