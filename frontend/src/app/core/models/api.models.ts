export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: string;
  businessName: string;
  plan: string;
}

export interface Chatbot {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  personality?: string;
  language: string;
  status: string;
  widgetColor: string;
  widgetPosition: string;
  welcomeMessage: string;
  fallbackMessage: string;
  collectLead: boolean;
  leadTrigger: string;
  handoffEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSource {
  id: string;
  chatbotId: string;
  sourceType: string;
  title: string;
  status: string;
  chunkCount: number;
  websiteUrl?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  chatbotId: string;
  sessionId: string;
  channel: string;
  status: string;
  startedAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  chatbotId: string;
  conversationId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  source?: string;
  intent?: string;
  status: string;
  notes?: string;
  createdAt: string;
}
