const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private accessToken: string | null = localStorage.getItem('access_token');
  private refreshToken: string | null = localStorage.getItem('refresh_token');

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  get hasToken() {
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.accessToken}`;
        res = await fetch(`${API_URL}${path}`, { ...options, headers });
      }
    }

    if (res.status === 204) return undefined as T;

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
      const message = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      throw new Error(message || 'Error en la solicitud');
    }

    return res.json();
  }

  async login(email: string, password: string) {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Credenciales incorrectas' }));
      throw new Error(err.detail || 'Credenciales incorrectas');
    }
    const data = await res.json();
    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async register(email: string, fullName: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, full_name: fullName, password }),
    });
  }

  async logout() {
    if (this.refreshToken) {
      try {
        await this.request('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
      } catch {
        /* ignore */
      }
    }
    this.clearTokens();
  }

  getMe() {
    return this.request<import('../types').User>('/api/auth/me');
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(path: string) {
    return this.request<void>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
