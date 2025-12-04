// Facade para manter compatibilidade de imports: '@/services/api'
export { apiClient, api } from './client';

import { api as _api } from './client';

export class AuthService {
  static async forgotPassword(email: string) {
    return _api.post('/auth/forgot-password', { email });
  }
  static async validateResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
    // GET com query param
    return _api.get('/auth/validate-reset-token', { token });
  }
  static async resetPassword(token: string, newPassword: string) {
    return _api.post('/auth/reset-password', { token, newPassword });
  }
  static async login(credentials: { username: string; password: string }) {
    return _api.post('/auth/login', credentials);
  }
  static logout() {
    return (window.localStorage && (localStorage.removeItem('access_token'), localStorage.removeItem('refresh_token'), localStorage.removeItem('user')));
  }
}

export const authService = {
  validateResetToken: (token: string) => AuthService.validateResetToken(token),
  resetPassword: (token: string, newPassword: string) => AuthService.resetPassword(token, newPassword),
};

