import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Chatbot, KnowledgeSource, Conversation, Lead, PageResponse, Message } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  private streamBase = environment.streamUrl;

  constructor(private http: HttpClient) {}

  // Chatbots
  getChatbots(): Observable<ApiResponse<Chatbot[]>> {
    return this.http.get<ApiResponse<Chatbot[]>>(`${this.base}/chatbots`);
  }

  getChatbot(id: string): Observable<ApiResponse<Chatbot>> {
    return this.http.get<ApiResponse<Chatbot>>(`${this.base}/chatbots/${id}`);
  }

  createChatbot(data: Partial<Chatbot>): Observable<ApiResponse<Chatbot>> {
    return this.http.post<ApiResponse<Chatbot>>(`${this.base}/chatbots`, data);
  }

  updateChatbot(id: string, data: Partial<Chatbot>): Observable<ApiResponse<Chatbot>> {
    return this.http.put<ApiResponse<Chatbot>>(`${this.base}/chatbots/${id}`, data);
  }

  deleteChatbot(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/chatbots/${id}`);
  }

  getEmbedCode(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/chatbots/${id}/embed`);
  }

  generateApiKey(chatbotId: string, label = 'Default'): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/chatbots/${chatbotId}/api-key?label=${label}`, {});
  }

  // Knowledge
  getKnowledgeSources(chatbotId: string): Observable<ApiResponse<KnowledgeSource[]>> {
    return this.http.get<ApiResponse<KnowledgeSource[]>>(`${this.base}/chatbots/${chatbotId}/knowledge`);
  }

  addTextKnowledge(chatbotId: string, title: string, content: string): Observable<ApiResponse<KnowledgeSource>> {
    return this.http.post<ApiResponse<KnowledgeSource>>(`${this.base}/chatbots/${chatbotId}/knowledge/text`, { title, content });
  }

  addFaqKnowledge(chatbotId: string, title: string, faqs: any[]): Observable<ApiResponse<KnowledgeSource>> {
    return this.http.post<ApiResponse<KnowledgeSource>>(`${this.base}/chatbots/${chatbotId}/knowledge/faq`, { title, faqs });
  }

  addUrlKnowledge(chatbotId: string, url: string, title?: string, maxPages = 1): Observable<ApiResponse<KnowledgeSource>> {
    return this.http.post<ApiResponse<KnowledgeSource>>(`${this.base}/chatbots/${chatbotId}/knowledge/url`, { url, title, maxPages });
  }

  uploadFile(chatbotId: string, file: File): Observable<ApiResponse<KnowledgeSource>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<KnowledgeSource>>(`${this.base}/chatbots/${chatbotId}/knowledge/upload`, formData);
  }

  deleteKnowledgeSource(chatbotId: string, sourceId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/chatbots/${chatbotId}/knowledge/${sourceId}`);
  }

  // Conversations
  getConversations(page = 0, size = 20): Observable<ApiResponse<PageResponse<Conversation>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Conversation>>>(`${this.base}/conversations`, { params });
  }

  getConversation(id: string): Observable<ApiResponse<{ conversation: Conversation; messages: Message[] }>> {
    return this.http.get<ApiResponse<{ conversation: Conversation; messages: Message[] }>>(`${this.base}/conversations/${id}`);
  }

  resolveConversation(id: string): Observable<ApiResponse<Conversation>> {
    return this.http.put<ApiResponse<Conversation>>(`${this.base}/conversations/${id}/resolve`, {});
  }

  // Leads
  getLeads(page = 0, size = 20): Observable<ApiResponse<PageResponse<Lead>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<Lead>>>(`${this.base}/leads`, { params });
  }

  updateLead(id: string, updates: { status?: string; notes?: string }): Observable<ApiResponse<Lead>> {
    return this.http.put<ApiResponse<Lead>>(`${this.base}/leads/${id}`, updates);
  }

  // Plans & Payments
  getPlans(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/plans`);
  }

  getSubscriptionStatus(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/payments/subscription`);
  }

  getUsage(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/payments/usage`);
  }

  subscribe(planName: string): Observable<ApiResponse<{ subscriptionId: string; keyId: string }>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/payments/subscribe`, { planName });
  }

  cancelSubscription(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/payments/cancel`, {});
  }

  // Chat
  startChat(botId: string): Observable<ApiResponse<{ sessionId: string }>> {
    return this.http.post<ApiResponse<{ sessionId: string }>>(`${this.base}/chat/start`, { botId, channel: 'test' });
  }

  sendChatMessage(sessionId: string, message: string): Observable<string> {
    return new Observable(observer => {
      const controller = new AbortController();
      (async () => {
        try {
          const res = await fetch(`${this.streamBase}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('bf_access_token') || ''}` },
            body: JSON.stringify({ sessionId, message, channel: 'test' }),
            signal: controller.signal
          });
          if (!res.ok || !res.body) { observer.error(new Error(`HTTP ${res.status}`)); return; }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';  // keep last incomplete line in buffer
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              console.log('[SSE raw line]', JSON.stringify(trimmed));
              let jsonStr = trimmed;
              if (jsonStr.startsWith('data:')) jsonStr = jsonStr.slice(5).trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                console.log('[SSE parsed]', parsed);
                if (parsed.token !== undefined) observer.next(parsed.token);
                else if (parsed.type === 'done') { observer.complete(); return; }
              } catch (e) {
                console.warn('[SSE parse error]', jsonStr, e);
              }
            }
          }
          observer.complete();
        } catch (e: any) {
          if (!controller.signal.aborted) observer.error(e);
        }
      })();
      return () => controller.abort();
    });
  }
}
