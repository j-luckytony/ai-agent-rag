/**
 * Source information for clickable links
 */
export interface SourceInfo {
  /** Display name of the source */
  name: string;
  /** URL to access the source file */
  url: string;
  /** Type of source file */
  type: 'pdf' | 'csv';
}

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
    sources_used?: SourceInfo[];
    /** AI reasoning for source selection (for assistant messages) */
    reasoning?: string;
    /** Error information if the message failed */
    error?: string;
    /** Status of the message */
    status?: string;
  };
}
