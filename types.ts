export type Sender = 'user' | 'ai' | 'usera' | 'userb';
export type ChatStyle = 'qa' | 'discussion';
export type AppView = 'chat' | 'admin';
export type Role = 'student' | 'admin';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
}

export interface DiscussionPart {
    speaker: 'User A' | 'User B';
    text: string;
}

export interface DiscussionResponse {
    discussion: DiscussionPart[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface DocumentMetadata {
  id: string;
  name:string;
  size: number; // in bytes
  type: string;
  uploadedAt: string; // ISO string date
}