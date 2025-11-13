import { User, Role, ChatMessage } from '../types';

// --- DATABASE SIMULATION using localStorage ---
// In a production application, all functions in this file would be replaced with API calls
// to a secure backend server (e.g., built with Node.js/Express) that interacts with a MongoDB database.

const USERS_KEY = 'ca_chatbot_users';
const CURRENT_USER_KEY = 'ca_chatbot_current_user';
const CHATS_KEY_PREFIX = 'ca_chatbot_chats_';

// Initialize with a default admin and student if no users exist
const initializeUsers = () => {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    const defaultUsers: User[] = [
      { id: 'admin-1', name: 'Admin', email: 'admin@ca.com', role: 'admin' },
      { id: 'student-1', name: 'Anjali', email: 'anjali@ca.com', role: 'student' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
};

initializeUsers();

// REAL-WORLD: This would not exist on the client.
const getUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// REAL-WORLD: This would not exist on the client.
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// --- AUTHENTICATION & SESSION MANAGEMENT ---

/**
 * SIMULATION: Logs a user in by checking their email in localStorage.
 * REAL-WORLD: This would be an API call `POST /api/auth/login`.
 * The backend would verify the user's credentials (e.g., email and password) against
 * the 'users' collection in MongoDB, and if successful, return a JWT (JSON Web Token)
 * for session management. The token would be stored on the client.
 */
export const login = (email: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        resolve(user);
      } else {
        reject(new Error('User not found. Please sign up first.'));
      }
    }, 1000);
  });
};

/**
 * SIMULATION: Signs a new user up and stores them in localStorage.
 * REAL-WORLD: This would be an API call `POST /api/auth/signup`.
 * The backend would validate the inputs, check if the email is already in use,
 * create a new user document in the MongoDB 'users' collection, and return a JWT.
 */
export const signup = (name: string, email: string, role: Role): Promise<User> => {
   return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
        const users = getUsers();
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            reject(new Error('An account with this email already exists.'));
            return;
        }

        const newUser: User = {
            id: `${role}-${Date.now()}`,
            name,
            email,
            role,
        };
        
        users.push(newUser);
        saveUsers(users);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        resolve(newUser);
    }, 1500);
  });
};

/**
 * SIMULATION: Logs out by clearing the current user from localStorage.
 * REAL-WORLD: This would clear the JWT from the client's storage. It might also
 * call a backend endpoint `POST /api/auth/logout` if using a token blacklist.
 */
export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

/**
 * SIMULATION: Gets the current user from localStorage.
 * REAL-WORLD: This function would typically decode the stored JWT to get user info,
 * or it might make an API call like `GET /api/users/me` to validate the token and
 * get up-to-date user data from MongoDB.
 */
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};


// --- CHAT HISTORY MANAGEMENT ---

/**
 * SIMULATION: Retrieves chat history from localStorage.
 * REAL-WORLD: This would be an API call `GET /api/chats`. The backend would
 * find the chat history document in MongoDB associated with the authenticated user's ID.
 */
export const getChatHistory = (userId: string): ChatMessage[] => {
    const historyJson = localStorage.getItem(`${CHATS_KEY_PREFIX}${userId}`);
    return historyJson ? JSON.parse(historyJson) : [];
};

/**
 * SIMULATION: Saves chat history to localStorage.
 * REAL-WORLD: This would be an API call `POST /api/chats` or `PUT /api/chats`.
 * The backend would receive the new message array and update the corresponding
 * chat history document in MongoDB for that user.
 */
export const saveChatHistory = (userId: string, messages: ChatMessage[]) => {
    if (!userId) return;
    localStorage.setItem(`${CHATS_KEY_PREFIX}${userId}`, JSON.stringify(messages));
};