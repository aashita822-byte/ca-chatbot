import React from 'react';
import { AppView, User } from '../types';
import { LogoutIcon } from './icons';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    currentView: AppView;
    setView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, currentView, setView }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">
        CA Student AI Chatbot
      </h1>
      <div className="flex items-center gap-4">
        {user.role === 'admin' && (
            <nav className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                <button 
                onClick={() => setView('chat')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    currentView === 'chat' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                >
                Chat
                </button>
                <button 
                onClick={() => setView('admin')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    currentView === 'admin' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                >
                Admin Panel
                </button>
            </nav>
        )}
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                Welcome, <span className="font-bold">{user.name}</span>
            </span>
            <button
                onClick={onLogout}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Logout"
            >
                <LogoutIcon />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;