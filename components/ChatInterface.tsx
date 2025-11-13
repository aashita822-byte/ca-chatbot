
import React, { useRef, useEffect } from 'react';
import { ChatMessage, Sender } from '../types';
import { UserIcon, BotIcon, UserAIcon, UserBIcon } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const getSenderInfo = (sender: Sender) => {
  switch (sender) {
    case 'user':
      return {
        align: 'justify-end',
        bubbleColor: 'bg-blue-600 text-white',
        icon: <UserIcon />,
        name: 'You',
        nameColor: 'text-gray-500 dark:text-gray-400',
      };
    case 'ai':
      return {
        align: 'justify-start',
        bubbleColor: 'bg-white dark:bg-gray-700',
        icon: <BotIcon />,
        name: 'AI Tutor',
        nameColor: 'text-blue-500',
      };
    case 'usera':
      return {
        align: 'justify-start',
        bubbleColor: 'bg-teal-50 dark:bg-teal-900/50 border border-teal-200 dark:border-teal-700',
        icon: <UserAIcon />,
        name: 'User A',
        nameColor: 'text-teal-500',
      };
    case 'userb':
      return {
        align: 'justify-start',
        bubbleColor: 'bg-purple-50 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-700',
        icon: <UserBIcon />,
        name: 'User B',
        nameColor: 'text-purple-500',
      };
    default:
      return {
        align: 'justify-start',
        bubbleColor: 'bg-gray-200 dark:bg-gray-700',
        icon: <BotIcon />,
        name: 'AI',
        nameColor: 'text-gray-500 dark:text-gray-400',
      };
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  return (
    <div className="p-4 md:p-6 space-y-6 h-full overflow-y-auto">
      {messages.map((message) => {
        const { align, bubbleColor, icon, name, nameColor } = getSenderInfo(message.sender);
        return (
          <div key={message.id} className={`flex items-end gap-3 ${align}`}>
            {message.sender !== 'user' && <div className="flex-shrink-0">{icon}</div>}
            <div className={`w-full max-w-lg ${message.sender === 'user' ? 'order-last' : ''}`}>
               {message.sender !== 'user' && <p className={`text-sm font-semibold mb-1 ${nameColor}`}>{name}</p>}
              <div
                className={`px-4 py-3 rounded-2xl ${bubbleColor} ${
                  message.sender === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                } shadow-sm`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
            {message.sender === 'user' && <div className="flex-shrink-0">{icon}</div>}
          </div>
        );
      })}

      {isLoading && (
        <div className="flex items-end gap-3 justify-start">
          <BotIcon />
          <div>
            <p className="text-sm font-semibold mb-1 text-blue-500">AI Tutor</p>
            <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white dark:bg-gray-700 shadow-sm">
                <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></span>
                </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;
