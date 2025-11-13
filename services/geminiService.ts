import { ChatStyle, DiscussionResponse } from '../types';
import { apiService } from './apiService';

let currentConversationId: string | undefined;

export const isCaRelatedQuery = async (prompt: string): Promise<boolean> => {
  return true;
};

export const generateChatResponse = async (
  prompt: string,
  style: ChatStyle
): Promise<string | DiscussionResponse> => {
  try {
    const response = await apiService.sendMessage(prompt, style, currentConversationId);

    if (response.error) {
      throw new Error(response.error);
    }

    const data = response.data;
    currentConversationId = data.conversation_id;

    if (style === 'discussion' && data.discussion) {
      return {
        discussion: data.discussion.map((item: any) => ({
          speaker: item.speaker,
          text: item.text,
        })),
      };
    }

    return data.response;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to get a response from the AI.');
  }
};