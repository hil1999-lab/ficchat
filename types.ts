export type MessageType = 'text' | 'image' | 'time';

export interface User {
  id: string;
  name: string;
  avatar: string;
  isCurrentUser: boolean; // true = right side, false = left side
}

export interface Message {
  id: string;
  userId?: string; // Links to User.id. If undefined, usually a time/system message
  type: MessageType;
  content: string; // Text content or Base64 Image string
}

export interface ChatState {
  title: string;
  footerText: string;
}

export interface ExportData {
  html: string;
  css: string;
}
