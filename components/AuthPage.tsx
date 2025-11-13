import React, { useState } from 'react';
import { User } from '../types';
import Login from './Login';
import Signup from './Signup';

interface AuthPageProps {
  onAuth: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400 mb-2">
            Welcome to CA-Bot
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Your AI-powered study partner for Chartered Accountancy.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {isLoginView ? (
            <Login onAuth={onAuth} />
          ) : (
            <Signup onAuth={onAuth} />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
            >
              {isLoginView
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;