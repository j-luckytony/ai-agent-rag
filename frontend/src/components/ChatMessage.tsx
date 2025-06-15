import { format } from 'date-fns';
import { Bot, Clock, ExternalLink, Lightbulb, User } from 'lucide-react';

import React from 'react';

import { cn } from '../lib/utils';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  showTimestamp?: boolean;
  showSources?: boolean;
  showReasoning?: boolean;
  onClick?: (message: ChatMessageType) => void;
}

/**
 * ChatMessage component for displaying conversation messages
 *
 * @param message - The message object to display
 * @param showTimestamp - Whether to show message timestamp
 * @param showSources - Whether to show source attribution (assistant messages only)
 * @param showReasoning - Whether to show AI reasoning (assistant messages only)
 * @param onClick - Callback when message is clicked
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  showTimestamp = true,
  showSources = true,
  showReasoning = false,
  onClick,
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const hasError = message.metadata?.error;
  const hasSources =
    message.metadata?.sources_used && message.metadata.sources_used.length > 0;
  const hasReasoning = message.metadata?.reasoning;

  const handleClick = () => {
    if (onClick) {
      onClick(message);
    }
  };

  return (
    <div
      className={cn(
        'group mb-4 flex gap-3 transition-all duration-200',
        isUser ? 'flex-row-reverse' : 'flex-row',
        onClick && 'cursor-pointer hover:bg-gray-50/50'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white',
          isUser
            ? 'bg-blue-500 group-hover:bg-blue-600'
            : hasError
              ? 'bg-red-500 group-hover:bg-red-600'
              : 'bg-gray-600 group-hover:bg-gray-700'
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div
        className={cn(
          'min-w-0 flex-1 space-y-2',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'ml-auto bg-blue-500 text-white'
              : hasError
                ? 'border border-red-200 bg-red-50 text-red-900'
                : 'border border-gray-200 bg-white text-gray-900 shadow-sm'
          )}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {hasError && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Error occurred
            </div>
          )}
        </div>

        {isAssistant && showSources && hasSources && (
          <div className="max-w-[80%] rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <ExternalLink size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-800">
                Sources Used
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {message.metadata!.sources_used!.map((source, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {isAssistant && showReasoning && hasReasoning && (
          <div className="max-w-[80%] rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb size={14} className="text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">
                AI Reasoning
              </span>
            </div>
            <p className="text-xs leading-relaxed text-yellow-700">
              {message.metadata!.reasoning}
            </p>
          </div>
        )}

        {showTimestamp && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs text-gray-500',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <Clock size={12} />
            <span>{format(message.timestamp, 'h:mm a')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface MessageListProps {
  messages: ChatMessageType[];
  showSources?: boolean;
  showReasoning?: boolean;
}

/**
 * MessageList component for displaying a list of chat messages
 *
 * @param messages - Array of messages to display
 * @param showSources - Whether to show source attribution
 * @param showReasoning - Whether to show AI reasoning
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  showSources = true,
  showReasoning = false,
}) => {
  return (
    <div className="space-y-1">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          showSources={showSources}
          showReasoning={showReasoning}
        />
      ))}
    </div>
  );
};
