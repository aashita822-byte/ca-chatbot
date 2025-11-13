import { User, Role, ChatMessage } from '../types';
import { apiService } from './apiService';

const CURRENT_USER_KEY = 'ca_chatbot_current_user';

export const login = async (email: string): Promise<User> => {
  const response = await apiService.login(email);

  if (response.error) {
    throw new Error(response.error);
  }

  const { access_token, user } = response.data;
  apiService.setToken(access_token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  return user;
};

export const signup = async (name: string, email: string, role: Role): Promise<User> => {
  const response = await apiService.signup(name, email, role);

  if (response.error) {
    throw new Error(response.error);
  }

  const { access_token, user } = response.data;
  apiService.setToken(access_token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  return user;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  apiService.clearToken();
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  const response = await apiService.getChatHistory(50);

  if (response.error || !response.data) {
    return [];
  }

  return response.data.map((item: any) => ({
    id: item.id,
    sender: 'user',
    text: item.message,
  }));
};

export const saveChatHistory = (userId: string, messages: ChatMessage[]) => {
  return;
};