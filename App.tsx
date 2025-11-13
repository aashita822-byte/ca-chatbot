import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatStyle, Sender, AppView, User, Role } from './types';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import InputPanel from './components/InputPanel';
import AdminPage from './components/AdminPage';
import AuthPage from './components/AuthPage';
import { generateChatResponse, isCaRelatedQuery } from './services/geminiService';
import * as authService from './services/authService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatStyle, setChatStyle] = useState<ChatStyle>('qa');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState<boolean>(true);
  const [view, setView] = useState<AppView>('chat');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for an active session on initial load
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Load chat history or initial message when user logs in or view changes
  useEffect(() => {
    if (currentUser?.role === 'student') {
      const history = authService.getChatHistory(currentUser.id);
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
            {
                id: 'initial-message',
                sender: 'ai',
                text: `Hello ${currentUser.name}! I'm your AI assistant for CA studies. How can I help you today?`,
            },
        ]);
      }
    } else if (currentUser?.role === 'admin' && view === 'chat' && messages.length === 0) {
       setMessages([
            {
                id: 'initial-message-admin',
                sender: 'ai',
                text: `Welcome, Admin. You can test the chatbot functionality here.`,
            },
        ]);
    }
  }, [currentUser, view]);

  // Save chat history whenever messages change for a student
  useEffect(() => {
    if (currentUser?.role === 'student' && messages.length > 1) {
      authService.saveChatHistory(currentUser.id, messages);
    }
  }, [messages, currentUser]);


  const speak = useCallback((text: string, prefix: string = '') => {
    if (!isVoiceOutputEnabled || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(prefix ? `${prefix}, ${text}` : text);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  }, [isVoiceOutputEnabled]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Gatekeeper check: Is the query related to CA?
      const isRelated = await isCaRelatedQuery(inputText);

      if (!isRelated) {
        const offTopicMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "I specialize in topics related to Chartered Accountancy. Please ask a question about accounting, tax, audit, or other CA subjects.",
        };
        setMessages(prev => [...prev, offTopicMessage]);
        speak(offTopicMessage.text);
        setIsLoading(false);
        return; // Stop processing
      }

      const response = await generateChatResponse(inputText, chatStyle);

      if (chatStyle === 'discussion' && typeof response !== 'string') {
        const discussionMessages: ChatMessage[] = response.discussion.map((item, index) => ({
          id: `${Date.now()}-${index}`,
          sender: item.speaker.toLowerCase().replace(' ', '') as Sender,
          text: item.text,
        }));
        setMessages(prev => [...prev, ...discussionMessages]);

        // Speak discussion parts sequentially
        if (isVoiceOutputEnabled) {
          window.speechSynthesis.cancel();
          for (const msg of discussionMessages) {
             const prefix = msg.sender === 'usera' ? 'User A says' : 'User B says';
             speak(msg.text, prefix);
          }
        }
        
      } else if (chatStyle === 'qa' && typeof response === 'string') {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: response,
        };
        setMessages(prev => [...prev, aiMessage]);
        speak(response);
      }
    } catch (error) {
      console.error('Error fetching response from Gemini:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
      speak(errorMessage.text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setMessages([]);
    setView('chat');
  }

  if (!currentUser) {
    return <AuthPage onAuth={setCurrentUser} />;
  }

  const renderContent = () => {
    if (currentUser.role === 'admin' && view === 'admin') {
        return <AdminPage />;
    }

    return (
        <>
            <div className="flex-1 overflow-hidden">
                <ChatInterface messages={messages} isLoading={isLoading} />
            </div>
            <InputPanel
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                chatStyle={chatStyle}
                setChatStyle={setChatStyle}
                isVoiceOutputEnabled={isVoiceOutputEnabled}
                setIsVoiceOutputEnabled={setIsVoiceOutputEnabled}
            />
        </>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        currentView={view} 
        setView={setView} 
      />
      {renderContent()}
    </div>
  );
};

export default App;