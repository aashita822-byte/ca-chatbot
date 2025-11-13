import React, { useState } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

interface LoginProps {
  onAuth: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Email address is required.');
      return;
    }
    setIsLoading(true);
    try {
      // In a real app, you'd also send a password. We're keeping it simple.
      const user = await authService.login(email);
      onAuth(user);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-6">Log In</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700"
            placeholder="you@example.com"
          />
        </div>
        
        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
                'Log In'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;