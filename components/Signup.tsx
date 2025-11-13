import React, { useState } from 'react';
import { User, Role } from '../types';
import * as authService from '../services/authService';

interface SignupProps {
  onAuth: (user: User) => void;
}

const Signup: React.FC<SignupProps> = ({ onAuth }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email) {
      setError('All fields are required.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await authService.signup(name, email, role);
      onAuth(user);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-6">Create Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700"
            placeholder="Anjali Sharma"
          />
        </div>
        <div>
          <label htmlFor="email-signup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            id="email-signup"
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
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Register as a
            </label>
            <div className="mt-2 flex rounded-md shadow-sm">
                <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        role === 'student'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                >
                    Student
                </button>
                <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`relative inline-flex items-center justify-center w-1/2 -ml-px px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        role === 'admin'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                >
                    Admin
                </button>
            </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center pt-2">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
                'Sign Up'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;