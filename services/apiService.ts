const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async signup(name: string, email: string, role: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, role }),
    });
  }

  async login(email: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async sendMessage(message: string, mode: string, conversationId?: string) {
    return this.request('/chat/', {
      method: 'POST',
      body: JSON.stringify({
        message,
        mode,
        language: 'en',
        conversation_id: conversationId
      }),
    });
  }

  async getChatHistory(limit: number = 50) {
    return this.request(`/chat/history?limit=${limit}`, {
      method: 'GET',
    });
  }

  async uploadDocument(file: File, title: string, category: string) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async getDocuments() {
    return this.request('/documents/', {
      method: 'GET',
    });
  }

  async deleteDocument(docId: string) {
    return this.request(`/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  async transcribeAudio(audioBlob: Blob) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Transcription failed');
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async generateSpeech(text: string, language: string = 'en') {
    const token = this.getToken();

    try {
      const response = await fetch(`${API_BASE_URL}/voice/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      return { data: audioBlob };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async getAnalytics() {
    return this.request('/analytics/queries?limit=100', {
      method: 'GET',
    });
  }

  async getDashboardStats() {
    return this.request('/analytics/stats', {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
