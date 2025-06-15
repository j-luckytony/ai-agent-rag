/**
 * RAG API Service
 *
 * This service handles all communication with the RAG backend API.
 * It provides a clean interface for sending questions and receiving responses,
 * with proper error handling, timeout management, and type safety.
 */

export interface RAGResponse {
  /** The generated answer from the AI */
  answer: string;
  /** List of sources that were used to generate the answer */
  sources_used: string[];
  /** AI's reasoning for why these sources were selected */
  reasoning: string;
  /** Optional status information */
  status?: string;
}

export interface APIConfig {
  /** Base URL for the backend API */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Default headers to include with requests */
  headers?: Record<string, string>;
}

const DEFAULT_CONFIG: APIConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

export class RAGService {
  private config: APIConfig;

  /**
   * Initialize the RAG service with custom configuration
   * @param config - Custom API configuration
   */
  constructor(config: Partial<APIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Send a question to the RAG agent and get a response
   * @param question - The question to ask
   * @returns Promise that resolves to the RAG response
   * @throws APIError if the request fails
   */
  async askQuestion(question: string): Promise<RAGResponse> {
    if (!question.trim()) {
      throw new APIError('Question cannot be empty', 400);
    }

    try {
      const controller = new AbortController();
      const timeoutId = this.config.timeout
        ? setTimeout(() => controller.abort(), this.config.timeout)
        : null;

      const response = await fetch(`${this.config.baseUrl}/query`, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify({ question: question.trim() }),
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.details
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!this.isValidRAGResponse(data)) {
        throw new APIError('Invalid response format from server', 500);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new APIError('Request timeout', 408);
        }
        throw new APIError(`Network error: ${error.message}`, 0);
      }

      throw new APIError('Unknown error occurred', 500);
    }
  }

  /**
   * Validate that a response matches the expected RAG response structure
   * @param data - Data to validate
   * @returns True if valid RAG response
   */
  private isValidRAGResponse(data: unknown): data is RAGResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as Record<string, unknown>).answer === 'string' &&
      Array.isArray((data as Record<string, unknown>).sources_used) &&
      typeof (data as Record<string, unknown>).reasoning === 'string'
    );
  }
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 0,
    public details?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Default service instance
 */
export const ragService = new RAGService();
